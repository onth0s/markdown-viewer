let hasEdited = false;
let scrollBarSync = false;
let mermaidRenderTimer = null;
let mermaidRenderVersion = 0;

const defaultInput = `# Markdown syntax guide

## Headers

# This is a Heading h1
## This is a Heading h2
###### This is a Heading h6

## Emphasis

*This text will be italic*  
_This will also be italic_

**This text will be bold**  
__This will also be bold__

_You **can** combine them_

## Lists

### Unordered

* Item 1
* Item 2
* Item 2a
* Item 2b
    * Item 3a
    * Item 3b

### Ordered

1. Item 1
2. Item 2
3. Item 3
    1. Item 3a
    2. Item 3b

## Images

![This is an alt text.](/image/Markdown-mark.svg "This is a sample image.")

## Links

You may be using [Markdown Viewer](https://markdownlivepreview.com/).

## Blockquotes

> Markdown is a lightweight markup language with plain-text-formatting syntax, created in 2004 by John Gruber with Aaron Swartz.
>
>> Markdown is often used to format readme files, for writing messages in online discussion forums, and to create rich text using a plain text editor.

## Tables

| Left columns  | Right columns |
| ------------- |:-------------:|
| left foo      | right foo     |
| left bar      | right bar     |
| left baz      | right baz     |

## Blocks of code

\`\`\`
let message = 'Hello world';
alert(message);
\`\`\`

## Mermaid diagrams
\`\`\`mermaid
graph TD
  A[Start] --> B{Decision}
  B -->|Yes| C[Finish]
  B -->|No| D[Alternate]
\`\`\`

## Inline code

This web site is using \`markedjs/marked\`.
`;

const STORAGE_THEME_KEY = 'com.markdownlivepreview_theme';
const STORAGE_CONTENT_KEY = 'mdv_last_content';
const STORAGE_SCROLL_KEY = 'mdv_scroll_sync';

const PREVIEW_CSS_LIGHT = 'css/github-markdown-light.css';
const PREVIEW_CSS_DARK = 'css/github-markdown-dark_dimmed.css';

let editor = document.getElementById('editor');
let editorHighlight = document.getElementById('editor-highlight');
let output = document.getElementById('output');

let escapeHtml = (value) => {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
};

let highlightMd = (txt) => {
  let h = escapeHtml(txt);
  let lines = h.split('\n');
  let result = [];
  let i = 0;

  while (i < lines.length) {
    let l = lines[i];
    let m = l.match(/^(`{3,})\s*(\w*)/);

    if (m) {
      let fenceMarker = m[1];
      let lang = m[2] ? ' <span class="hl-fence-lang">' + m[2] + '</span>' : '';
      let open = '<span class="hl-fence hl-fence-open">' + m[1] + '</span>' + lang;

      let codeLines = [];
      i++;
      while (i < lines.length && lines[i].trim() !== fenceMarker) {
        codeLines.push(lines[i]);
        i++;
      }

      let close = i < lines.length
        ? '<span class="hl-fence hl-fence-close">' + lines[i].trim() + '</span>'
        : '';

      result.push(
        '<div class="hl-fenced-block">' +
        open +
        '<div class="hl-code-content">' + codeLines.join('\n') + '</div>' +
        close +
        '</div>'
      );
      i++;
      continue;
    }

    l = l.replace(/^(&gt;)+/, '<span class="hl-quote">$&</span>');

    l = l.replace(/^(\s*)([-*+]|\d{1,3}\.)(\s)/, (_, sp, mk, ws) => {
      return sp + '<span class="hl-list-marker">' + mk + '</span>' + ws;
    });

    l = l.replace(/^(-{3,}|\*{3,}|_{3,})$/, '<span class="hl-hr">$&</span>');

    l = l.replace(/^(\|[\s:-]+\|[\s:-]+\|)/, '<span class="hl-table-sep">$1</span>');

    l = l.replace(/!\[([^\]]*)\]\(([^)]*)\)/g,
      '<span class="hl-image">![<span class="hl-img-alt">$1</span>](<span class="hl-img-url">$2</span>)</span>');

    l = l.replace(/\[([^\]]*)\]\(([^)]*)\)/g,
      '<span class="hl-link">[<span class="hl-link-text">$1</span>](<span class="hl-link-url">$2</span>)</span>');

    l = l.replace(/(`[^`\n]+`)/g, '<span class="hl-code">$1</span>');

    l = l.replace(/(\*\*\*\S[^*]*\*\*\*)/g, '<span class="hl-em-strong">$1</span>');
    l = l.replace(/(\*\*\S[^*]*\*\*)/g, '<span class="hl-strong">$1</span>');
    l = l.replace(/(?<!\*)\*(\S[^*]*)\*(?!\*)/g, '<span class="hl-em">*$1*</span>');
    l = l.replace(/(___\S[^_]*___)/g, '<span class="hl-em-strong">$1</span>');
    l = l.replace(/(__\S[^_]*__)/g, '<span class="hl-strong">$1</span>');
    l = l.replace(/(?<!_)_(\S[^_]*)_(?!_)/g, '<span class="hl-em">_$1_</span>');

    l = l.replace(/(~~\S[^~]*~~)/g, '<span class="hl-strike">$1</span>');

    l = l.replace(/^(#{1,6})\s+/, (_, hashes) => {
      return '<span class="hl-hash">' + hashes + '</span> ';
    });
    l = l.replace(/^(<span class="hl-hash">[#]+<\/span> )(.+)/, (_, hash, rest) => {
      let level = (hash.match(/#/g) || []).length;
      return hash + '<span class="hl-heading hl-h' + level + '">' + rest + '</span>';
    });

    result.push(l);
    i++;
  }
  return result.join('\n');
};

let syncHighlight = () => {
  editorHighlight.innerHTML = highlightMd(editor.value);
  editorHighlight.scrollTop = editor.scrollTop;
};

let renderer = new marked.Renderer();
let renderCode = renderer.code.bind(renderer);
renderer.code = (token) => {
  let lang = (token.lang || '').match(/^\S*/)?.[0].toLowerCase();
  if (lang !== 'mermaid') return renderCode(token);
  return '<pre class="mermaid">' + escapeHtml(token.text) + '</pre>\n';
};

let getMermaidTheme = () => {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'default';
};

let configureMermaid = (theme) => {
  mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme });
};

let initMermaid = () => {
  configureMermaid(getMermaidTheme());
};

let showMermaidError = (element, error) => {
  let message = error && error.message ? error.message : 'Unable to render Mermaid chart.';
  element.classList.add('mermaid-error');
  element.textContent = 'Mermaid render error: ' + message;
};

let renderMermaidDiagramsNow = async (theme) => {
  if (!theme) theme = getMermaidTheme();
  if (!output) return;
  let version = ++mermaidRenderVersion;
  configureMermaid(theme);
  let elements = Array.from(output.querySelectorAll('.mermaid'));
  for (let i = 0; i < elements.length; i++) {
    if (version !== mermaidRenderVersion) return;
    let el = elements[i];
    let source = el.dataset.mermaidSource || el.textContent;
    el.dataset.mermaidSource = source;
    el.classList.remove('mermaid-error');
    try {
      let renderId = 'mermaid-' + Date.now() + '-' + version + '-' + i;
      let result = await mermaid.render(renderId, source);
      if (version !== mermaidRenderVersion) return;
      el.innerHTML = result.svg;
      if (typeof result.bindFunctions === 'function') result.bindFunctions(el);
    } catch (error) {
      showMermaidError(el, error);
    }
  }
};

let scheduleMermaidRender = () => {
  if (mermaidRenderTimer) clearTimeout(mermaidRenderTimer);
  mermaidRenderTimer = setTimeout(() => {
    mermaidRenderTimer = null;
    renderMermaidDiagramsNow();
  }, 150);
};

let renderMermaidDiagrams = (theme) => {
  if (mermaidRenderTimer) {
    clearTimeout(mermaidRenderTimer);
    mermaidRenderTimer = null;
  }
  return renderMermaidDiagramsNow(theme);
};

let convert = (markdown) => {
  try {
    let html = marked.parse(markdown, { headerIds: false, mangle: false, renderer });
    let sanitized = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(html) : html;
    output.innerHTML = sanitized;
    scheduleMermaidRender();
  } catch (e) {
    output.innerHTML = '<div class="mermaid-error">Render error: ' + escapeHtml(e.message || e) + '</div>';
  }
};

let saveLastContent = (content) => {
  try { localStorage.setItem(STORAGE_CONTENT_KEY, content); } catch (e) {}
};

let loadLastContent = () => {
  try { return localStorage.getItem(STORAGE_CONTENT_KEY); } catch (e) { return null; }
};

let presetValue = (value) => {
  editor.value = value;
  editor.scrollTop = 0;
  syncHighlight();
  editor.focus();
  hasEdited = value !== defaultInput;
  convert(value);
};

editor.addEventListener('input', () => {
  if (editor.value !== defaultInput) hasEdited = true;
  syncHighlight();
  convert(editor.value);
  saveLastContent(editor.value);
});

editor.addEventListener('scroll', () => {
  editorHighlight.scrollTop = editor.scrollTop;
});

editor.addEventListener('scroll', () => {
  if (!scrollBarSync) return;
  let scrollTop = editor.scrollTop;
  let scrollHeight = editor.scrollHeight;
  let height = editor.clientHeight;
  let maxScrollTop = scrollHeight - height;
  if (maxScrollTop <= 0) return;
  let ratio = scrollTop / maxScrollTop;
  let preview = document.getElementById('preview');
  let targetY = (preview.scrollHeight - preview.clientHeight) * ratio;
  preview.scrollTo(0, targetY);
});

let setSyncScroll = (enabled) => {
  document.documentElement.setAttribute('data-sync', enabled ? 'on' : 'off');
  scrollBarSync = enabled;
};

let copyToClipboard = (text, success, error) => {
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

let notifyCopied = () => {
  let el = document.querySelector('#copy-button a');
  el.textContent = 'Copied!';
  setTimeout(() => { el.textContent = 'Copy'; }, 1000);
};

document.querySelector('#copy-button').addEventListener('click', (e) => {
  e.preventDefault();
  copyToClipboard(editor.value, notifyCopied, () => {});
});

let exportLightCssPromise = null;

let getLightMarkdownCss = () => {
  if (exportLightCssPromise) return exportLightCssPromise;
  exportLightCssPromise = fetch(PREVIEW_CSS_LIGHT)
    .then((r) => { if (!r.ok) throw new Error('Failed to load CSS: ' + r.status); return r.text(); })
    .catch(() => '');
  return exportLightCssPromise;
};

let exportPreviewToPdf = async () => {
  let previewWrapper = document.querySelector('#preview-wrapper');
  if (!previewWrapper) return;
  if (typeof window.html2pdf !== 'function') {
    window.alert('PDF export is not available yet. Please try again in a moment.');
    return;
  }
  let restoreDark = getMermaidTheme() === 'dark';
  try {
    let lightCss = '';
    try { lightCss = await getLightMarkdownCss(); } catch (e) {}
    await renderMermaidDiagrams('default');
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
    if (restoreDark) renderMermaidDiagrams();
  }
};

document.querySelector('#export-button').addEventListener('click', (e) => {
  e.preventDefault();
  exportPreviewToPdf();
});

let setPreviewCss = (useDark) => {
  let link = document.getElementById('gh-markdown-link');
  let desired = useDark ? PREVIEW_CSS_DARK : PREVIEW_CSS_LIGHT;
  if (!link) {
    let newLink = document.createElement('link');
    newLink.id = 'gh-markdown-link';
    newLink.rel = 'stylesheet';
    newLink.href = desired;
    document.head.appendChild(newLink);
    return Promise.resolve();
  }
  if (link.getAttribute('href') === desired) return Promise.resolve();
  return new Promise((resolve) => {
    let loaded = () => { link.removeEventListener('load', loaded); requestAnimationFrame(resolve); };
    link.addEventListener('load', loaded);
    link.setAttribute('href', desired);
  });
};

let setTheme = (enabled) => {
  document.documentElement.setAttribute('data-theme', enabled ? 'dark' : 'light');
};

let loadThemeSettings = () => {
  try {
    let raw = localStorage.getItem(STORAGE_THEME_KEY);
    if (raw === 'dark') return true;
    if (raw === 'light') return false;
  } catch (e) {}
  return true;
};

let saveThemeSettings = (settings) => {
  try { localStorage.setItem(STORAGE_THEME_KEY, settings ? 'dark' : 'light'); } catch (e) {}
};

let initThemeToggle = (settings) => {
  setTheme(settings);
  setPreviewCss(settings);
  let toggle = document.querySelector('.theme-toggle');
  if (!toggle) return;
  toggle.addEventListener('click', async () => {
    let isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    let checked = !isDark;
    let preview = document.getElementById('preview');
    let ratio = (preview.scrollHeight - preview.clientHeight) > 0
      ? preview.scrollTop / (preview.scrollHeight - preview.clientHeight)
      : 0;
    setTheme(checked);
    saveThemeSettings(checked);
    await setPreviewCss(checked);
    await renderMermaidDiagrams();
    if ((preview.scrollHeight - preview.clientHeight) > 0) {
      preview.scrollTop = ratio * (preview.scrollHeight - preview.clientHeight);
    }
  });
};

let loadScrollBarSettings = () => {
  try {
    let raw = localStorage.getItem(STORAGE_SCROLL_KEY);
    return raw !== 'false';
  } catch (e) { return true; }
};

let saveScrollBarSettings = (settings) => {
  try { localStorage.setItem(STORAGE_SCROLL_KEY, settings ? 'true' : 'false'); } catch (e) {}
};

let initScrollBarSync = (settings) => {
  setSyncScroll(settings);
  let toggle = document.querySelector('.sync-toggle');
  if (!toggle) return;
  toggle.addEventListener('click', () => {
    let isOn = document.documentElement.getAttribute('data-sync') === 'on';
    let checked = !isOn;
    scrollBarSync = checked;
    setSyncScroll(checked);
    saveScrollBarSettings(checked);
  });
};

let setupDivider = () => {
  let lastLeftRatio = 0.5;
  let divider = document.getElementById('split-divider');
  let leftPane = document.getElementById('edit');
  let rightPane = document.getElementById('preview');
  let container = document.getElementById('container');
  let isDragging = false;

  divider.addEventListener('mouseenter', () => divider.classList.add('hover'));
  divider.addEventListener('mouseleave', () => { if (!isDragging) divider.classList.remove('hover'); });
  divider.addEventListener('mousedown', () => { isDragging = true; divider.classList.add('active'); document.body.style.cursor = 'col-resize'; });
  divider.addEventListener('dblclick', () => {
    let cr = container.getBoundingClientRect();
    let half = (cr.width - divider.offsetWidth) / 2;
    leftPane.style.width = half + 'px';
    rightPane.style.width = half + 'px';
  });
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    document.body.style.userSelect = 'none';
    let cr = container.getBoundingClientRect();
    let offsetX = e.clientX - cr.left;
    let dw = divider.offsetWidth;
    let minW = 100;
    let maxW = cr.width - minW - dw;
    let leftW = Math.max(minW, Math.min(offsetX, maxW));
    leftPane.style.width = leftW + 'px';
    rightPane.style.width = (cr.width - leftW - dw) + 'px';
    lastLeftRatio = leftW / (cr.width - dw);
  });
  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      divider.classList.remove('active', 'hover');
      document.body.style.cursor = 'default';
      document.body.style.userSelect = '';
    }
  });
  window.addEventListener('resize', () => {
    let cr = container.getBoundingClientRect();
    let dw = divider.offsetWidth;
    let avail = cr.width - dw;
    leftPane.style.width = (avail * lastLeftRatio) + 'px';
    rightPane.style.width = (avail * (1 - lastLeftRatio)) + 'px';
  });
};

let lastContent = loadLastContent();
initMermaid();
if (lastContent) {
  presetValue(lastContent);
} else {
  presetValue(defaultInput);
}

let scrollBarSettings = loadScrollBarSettings();
initScrollBarSync(scrollBarSettings);

let themeSettings = loadThemeSettings();
initThemeToggle(themeSettings);

setupDivider();
