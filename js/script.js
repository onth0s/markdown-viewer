let hasEdited = false;
let scrollBarSync = false;
let mermaidRenderTimer = null;
let mermaidRenderVersion = 0;

const defaultInputFallback = `# Markdown Viewer

Start writing markdown...`;

const STORAGE_THEME_KEY = 'com.markdownlivepreview_theme';
const STORAGE_CONTENT_KEY = 'mdv_last_content';
const STORAGE_SCROLL_KEY = 'mdv_scroll_sync';
const STORAGE_SCROLL_POS_KEY = 'mdv_scroll_positions';

const PREVIEW_CSS_LIGHT = 'css/github-markdown-light.css';
const PREVIEW_CSS_DARK = 'css/github-markdown-dark_dimmed.css';

let editor = document.getElementById('editor');
let editorHighlight = document.getElementById('editor-highlight');
let caretIndicator = document.getElementById('caret-indicator');
let customScrollbar = document.getElementById('custom-scrollbar');
let customScrollbarThumb = document.getElementById('custom-scrollbar-thumb');
let output = document.getElementById('output');
let preview = document.getElementById('preview-wrapper');

let updateCustomScrollbar = () => {
  if (!editor || !customScrollbarThumb) return;
  let scrollRatio = editor.scrollTop / (editor.scrollHeight - editor.clientHeight || 1);
  let thumbRatio = editor.clientHeight / editor.scrollHeight;
  let trackHeight = customScrollbar.clientHeight;
  let thumbHeight = Math.max(20, thumbRatio * trackHeight);
  let maxTop = trackHeight - thumbHeight;
  let top = scrollRatio * maxTop;
  customScrollbarThumb.style.height = thumbHeight + 'px';
  customScrollbarThumb.style.top = top + 'px';
};

let updateCaretIndicator = () => {
  if (!caretIndicator || !editor) return;
  let pos = editor.selectionStart;
  let text = editor.value.substring(0, pos);
  let caretLine = text.split('\n').length - 1;
  let totalLines = editor.value.split('\n').length;
  let trackHeight = customScrollbar ? customScrollbar.clientHeight : editor.clientHeight;
  let top = totalLines <= 1 ? 0 : (caretLine / (totalLines - 1)) * trackHeight;
  caretIndicator.style.top = top + 'px';
};

let initCustomScrollbar = () => {
  if (!customScrollbar || !editor) return;
  let isDragging = false;
  let dragStartY = 0;
  let dragStartScroll = 0;

  customScrollbarThumb.addEventListener('mousedown', (e) => {
    isDragging = true;
    dragStartY = e.clientY;
    dragStartScroll = editor.scrollTop;
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    let trackHeight = customScrollbar.clientHeight;
    let thumbHeight = customScrollbarThumb.clientHeight;
    let maxTop = trackHeight - thumbHeight;
    let deltaY = e.clientY - dragStartY;
    let maxScroll = editor.scrollHeight - editor.clientHeight;
    let scrollDelta = (deltaY / maxTop) * maxScroll;
    editor.scrollTop = dragStartScroll + scrollDelta;
  });

  document.addEventListener('mouseup', () => { isDragging = false; });

  customScrollbar.addEventListener('click', (e) => {
    if (e.target === customScrollbarThumb) return;
    let rect = customScrollbar.getBoundingClientRect();
    let clickY = e.clientY - rect.top;
    let trackHeight = customScrollbar.clientHeight;
    let ratio = clickY / trackHeight;
    editor.scrollTop = ratio * (editor.scrollHeight - editor.clientHeight);
  });

  editor.addEventListener('scroll', () => {
    updateCustomScrollbar();
    updateCaretIndicator();
  });

  updateCustomScrollbar();
  updateCaretIndicator();
};

let initPreviewCustomScrollbar = () => {
  let previewEl = document.getElementById('preview-wrapper');
  let previewTrack = document.getElementById('preview-custom-scrollbar');
  let previewThumb = document.getElementById('preview-custom-scrollbar-thumb');
  if (!previewEl || !previewTrack || !previewThumb) return;

  let isDragging = false;
  let dragStartY = 0;
  let dragStartScroll = 0;

  let update = () => {
    let max = previewEl.scrollHeight - previewEl.clientHeight;
    if (max <= 0) { previewThumb.style.height = '0px'; return; }
    let ratio = previewEl.scrollTop / max;
    let trackH = previewTrack.clientHeight;
    let availH = trackH - 28;
    let thumbH = Math.max(20, (previewEl.clientHeight / previewEl.scrollHeight) * availH);
    let maxTop = availH - thumbH;
    previewThumb.style.height = thumbH + 'px';
    previewThumb.style.top = (14 + ratio * maxTop) + 'px';
  };

  previewThumb.addEventListener('mousedown', (e) => {
    isDragging = true;
    dragStartY = e.clientY;
    dragStartScroll = previewEl.scrollTop;
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    let trackH = previewTrack.clientHeight;
    let thumbH = previewThumb.clientHeight;
    let maxTop = trackH - 28 - thumbH;
    let delta = e.clientY - dragStartY;
    let maxScroll = previewEl.scrollHeight - previewEl.clientHeight;
    previewEl.scrollTop = dragStartScroll + (delta / maxTop) * maxScroll;
  });

  document.addEventListener('mouseup', () => { isDragging = false; });

  previewTrack.addEventListener('click', (e) => {
    if (e.target === previewThumb || e.target.classList.contains('scrollbar-arrow')) return;
    let rect = previewTrack.getBoundingClientRect();
    let clickY = e.clientY - rect.top;
    let ratio = clickY / previewTrack.clientHeight;
    previewEl.scrollTop = ratio * (previewEl.scrollHeight - previewEl.clientHeight);
  });

  let scrollInterval = null;
  previewTrack.querySelectorAll('.scrollbar-arrow').forEach((arrow) => {
    let dir = arrow.dataset.dir === 'up' ? -1 : 1;
    let step = () => { previewEl.scrollTop += dir * 40; };
    arrow.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      step();
      scrollInterval = setInterval(step, 80);
    });
    arrow.addEventListener('mouseup', () => { clearInterval(scrollInterval); });
    arrow.addEventListener('mouseleave', () => { clearInterval(scrollInterval); });
  });

  previewEl.addEventListener('scroll', update);
  update();
};

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
      let lang = m[2] ? '<span class="hl-fence-lang">' + m[2] + '</span>' : '';
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
        '<span class="hl-fenced-block">' +
        open + '\n' +
        (codeLines.length > 0 ? '<span class="hl-code-content">' + codeLines.join('\n') + '</span>\n' : '') +
        close +
        '</span>'
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

let syncHighlightPadding = () => {
  let scrollbarWidth = editor.offsetWidth - editor.clientWidth;
  if (scrollbarWidth > 0) {
    let basePaddingRight = 16;
    editorHighlight.style.paddingRight = (basePaddingRight + scrollbarWidth) + 'px';
  } else {
    editorHighlight.style.paddingRight = '';
  }
};

syncHighlightPadding();
window.addEventListener('resize', syncHighlightPadding);
new ResizeObserver(syncHighlightPadding).observe(editor);

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
  convert(value);
};

editor.addEventListener('input', () => {
  syncHighlight();
  convert(editor.value);
  saveLastContent(editor.value);
  updateCaretIndicator();
  updateCustomScrollbar();
});

editor.addEventListener('scroll', () => {
  editorHighlight.scrollTop = editor.scrollTop;
});

editor.addEventListener('keyup', updateCaretIndicator);
editor.addEventListener('click', updateCaretIndicator);
editor.addEventListener('mouseup', updateCaretIndicator);

let activePane = 'editor';

let setActivePane = (pane) => { activePane = pane; };

document.getElementById('edit').addEventListener('pointerenter', () => setActivePane('editor'));
document.getElementById('preview').addEventListener('pointerenter', () => setActivePane('preview'));
editor.addEventListener('focus', () => setActivePane('editor'));

let syncPaneToPane = (source, target) => {
  let max = source.scrollHeight - source.clientHeight;
  if (max <= 0) return;
  if (source.scrollTop <= 1) {
    source.scrollTop = 0;
    target.scrollTop = 0;
    return;
  }
  if (source.scrollTop >= max - 1) {
    source.scrollTop = max;
    target.scrollTop = target.scrollHeight;
    return;
  }
  let ratio = source.scrollTop / max;
  let targetMax = target.scrollHeight - target.clientHeight;
  if (targetMax <= 0) return;
  target.scrollTop = ratio * targetMax;
};

editor.addEventListener('scroll', () => {
  if (!scrollBarSync) return;
  if (activePane !== 'editor') return;
  syncPaneToPane(editor, preview);
});

preview.addEventListener('scroll', () => {
  if (!scrollBarSync) return;
  if (activePane !== 'preview') return;
  syncPaneToPane(preview, editor);
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
  let el = document.querySelector('#copy-button');
  el.title = 'Copied!';
  setTimeout(() => { el.title = 'Copy'; }, 1000);
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

document.querySelector('#download-button').addEventListener('click', (e) => {
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
    let pv = document.getElementById('preview-wrapper');
    let ratio = (pv.scrollHeight - pv.clientHeight) > 0
      ? pv.scrollTop / (pv.scrollHeight - pv.clientHeight)
      : 0;
    setTheme(checked);
    saveThemeSettings(checked);
    await setPreviewCss(checked);
    await renderMermaidDiagrams();
    if ((pv.scrollHeight - pv.clientHeight) > 0) {
      pv.scrollTop = ratio * (pv.scrollHeight - pv.clientHeight);
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

let computeScrollRatio = (el) => {
  if (!el) return 0;
  let max = el.scrollHeight - el.clientHeight;
  if (max <= 0) return 0;
  return Math.max(0, Math.min(1, el.scrollTop / max));
};

let applyScrollRatio = (el, ratio) => {
  if (!el || ratio == null) return;
  let max = el.scrollHeight - el.clientHeight;
  if (max <= 0) return;
  el.scrollTop = ratio * max;
};

let saveScrollPositions = () => {
  try {
    let pv = document.getElementById('preview-wrapper');
    let payload = JSON.stringify({
      editor: computeScrollRatio(editor),
      preview: computeScrollRatio(pv),
      caret: editor.selectionStart
    });
    localStorage.setItem(STORAGE_SCROLL_POS_KEY, payload);
  } catch (e) {}
};

let loadScrollPositions = () => {
  try {
    let raw = localStorage.getItem(STORAGE_SCROLL_POS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) { return null; }
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
    e.preventDefault();
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
    }
  });
  document.addEventListener('mouseleave', () => {
    if (isDragging) {
      isDragging = false;
      divider.classList.remove('active', 'hover');
      document.body.style.cursor = 'default';
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
let savedScrolls = loadScrollPositions();

let onContentReady = (content) => {
  presetValue(content);
  if (savedScrolls) {
    applyScrollRatio(editor, savedScrolls.editor);
    editorHighlight.scrollTop = editor.scrollTop;
    if (savedScrolls.caret != null && savedScrolls.caret <= editor.value.length) {
      editor.setSelectionRange(savedScrolls.caret, savedScrolls.caret);
    }
    updateCaretIndicator();
    renderMermaidDiagrams().then(() => {
      applyScrollRatio(document.getElementById('preview-wrapper'), savedScrolls.preview);
    });
  }
};

if (lastContent) {
  onContentReady(lastContent);
} else {
  fetch('DEFAULT.md')
    .then(r => r.ok ? r.text() : Promise.reject(new Error('HTTP ' + r.status)))
    .then(text => onContentReady(text))
    .catch(() => onContentReady(defaultInputFallback));
}

editor.addEventListener('scroll', saveScrollPositions, { passive: true });
document.getElementById('preview-wrapper').addEventListener('scroll', saveScrollPositions, { passive: true });
window.addEventListener('beforeunload', saveScrollPositions);

let scrollBarSettings = loadScrollBarSettings();
initScrollBarSync(scrollBarSettings);

let themeSettings = loadThemeSettings();
initThemeToggle(themeSettings);

setupDivider();
initCustomScrollbar();
initPreviewCustomScrollbar();

const STORAGE_SWAP_KEY = 'mdv_swapped';

document.getElementById('swap-button').addEventListener('click', () => {
  let swapped = localStorage.getItem(STORAGE_SWAP_KEY) === 'true';
  swapped = !swapped;
  localStorage.setItem(STORAGE_SWAP_KEY, swapped);
  if (swapped) {
    document.documentElement.setAttribute('data-swapped', '');
  } else {
    document.documentElement.removeAttribute('data-swapped');
  }
});
