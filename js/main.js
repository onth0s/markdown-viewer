import { defaultInputFallback } from './common/constants.js';
import {
  saveLastContent,
  loadLastContent,
  loadScrollBarSettings,
  saveScrollPositions,
  loadScrollPositions
} from './common/storage.js';
import { setupDivider, initSwapButton } from './common/ui-divider.js';
import { setupFullscreenOverlay, setupClearallOverlay, initFullscreenButton, initClearallButton } from './common/scroll-utils.js';
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

let persistScrollPositions = () => {
  if (!editorEl || !previewEl) return;
  saveScrollPositions(
    computeScrollRatio(editorEl),
    computeScrollRatio(previewEl),
    editorEl.selectionStart
  );
};

// ── Bootstrap ────────────────────────────────────────────────────────────────
let bootstrap = () => {
  // 1. Core UI chrome
  setupDivider();
  initSwapButton();
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
  const previewHOverlayEl = document.getElementById('preview-hscroll-overlay');
  if (previewHScrollbar && previewHOverlayEl) {
    previewHScrollbar.setupOverlay(previewHOverlayEl);
  }
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
  let savedScrolls = loadScrollPositions();

  let onContentReady = (content) => {
    if (editorController) {
      editorController.presetValue(content);
    }
    selectionEngine.setMarkdown(content);
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

  let lastContent = loadLastContent();
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
  initPdfButton(previewEl, outputEl);

  // 9. Toggles
  scrollSync.initScrollBarSyncToggle(loadScrollBarSettings());
  initThemeToggle(previewEl, outputEl, renderMermaidDiagrams);

  // 10. Persist scroll positions on scroll and unload
  if (editorEl) editorEl.addEventListener('scroll', persistScrollPositions, { passive: true });
  if (previewEl) previewEl.addEventListener('scroll', persistScrollPositions, { passive: true });
  window.addEventListener('beforeunload', persistScrollPositions);
};

// Start application
bootstrap();
