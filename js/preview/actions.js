import { PREVIEW_CSS_LIGHT } from '../common/constants.js';
import { renderMermaidDiagrams, getMermaidTheme } from './mermaid-renderer.js';

/* global html2pdf */

/**
 * @typedef {{ set: (opts: object) => { from: (el: Element) => { save: () => Promise<void> } } }} Html2PdfInstance
 */

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
  if (typeof window.html2pdf !== 'function') {
    console.warn('[actions] html2pdf is not loaded — PDF export is unavailable.');
    window.alert('PDF export is not available yet. Please try again in a moment.');
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
    await window.html2pdf().set(options).from(previewWrapper).save();
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
