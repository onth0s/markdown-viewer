export const copyToClipboard = (text, success, error) => {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(success, error);
  } else {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed'; ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); success(); } catch (e) { error(e); }
    document.body.removeChild(ta);
  }
};

/**
 * Clones the rendered content and builds a standalone HTML page.
 * @param {HTMLElement} sourceEl
 * @returns {string} Standalone HTML document string
 */
const buildPrintHtml = (sourceEl, docStyle, currentTheme, ghHref, prismHref, themeColors) => {
  const clone = sourceEl.cloneNode(true);

  // 1. Unwrap inline highlight spans that were added for visual selection
  clone.querySelectorAll('span.preview-selection:not([data-source-pos])').forEach(span => {
    const parent = span.parentNode;
    if (parent) {
      while (span.firstChild) {
        parent.insertBefore(span.firstChild, span);
      }
      parent.removeChild(span);
    }
  });

  // 2. Remove preview-selection class from block elements without removing the content
  clone.querySelectorAll('.preview-selection').forEach(el => {
    el.classList.remove('preview-selection');
  });

  // 3. Strip decorative anchors and interactive link symbols
  clone.querySelectorAll('.anchor, .octicon-link').forEach(el => {
    el.remove();
  });

  // Resolve relative image URLs to absolute to ensure they render inside the frame
  clone.querySelectorAll('[src]').forEach(el => {
    try {
      el.src = new URL(el.getAttribute('src'), window.location.href).href;
    } catch {}
  });

  return `<!DOCTYPE html>
<html data-theme="${currentTheme}" style="${docStyle}">
<head>
  <meta charset="utf-8">
  <title>Markdown Export</title>
  <link rel="stylesheet" href="css/style.css">
  <link rel="stylesheet" href="css/print.css">
  <link rel="stylesheet" href="${ghHref}">
  <link rel="stylesheet" href="${prismHref}">
  <style>
    :root {
      --bg-preview: ${themeColors.bgPreview} !important;
      --text-primary: ${themeColors.textPrimary} !important;
      --border-default: ${themeColors.borderDefault} !important;
      --bg-code: ${themeColors.bgCode} !important;
      --text-secondary: ${themeColors.textSecondary} !important;
    }
  </style>
</head>
<body>
  <div id="preview-wrapper">
    <div class="markdown-body">
      ${clone.innerHTML}
    </div>
  </div>
</body>
</html>`;
};

/**
 * Triggers PDF export by rendering content inside a hidden iframe and invoking window.print().
 * @param {HTMLElement} outputEl - The rendered markdown output container element (#output)
 */
export const exportPreviewToPdf = async (outputEl) => {
  if (!outputEl) return;

  const docStyle = document.documentElement.getAttribute('style') || '';
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';

  const ghLink = document.getElementById('gh-markdown-link');
  const ghHref = ghLink ? ghLink.getAttribute('href') : '';

  const prismLink = document.getElementById('prism-theme-link');
  const prismHref = prismLink ? prismLink.getAttribute('href') : '';

  const computedStyle = window.getComputedStyle(document.documentElement);
  const themeColors = {
    bgPreview: computedStyle.getPropertyValue('--bg-preview').trim(),
    textPrimary: computedStyle.getPropertyValue('--text-primary').trim(),
    borderDefault: computedStyle.getPropertyValue('--border-default').trim(),
    bgCode: computedStyle.getPropertyValue('--bg-code').trim(),
    textSecondary: computedStyle.getPropertyValue('--text-secondary').trim(),
  };

  const iframe = document.createElement('iframe');
  // Position off-screen but keep rendering context active
  iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;border:0;';
  iframe.sandbox = 'allow-modals allow-same-origin';
  document.body.appendChild(iframe);

  const html = buildPrintHtml(outputEl, docStyle, currentTheme, ghHref, prismHref, themeColors);
  iframe.srcdoc = html;

  // Wait for print-document assets (fonts/images) to render
  await new Promise((resolve) => {
    iframe.onload = () => {
      if (iframe.contentDocument) {
        iframe.contentDocument.fonts.ready.then(() => {
          requestAnimationFrame(() => setTimeout(resolve, 200));
        });
      } else {
        setTimeout(resolve, 500);
      }
    };
    // Safety fallback
    setTimeout(resolve, 1500);
  });

  // Open the browser print dialog
  iframe.contentWindow.focus();
  iframe.contentWindow.print();

  // Clean up the frame after print dialog completes/closes
  const cleanup = () => {
    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
  };
  iframe.contentWindow.addEventListener('afterprint', cleanup, { once: true });
  // Fallback cleanup
  setTimeout(cleanup, 30000);
};

export const initCopyButton = (editor) => {
  const copyBtn = document.querySelector('#copy-button');
  if (!copyBtn || !editor) return;

  const notifyCopied = () => {
    copyBtn.title = 'Copied!';
    setTimeout(() => { copyBtn.title = 'Copy'; }, 1000);
  };

  copyBtn.addEventListener('click', (e) => {
    e.preventDefault();
    copyToClipboard(editor.value, notifyCopied, () => {});
  });
};

export const initDownloadButton = (editor) => {
  const downloadBtn = document.querySelector('#download-button');
  if (!downloadBtn || !editor) return;

  downloadBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const blob = new Blob([editor.value], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
};

/**
 * Initializes the PDF export button click behaviour.
 * @param {HTMLElement} outputEl - The rendered markdown output container element (#output)
 */
export const initPdfButton = (outputEl) => {
  const exportBtn = document.querySelector('#export-button');
  if (!exportBtn) return;
  exportBtn.addEventListener('click', (e) => {
    e.preventDefault();
    exportPreviewToPdf(outputEl);
  });
};
