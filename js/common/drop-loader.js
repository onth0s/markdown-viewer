const ACCEPTED_EXTENSIONS = ['md', 'markdown', 'mdown', 'mkd', 'mkdn', 'txt'];
const ACCEPTED_MIME_TYPES = ['text/markdown', 'text/x-markdown', 'text/plain'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const DEFAULT_TITLE = 'Markdown Viewer';

const isMarkdownFile = (file) => {
  if (!file || !file.name) return false;
  if (file.type && ACCEPTED_MIME_TYPES.indexOf(file.type) !== -1) return true;
  const name = file.name.toLowerCase();
  for (let i = 0; i < ACCEPTED_EXTENSIONS.length; i++) {
    if (name.endsWith('.' + ACCEPTED_EXTENSIONS[i])) return true;
  }
  return false;
};

const stripExtension = (filename) => {
  const idx = filename.lastIndexOf('.');
  return idx > 0 ? filename.substring(0, idx) : filename;
};

const ensureOverlay = () => {
  const existing = document.getElementById('drop-overlay');
  if (existing) return existing;

  const overlay = document.createElement('div');
  overlay.id = 'drop-overlay';
  overlay.setAttribute('aria-hidden', 'true');

  const card = document.createElement('div');
  card.id = 'drop-overlay-card';

  const main = document.createElement('span');
  main.className = 'drop-overlay-main';
  main.textContent = 'Drop .md file to load';

  const sub = document.createElement('span');
  sub.className = 'drop-overlay-sub';
  sub.textContent = 'Replaces the current editor content';

  card.appendChild(main);
  card.appendChild(sub);
  overlay.appendChild(card);
  document.body.appendChild(overlay);
  return overlay;
};

const dataTransferHasFiles = (dt) => {
  if (!dt || !dt.types) return false;
  for (let i = 0; i < dt.types.length; i++) {
    if (dt.types[i] === 'Files') return true;
  }
  return false;
};

export const initDropLoader = ({ editorController, onAfterLoad, maxFileSize } = {}) => {
  if (typeof window === 'undefined' || !window.addEventListener) return;
  ensureOverlay();

  const cap = typeof maxFileSize === 'number' ? maxFileSize : MAX_FILE_SIZE_BYTES;
  const body = document.body;

  const showOverlay = () => { body.classList.add('is-dragging-file'); };
  const hideOverlay = () => { body.classList.remove('is-dragging-file'); };

  const onDragOver = (e) => {
    if (!dataTransferHasFiles(e.dataTransfer)) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    showOverlay();
  };

  const onDragLeave = (e) => {
    // Only hide when the cursor leaves the window entirely.
    if (e.relatedTarget !== null && e.relatedTarget !== undefined) return;
    hideOverlay();
  };

  const onDrop = (e) => {
    hideOverlay();
    if (!e.dataTransfer || !e.dataTransfer.files || e.dataTransfer.files.length === 0) return;
    e.preventDefault();

    const files = Array.prototype.slice.call(e.dataTransfer.files);
    const valid = files.filter(isMarkdownFile);

    if (valid.length === 0) {
      window.alert('Please drop a Markdown file (.md, .markdown, .txt).');
      return;
    }
    if (files.length > 1) {
      window.alert('Multiple files detected — only the first Markdown file will be loaded.');
    }

    const file = valid[0];
    if (file.size > cap) {
      window.alert('File is too large (max ' + Math.round(cap / 1024 / 1024) + ' MB).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      if (editorController && typeof editorController.presetValue === 'function') {
        editorController.presetValue(text);
      }
      const baseTitle = stripExtension(file.name || '');
      document.title = baseTitle || DEFAULT_TITLE;
      if (typeof onAfterLoad === 'function') {
        try { onAfterLoad(text, file); } catch (err) { console.error('[drop-loader] onAfterLoad failed', err); }
      }
    };
    reader.onerror = () => {
      window.alert('Failed to read file: ' + (file.name || 'unknown'));
    };
    reader.readAsText(file, 'utf-8');
  };

  // Safety net: if the drag is cancelled (e.g. user releases outside the
  // window or presses Escape), make sure the overlay is removed.
  const onWindowBlur = () => hideOverlay();
  const onKeyDown = (e) => { if (e.key === 'Escape') hideOverlay(); };

  window.addEventListener('dragover', onDragOver);
  window.addEventListener('dragleave', onDragLeave);
  window.addEventListener('drop', onDrop);
  window.addEventListener('blur', onWindowBlur);
  window.addEventListener('keydown', onKeyDown);
};
