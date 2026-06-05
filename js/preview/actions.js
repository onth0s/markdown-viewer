import { PREVIEW_CSS_LIGHT } from '../common/constants.js';
import { renderMermaidDiagrams, getMermaidTheme } from './mermaid-renderer.js';

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

let exportLightCssPromise = null;
let getLightMarkdownCss = () => {
  if (exportLightCssPromise) return exportLightCssPromise;
  exportLightCssPromise = fetch(PREVIEW_CSS_LIGHT)
    .then((r) => { if (!r.ok) throw new Error('Failed to load CSS: ' + r.status); return r.text(); })
    .catch(() => '');
  return exportLightCssPromise;
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
  let restoreDark = getMermaidTheme() === 'dark';
  try {
    let lightCss = '';
    try { lightCss = await getLightMarkdownCss(); } catch (e) {}
    await renderMermaidDiagrams(outputEl, 'default');
    let options = {
      margin: 10,
      filename: 'markdown-preview.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2, useCORS: true,
        onclone: (clonedDoc) => {
          clonedDoc.documentElement.setAttribute('data-theme', 'light');
          let link = clonedDoc.getElementById('gh-markdown-link');
          if (link) link.setAttribute('href', PREVIEW_CSS_LIGHT);
          if (lightCss) {
            let style = clonedDoc.createElement('style');
            style.id = 'export-light-css';
            style.textContent = lightCss + '\n#preview-wrapper, #output, body { background: #fff !important; color: #24292f !important; }';
            clonedDoc.head.appendChild(style);
          }
          let cpw = clonedDoc.getElementById('preview-wrapper');
          if (cpw) { cpw.style.background = '#fff'; cpw.style.color = '#24292f'; cpw.style.width = '190mm'; cpw.style.maxWidth = '190mm'; }
          let co = clonedDoc.getElementById('output');
          if (co) { co.style.background = '#fff'; co.style.color = '#24292f'; co.style.width = '190mm'; co.style.maxWidth = '190mm'; }
        }
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    await html2pdf().set(options).from(previewWrapper).save();
  } catch (err) {
    console.error('PDF export failed', err);
    window.alert('PDF export failed: ' + (err.message || err));
  } finally {
    if (restoreDark) renderMermaidDiagrams(outputEl);
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
