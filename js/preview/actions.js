import { renderMermaidDiagrams } from './mermaid-renderer.js';
import { getBrightness, applyBrightness, DEFAULT_LIGHT_BRIGHTNESS } from '../common/theme-engine.js';
import { setTheme, setPreviewCss } from '../common/theme-controller.js';

/**
 * @typedef {{ set: (opts: object) => { from: (el: Element) => { save: () => Promise<void> } } }} Html2PdfInstance
 */

const HTML2PDF_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';

let html2pdfPromise = null;
let loadHtml2Pdf = () => {
  if (typeof window.html2pdf === 'function') return Promise.resolve(window.html2pdf);
  if (html2pdfPromise) return html2pdfPromise;
  html2pdfPromise = new Promise((resolve, reject) => {
    let s = document.createElement('script');
    s.src = HTML2PDF_CDN;
    s.crossOrigin = 'anonymous';
    s.onload = () => {
      if (typeof window.html2pdf === 'function') resolve(window.html2pdf);
      else reject(new Error('html2pdf global not found after load'));
    };
    s.onerror = () => {
      html2pdfPromise = null;
      reject(new Error('Failed to load html2pdf from CDN'));
    };
    document.head.appendChild(s);
  });
  return html2pdfPromise;
};

export let copyToClipboard = (text, success, error) => {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(success, error);
  } else {
    let ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed'; ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); success(); } catch (e) { error(e); }
    document.body.removeChild(ta);
  }
};

export let initCopyButton = (editor) => {
  let copyBtn = document.querySelector('#copy-button');
  if (!copyBtn || !editor) return;

  let notifyCopied = () => {
    copyBtn.title = 'Copied!';
    setTimeout(() => { copyBtn.title = 'Copy'; }, 1000);
  };

  copyBtn.addEventListener('click', (e) => {
    e.preventDefault();
    copyToClipboard(editor.value, notifyCopied, () => {});
  });
};

export let initDownloadButton = (editor) => {
  let downloadBtn = document.querySelector('#download-button');
  if (!downloadBtn || !editor) return;

  downloadBtn.addEventListener('click', (e) => {
    e.preventDefault();
    let blob = new Blob([editor.value], { type: 'text/markdown' });
    let url = URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url;
    a.download = 'document.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
};



export let exportPreviewToPdf = async (previewWrapper, outputEl) => {
  if (!previewWrapper || !outputEl) return;
  let html2pdf;
  try {
    html2pdf = await loadHtml2Pdf();
  } catch (e) {
    console.warn('[actions] html2pdf is not loaded — PDF export is unavailable.', e);
    window.alert('PDF export is not available. Check your network connection and try again.');
    return;
  }

  let originalBrightness = getBrightness();
  let wasDark = originalBrightness >= 50;

  try {
    // Temporarily switch live preview to light theme so that html2canvas computes light mode styles correctly.
    applyBrightness(DEFAULT_LIGHT_BRIGHTNESS);
    setTheme(false);
    await setPreviewCss(false);
    await renderMermaidDiagrams(outputEl, 'default');

    // Wait for fonts to be ready and styles to recalculate/repaint
    await document.fonts.ready;
    await new Promise((resolve) => setTimeout(resolve, 150));

    let options = {
      margin: 10,
      filename: 'markdown-preview.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      pagebreak: { mode: ['avoid-all', 'css'] },
      html2canvas: {
        scale: 2, useCORS: true,
        onclone: (clonedDoc) => {
          clonedDoc.documentElement.setAttribute('data-theme', 'light');
          let hue = clonedDoc.documentElement.style.getPropertyValue('--hue');
          clonedDoc.documentElement.removeAttribute('style');
          if (hue) {
            clonedDoc.documentElement.style.setProperty('--hue', hue);
          }

          // Inject pagebreak and font override CSS
          let pbStyle = clonedDoc.createElement('style');
          pbStyle.id = 'export-pagebreaks';
          pbStyle.textContent = `
            h1, h2, h3, h4, h5, h6 { page-break-after: avoid; break-after: avoid; }
            pre, blockquote, table, tr, img, .mermaid, li:not(:has(ul)):not(:has(ol)) { page-break-inside: avoid; break-inside: avoid; }
            .markdown-body pre.mermaid { max-width: 100% !important; }
            .markdown-body .mermaid svg { max-width: 100% !important; height: auto !important; }
            #preview-wrapper, .markdown-body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif !important;
            }
            .markdown-body code, .markdown-body pre, .markdown-body tt, .markdown-body pre code {
              font-family: Consolas, "Liberation Mono", Menlo, "Courier New", monospace !important;
            }
          `;
          clonedDoc.head.appendChild(pbStyle);

          let cpw = clonedDoc.getElementById('preview-wrapper');
          if (cpw) { cpw.style.background = '#fff'; cpw.style.color = '#24292f'; cpw.style.width = '190mm'; cpw.style.maxWidth = '190mm'; }
          let co = clonedDoc.getElementById('output');
          if (co) { co.style.background = '#fff'; co.style.color = '#24292f'; co.style.width = '190mm'; co.style.maxWidth = '190mm'; }

          // Explicitly scale Mermaid SVGs based on their viewBox to resolve html2canvas scaling issues
          let svgs = Array.from(clonedDoc.querySelectorAll('.mermaid svg'));
          for (let i = 0; i < svgs.length; i++) {
            let svg = svgs[i];
            let viewBox = svg.getAttribute('viewBox');
            if (viewBox) {
              let parts = viewBox.trim().split(/[\s,]+/);
              if (parts.length === 4) {
                let vbWidth = parseFloat(parts[2]);
                let vbHeight = parseFloat(parts[3]);
                if (vbWidth > 0 && vbHeight > 0) {
                  let maxWidth = 680;
                  
                  // Clear inline styles that could conflict with explicit attributes
                  svg.style.width = '';
                  svg.style.maxWidth = '';
                  svg.style.height = '';
                  
                  if (vbWidth > maxWidth) {
                    let scale = maxWidth / vbWidth;
                    let targetHeight = vbHeight * scale;
                    svg.setAttribute('width', maxWidth);
                    svg.setAttribute('height', targetHeight);
                    svg.style.setProperty('width', maxWidth + 'px', 'important');
                    svg.style.setProperty('height', targetHeight + 'px', 'important');
                  } else {
                    svg.setAttribute('width', vbWidth);
                    svg.setAttribute('height', vbHeight);
                    svg.style.setProperty('width', vbWidth + 'px', 'important');
                    svg.style.setProperty('height', vbHeight + 'px', 'important');
                  }
                  svg.style.setProperty('max-width', '100%', 'important');
                }
              }
            }
          }


        }
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    await html2pdf().set(options).from(previewWrapper).save();
  } catch (err) {
    console.error('PDF export failed', err);
    window.alert('PDF export failed: ' + (err.message || err));
  } finally {
    // Restore original theme and styles
    applyBrightness(originalBrightness);
    setTheme(wasDark);
    await setPreviewCss(wasDark);
    await renderMermaidDiagrams(outputEl);
  }
};

export let initPdfButton = (previewWrapper, outputEl) => {
  let exportBtn = document.querySelector('#export-button');
  if (!exportBtn) return;
  exportBtn.addEventListener('click', (e) => {
    e.preventDefault();
    exportPreviewToPdf(previewWrapper, outputEl);
  });
};
