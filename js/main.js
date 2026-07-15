import { defaultInputFallback } from './common/constants.js';
import {
  saveLastContent,
  loadLastContent,
  loadScrollBarSettings,
  saveScrollPositions,
  loadScrollPositions
} from './common/storage.js';
import { setupDivider, initSwapButton } from './common/ui-divider.js';
import { setupFullscreenOverlay, setupClearallOverlay } from './common/scroll-utils.js';
import { initFullscreenButton, initClearallButton } from './common/overlay-actions.js';
import { initDynamicSvg, updateThemedLogos } from './common/logo-engine.js';
import { initScrollSync } from './common/scroll-sync.js';
import { initThemeToggle } from './common/theme-controller.js';
import { initSettingsPanel } from './common/settings-panel.js';
import { initEditorController } from './editor/editor-controller.js';
import { initMermaid, renderMermaidDiagrams } from './preview/mermaid-renderer.js';
import { convert } from './preview/markdown-renderer.js';
import { initPreviewCustomScrollbar } from './preview/scrollbars.js';
import { initPreviewHorizontalScrollbar } from './preview/hscrollbar.js';
import { initCopyButton, initDownloadButton, initPdfButton } from './preview/actions.js';
import { SelectionEngine } from './selection/selection-engine.js';
import { wrapEmojis } from './common/emoji-helper.js';
import { initDropLoader } from './common/drop-loader.js';

// ── DOM elements ──────────────────────────────────────────────────────────────
const editorEl                  = document.getElementById('editor');
const editorHighlightEl         = document.getElementById('editor-highlight');
const caretIndicatorEl          = document.getElementById('caret-indicator');
const customScrollbarEl         = document.getElementById('custom-scrollbar');
const customScrollbarThumbEl    = document.getElementById('custom-scrollbar-thumb');
const outputEl                  = document.getElementById('output');
const previewEl                 = document.getElementById('preview-wrapper');
const previewTrackEl            = document.getElementById('preview-custom-scrollbar');
const previewThumbEl            = document.getElementById('preview-custom-scrollbar-thumb');
const previewHScrollbarEl       = document.getElementById('preview-hscrollbar');
const previewHThumbEl           = document.getElementById('preview-hscrollbar-thumb');
const editorOverlayEl           = document.getElementById('editor-scroll-overlay');
const previewOverlayEl          = document.getElementById('preview-scroll-overlay');
const previewFullscreenOverlayEl = document.getElementById('preview-fullscreen-popup');
const editorClearallOverlayEl   = document.getElementById('editor-clearall-popup');
const editPaneContainer         = document.getElementById('edit');
const previewPaneContainer      = document.getElementById('preview');

// ── Scroll-position state helpers ────────────────────────────────────────────
const computeScrollRatio = (el) => {
  if (!el) return 0;
  const max = el.scrollHeight - el.clientHeight;
  if (max <= 0) return 0;
  return Math.max(0, Math.min(1, el.scrollTop / max));
};

const applyScrollRatio = (el, ratio) => {
  if (!el || ratio == null) return;
  const max = el.scrollHeight - el.clientHeight;
  if (max <= 0) return;
  el.scrollTop = ratio * max;
};

const persistScrollPositions = () => {
  if (!editorEl || !previewEl) return;
  saveScrollPositions(
    computeScrollRatio(editorEl),
    computeScrollRatio(previewEl),
    editorEl.selectionStart
  );
};

// ── Bootstrap ────────────────────────────────────────────────────────────────
const bootstrap = () => {
  // 1. Core UI chrome
  const dividerHandle = setupDivider();
  initSwapButton(dividerHandle);
  initMermaid();
  initDynamicSvg();

  // 2. Scroll sync (encapsulates activePane tracking internally)
  const scrollSync = initScrollSync(editorEl, previewEl, editPaneContainer, previewPaneContainer);

  // 3. Settings panel (wrench popup + hue/brightness sliders)
  initSettingsPanel(previewEl, outputEl, renderMermaidDiagrams);

  // 4. Custom scrollbars + proximity overlays
  const previewScrollbar = initPreviewCustomScrollbar(previewEl, previewTrackEl, previewThumbEl);
  if (previewScrollbar && previewOverlayEl) {
    previewScrollbar.setupOverlay(previewOverlayEl);
  }
  const previewHScrollbar = initPreviewHorizontalScrollbar(previewEl, previewHScrollbarEl, previewHThumbEl);
  if (previewFullscreenOverlayEl && previewPaneContainer) {
    setupFullscreenOverlay(previewFullscreenOverlayEl, previewPaneContainer);
  }
  if (editorClearallOverlayEl && editPaneContainer) {
    setupClearallOverlay(editorClearallOverlayEl, editPaneContainer);
  }
  initFullscreenButton(previewFullscreenOverlayEl);
  initClearallButton(editorClearallOverlayEl);

  // 5. Selection engine
  const selectionEngine = new SelectionEngine(outputEl);

  // 6. Editor controller
  const editorController = initEditorController({
    editor: editorEl,
    editorHighlight: editorHighlightEl,
    customScrollbar: customScrollbarEl,
    customScrollbarThumb: customScrollbarThumbEl,
    caretIndicator: caretIndicatorEl,
    scrollOverlay: editorOverlayEl,
    onInput: (value) => {
      convert(outputEl, value);
      selectionEngine.setMarkdown(value);
      saveLastContent(value);
      if (previewScrollbar) previewScrollbar.update();
      if (previewHScrollbar) previewHScrollbar.update();
      updateThemedLogos();
    },
    onSelectionChange: (start, end) => {
      selectionEngine.updateSelection(start, end);
    }
  });

  // 7. Load content and restore scroll/caret positions
  const savedScrolls = loadScrollPositions();

  const onContentReady = (content) => {
    if (editorController) {
      editorController.presetValue(content);
    }
    selectionEngine.setMarkdown(editorEl ? editorEl.value : content);
    if (savedScrolls && editorEl && previewEl) {
      applyScrollRatio(editorEl, savedScrolls.editor);
      if (editorHighlightEl) editorHighlightEl.scrollTop = editorEl.scrollTop;
      if (savedScrolls.caret != null && savedScrolls.caret <= editorEl.value.length) {
        editorEl.setSelectionRange(savedScrolls.caret, savedScrolls.caret);
      }
      if (editorController) {
        editorController.updateHighlight();
        editorController.updateScrollbars();
      }
      renderMermaidDiagrams(outputEl).then(() => {
        applyScrollRatio(previewEl, savedScrolls.preview);
        if (previewScrollbar) previewScrollbar.update();
        if (previewHScrollbar) previewHScrollbar.update();
        updateThemedLogos();
      });
    } else if (editorController) {
      editorController.updateScrollbars();
      updateThemedLogos();
    }
  };

  const lastContent = loadLastContent();
  if (lastContent) {
    onContentReady(lastContent);
  } else {
    fetch('DEFAULT.md')
      .then(r => r.ok ? r.text() : Promise.reject(new Error('HTTP ' + r.status)))
      .then(text => onContentReady(text))
      .catch(() => onContentReady(defaultInputFallback));
  }

  // 8. Action buttons
  initCopyButton(editorEl);
  initDownloadButton(editorEl);
  initPdfButton(outputEl);

  // 8b. Drag-and-drop .md files anywhere on the page
  initDropLoader({
    editorController,
    onAfterLoad: () => {
      if (previewEl) previewEl.scrollTop = 0;
      if (previewScrollbar) previewScrollbar.update();
      if (previewHScrollbar) previewHScrollbar.update();
    }
  });

  // 9. Toggles
  scrollSync.initScrollBarSyncToggle(loadScrollBarSettings());
  initThemeToggle(previewEl, outputEl, renderMermaidDiagrams);

  // 10. Wrap any existing UI emojis
  wrapEmojis(document.body);

  // 11. Persist scroll positions on scroll and unload
  if (editorEl) editorEl.addEventListener('scroll', persistScrollPositions, { passive: true });
  if (previewEl) previewEl.addEventListener('scroll', persistScrollPositions, { passive: true });
  window.addEventListener('beforeunload', persistScrollPositions);

  // 12. Implicit focus detection and Ctrl+A handling
  let focusedPane = 'editor';
  if (editPaneContainer) {
    editPaneContainer.addEventListener('mouseenter', () => focusedPane = 'editor');
    editPaneContainer.addEventListener('focusin', () => focusedPane = 'editor');
  }
  if (previewPaneContainer) {
    previewPaneContainer.addEventListener('mouseenter', () => focusedPane = 'preview');
    previewPaneContainer.addEventListener('focusin', () => focusedPane = 'preview');
  }

  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
      if (focusedPane === 'preview') {
        e.preventDefault();
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(outputEl);
        selection.removeAllRanges();
        selection.addRange(range);
      } else if (focusedPane === 'editor') {
        if (document.activeElement !== editorEl) {
          e.preventDefault();
          editorEl.focus();
          editorEl.select();
        }
      }
    }
  });
};

// Start application
bootstrap();
