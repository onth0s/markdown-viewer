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

const PRINT_CSS = `
@page {
  size: A4;
  margin: 16mm 20mm;
}

@media print {
  html {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  body {
    font-family: 'Roboto', -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.6;
    color: var(--text-primary);
    background: var(--bg-preview);
    margin: 0;
    padding: 0;
  }

  /* ── GitHub markdown body styling (subset) ── */
  .markdown-body {
    background: var(--bg-preview);
    color: var(--text-primary);
  }
  .markdown-body h1 { font-size: 20pt; border-bottom: 1px solid var(--border-default); padding-bottom: 0.3em; }
  .markdown-body h2 { font-size: 16pt; border-bottom: 1px solid var(--border-default); padding-bottom: 0.3em; }
  .markdown-body h3 { font-size: 14pt; }
  .markdown-body h4 { font-size: 12pt; }
  .markdown-body h5, .markdown-body h6 { font-size: 11pt; }

  .markdown-body h1, .markdown-body h2, .markdown-body h3,
  .markdown-body h4, .markdown-body h5, .markdown-body h6 {
    page-break-after: avoid;
    break-after: avoid;
    margin-top: 24px;
    margin-bottom: 16px;
    font-weight: 600;
  }

  .markdown-body p, .markdown-body ul, .markdown-body ol, .markdown-body dl, .markdown-body table, .markdown-body pre, .markdown-body blockquote {
    margin-top: 0;
    margin-bottom: 16px;
  }

  .markdown-body pre, .markdown-body blockquote, .markdown-body table,
  .markdown-body tr, .markdown-body img, .mermaid, .mermaid svg {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .markdown-body pre {
    background: var(--bg-code) !important;
    border: 1px solid var(--border-default);
    border-radius: 6px;
    padding: 12px 16px;
    font-family: Consolas, "Liberation Mono", Menlo, monospace;
    font-size: 10pt;
    overflow: visible;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .markdown-body code {
    font-family: Consolas, "Liberation Mono", Menlo, monospace;
    font-size: 10pt;
    background: var(--bg-code);
    padding: 2px 4px;
    border-radius: 4px;
  }

  .markdown-body pre code {
    background: transparent;
    padding: 0;
    border: none;
  }

  .markdown-body img {
    max-width: 100% !important;
    page-break-inside: avoid;
  }

  .markdown-body table {
    width: 100%;
    border-collapse: collapse;
    font-size: 10pt;
    margin-top: 0;
    margin-bottom: 16px;
  }

  .markdown-body table th, .markdown-body table td {
    border: 1px solid var(--border-default);
    padding: 6px 10px;
  }

  .markdown-body table th {
    background: var(--bg-code);
    font-weight: 600;
  }

  .markdown-body blockquote {
    border-left: 4px solid var(--border-default);
    padding: 0 12px;
    color: var(--text-secondary);
    margin: 0 0 16px 0;
  }

  /* ── Mermaid diagrams ── */
  .mermaid {
    text-align: center;
    margin: 16px 0;
    max-width: 100%;
    overflow: visible;
  }

  .mermaid svg {
    display: block;
    max-width: 100%;
    height: auto;
    margin: 0 auto;
  }

  .token.important, .token.bold { font-weight: 600; }
  .token.italic { font-style: italic; }

  /* ── Task lists ── */
  .task-list-item { list-style: none; }
  .task-list-item-checkbox { margin-right: 6px; }

  /* ── Horizontal rules ── */
  .markdown-body hr {
    border: 0;
    border-top: 1px solid var(--border-default);
    margin: 16px 0;
  }
}
`;

/**
 * Clones the rendered content and builds a standalone HTML page.
 * @param {HTMLElement} sourceEl
 * @returns {string} Standalone HTML document string
 */
const buildPrintHtml = (sourceEl, docStyle, currentTheme, ghHref, prismHref) => {
  const clone = sourceEl.cloneNode(true);

  // Strip selection highlights, anchors, and other non-print interactive structures
  clone.querySelectorAll('.preview-selection, .anchor, .octicon-link').forEach(el => {
    el.classList.remove('preview-selection');
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
  <link rel="stylesheet" href="${ghHref}">
  <link rel="stylesheet" href="${prismHref}">
  <style>${PRINT_CSS}</style>
</head>
<body class="markdown-body">
  ${clone.innerHTML}
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

  const iframe = document.createElement('iframe');
  // Position off-screen but keep rendering context active
  iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;border:0;';
  iframe.sandbox = 'allow-modals allow-same-origin';
  document.body.appendChild(iframe);

  const html = buildPrintHtml(outputEl, docStyle, currentTheme, ghHref, prismHref);
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
