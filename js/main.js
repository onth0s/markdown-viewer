import { defaultInputFallback, PREVIEW_CSS_LIGHT, PREVIEW_CSS_DARK } from './common/constants.js';
import { getHue, applyHue, saveHue, DEFAULT_HUE } from './common/color-engine.js';
import {
  getBrightness,
  applyBrightness,
  saveBrightness,
  DEFAULT_LIGHT_BRIGHTNESS,
  DEFAULT_DARK_BRIGHTNESS
} from './common/theme-engine.js';
import {
  saveLastContent,
  loadLastContent,
  loadThemeSettings,
  saveThemeSettings,
  loadScrollBarSettings,
  saveScrollBarSettings,
  saveScrollPositions,
  loadScrollPositions
} from './common/storage.js';
import { setupDivider, initSwapButton } from './common/ui-divider.js';
import { initEditorController } from './editor/editor-controller.js';
import { initMermaid, renderMermaidDiagrams } from './preview/mermaid-renderer.js';
import { convert } from './preview/markdown-renderer.js';
import { initPreviewCustomScrollbar } from './preview/scrollbars.js';
import { initPreviewHorizontalScrollbar } from './preview/hscrollbar.js';
import { setupFullscreenOverlay, setupClearallOverlay } from './common/scroll-utils.js';
import { initCopyButton, initDownloadButton, initPdfButton } from './preview/actions.js';
import { initDynamicSvg, updateThemedLogos } from './common/logo-engine.js';
import { SelectionEngine } from './selection/selection-engine.js';

// DOM elements
const editorEl = document.getElementById('editor');
const editorHighlightEl = document.getElementById('editor-highlight');
const caretIndicatorEl = document.getElementById('caret-indicator');
const customScrollbarEl = document.getElementById('custom-scrollbar');
const customScrollbarThumbEl = document.getElementById('custom-scrollbar-thumb');
const outputEl = document.getElementById('output');
const previewEl = document.getElementById('preview-wrapper');
const previewTrackEl = document.getElementById('preview-custom-scrollbar');
const previewThumbEl = document.getElementById('preview-custom-scrollbar-thumb');
const previewHScrollbarEl = document.getElementById('preview-hscrollbar');
const previewHThumbEl = document.getElementById('preview-hscrollbar-thumb');
const editorOverlayEl = document.getElementById('editor-scroll-overlay');
const previewOverlayEl = document.getElementById('preview-scroll-overlay');
const previewFullscreenOverlayEl = document.getElementById('preview-fullscreen-popup');
const editorClearallOverlayEl = document.getElementById('editor-clearall-popup');

let scrollBarSync = false;
let activePane = 'editor';

let setActivePane = (pane) => { activePane = pane; };

// Setup pane focus listeners
const editPaneContainer = document.getElementById('edit');
const previewPaneContainer = document.getElementById('preview');

if (editPaneContainer) editPaneContainer.addEventListener('pointerenter', () => setActivePane('editor'));
if (previewPaneContainer) {
  previewPaneContainer.addEventListener('pointerenter', () => setActivePane('preview'));
  

}
if (editorEl) editorEl.addEventListener('focus', () => setActivePane('editor'));

// Scroll Synchronization Logic
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

if (editorEl && previewEl) {
  editorEl.addEventListener('scroll', () => {
    if (!scrollBarSync) return;
    if (activePane !== 'editor') return;
    syncPaneToPane(editorEl, previewEl);
  });

  previewEl.addEventListener('scroll', () => {
    if (!scrollBarSync) return;
    if (activePane !== 'preview') return;
    syncPaneToPane(previewEl, editorEl);
  });
}

let setSyncScroll = (enabled) => {
  document.documentElement.setAttribute('data-sync', enabled ? 'on' : 'off');
  scrollBarSync = enabled;
  if (enabled && editorEl && previewEl) {
    syncPaneToPane(editorEl, previewEl);
  }
};

let initScrollBarSyncToggle = (settings) => {
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

// Theme Toggling Logic
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

let initThemeToggle = () => {
  let brightness = getBrightness();
  setTheme(brightness >= 50);
  setPreviewCss(brightness >= 50);
  applyBrightness(brightness);

  let toggle = document.querySelector('.theme-toggle');
  if (!toggle) return;
  toggle.addEventListener('click', async () => {
    let currentB = getBrightness();
    let checked = currentB < 50;
    let newB = checked ? DEFAULT_DARK_BRIGHTNESS : DEFAULT_LIGHT_BRIGHTNESS;

    let ratio = (previewEl.scrollHeight - previewEl.clientHeight) > 0
      ? previewEl.scrollTop / (previewEl.scrollHeight - previewEl.clientHeight)
      : 0;

    applyBrightness(newB);
    saveBrightness(newB);
    setTheme(checked);
    updateThemedLogos();

    let brightnessSlider = document.getElementById('brightness-slider');
    if (brightnessSlider) {
      brightnessSlider.value = newB;
    }

    await setPreviewCss(checked);
    await renderMermaidDiagrams(outputEl);
    if ((previewEl.scrollHeight - previewEl.clientHeight) > 0) {
      previewEl.scrollTop = ratio * (previewEl.scrollHeight - previewEl.clientHeight);
    }
  });
};

// State preservation
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

// Bootstrap function
let bootstrap = () => {
  // 1. Init UI components
  setupDivider();
  initSwapButton();
  initMermaid();
  initDynamicSvg();

  // Wrench popup toggle
  const wrenchBtn = document.getElementById('wrench-button');
  const wrenchPopup = document.getElementById('wrench-popup');
  if (wrenchBtn && wrenchPopup) {
    let positionPopup = () => {
      let header = document.querySelector('header');
      let btnRect = wrenchBtn.getBoundingClientRect();
      let navBottom = header ? header.getBoundingClientRect().bottom : btnRect.bottom;
      wrenchPopup.style.top = (navBottom + 4) + 'px';
      wrenchPopup.style.left = btnRect.left + 'px';
    };
    wrenchBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      let opening = !wrenchBtn.classList.contains('open');
      wrenchBtn.classList.toggle('open');
      if (opening) positionPopup();
    });
    wrenchPopup.addEventListener('click', (e) => { e.stopPropagation(); });
    document.addEventListener('click', () => wrenchBtn.classList.remove('open'));
  }

  // Hue slider
  const hueSlider = document.getElementById('hue-slider');
  if (hueSlider) {
    hueSlider.value = getHue();
    hueSlider.addEventListener('input', () => {
      applyHue(hueSlider.value);
      updateThemedLogos();
    });
    hueSlider.addEventListener('change', () => {
      saveHue(hueSlider.value);
    });
    // Click the label → reset to default
    let hueLabel = document.querySelector('.wrench-label[for="hue-slider"]');
    if (hueLabel) {
      hueLabel.addEventListener('click', (e) => {
        e.preventDefault();
        hueSlider.value = DEFAULT_HUE;
        applyHue(DEFAULT_HUE);
        updateThemedLogos();
        saveHue(DEFAULT_HUE);
      });
    }
  }

  // Brightness slider
  const brightnessSlider = document.getElementById('brightness-slider');
  if (brightnessSlider) {
    brightnessSlider.value = getBrightness();
    brightnessSlider.addEventListener('input', async () => {
      let val = parseInt(brightnessSlider.value, 10);
      applyBrightness(val);
      updateThemedLogos();

      let isDark = val >= 50;
      let currentTheme = document.documentElement.getAttribute('data-theme');
      let newTheme = isDark ? 'dark' : 'light';
      if (currentTheme !== newTheme) {
        setTheme(isDark);
        let ratio = (previewEl.scrollHeight - previewEl.clientHeight) > 0
          ? previewEl.scrollTop / (previewEl.scrollHeight - previewEl.clientHeight)
          : 0;
        await setPreviewCss(isDark);
        await renderMermaidDiagrams(outputEl);
        if ((previewEl.scrollHeight - previewEl.clientHeight) > 0) {
          previewEl.scrollTop = ratio * (previewEl.scrollHeight - previewEl.clientHeight);
        }
      }
    });

    brightnessSlider.addEventListener('change', () => {
      let val = parseInt(brightnessSlider.value, 10);
      saveBrightness(val);
    });

    // Reset label click handler based on proximity
    let brightnessLabel = document.querySelector('.wrench-label[for="brightness-slider"]');
    if (brightnessLabel) {
      brightnessLabel.addEventListener('click', async (e) => {
        e.preventDefault();
        let val = parseInt(brightnessSlider.value, 10);
        let targetVal = val < 50 ? DEFAULT_LIGHT_BRIGHTNESS : DEFAULT_DARK_BRIGHTNESS;

        brightnessSlider.value = targetVal;
        applyBrightness(targetVal);
        updateThemedLogos();
        saveBrightness(targetVal);

        let isDark = targetVal >= 50;
        setTheme(isDark);
        let ratio = (previewEl.scrollHeight - previewEl.clientHeight) > 0
          ? previewEl.scrollTop / (previewEl.scrollHeight - previewEl.clientHeight)
          : 0;
        await setPreviewCss(isDark);
        await renderMermaidDiagrams(outputEl);
        if ((previewEl.scrollHeight - previewEl.clientHeight) > 0) {
          previewEl.scrollTop = ratio * (previewEl.scrollHeight - previewEl.clientHeight);
        }
      });
    }
  }

  // 2. Setup Scrollbars
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

  const fullscreenBtn = previewFullscreenOverlayEl && previewFullscreenOverlayEl.querySelector('.fullscreen-popup-btn');
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', () => {
      let isFullscreen = document.documentElement.hasAttribute('data-fullscreen');
      if (isFullscreen) {
        document.documentElement.removeAttribute('data-fullscreen');
        window.dispatchEvent(new Event('resize'));
      } else {
        document.documentElement.setAttribute('data-fullscreen', '');
      }
    });
  }

  const clearallBtn = editorClearallOverlayEl && editorClearallOverlayEl.querySelector('.clearall-popup-btn');
  if (clearallBtn) {
    clearallBtn.addEventListener('click', () => {
      localStorage.clear();
      location.reload();
    });
  }

  // 3. Init Selection Engine
  const selectionEngine = new SelectionEngine(outputEl);

  // 4. Init Editor Controller
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

  // 5. Load content and apply positions
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

  // 5. Setup Action Buttons
  initCopyButton(editorEl);
  initDownloadButton(editorEl);
  initPdfButton(previewEl, outputEl);

  // 6. Setup toggles
  initScrollBarSyncToggle(loadScrollBarSettings());
  initThemeToggle();

  // 7. Attach scroll/unload listener for state preservation
  if (editorEl) editorEl.addEventListener('scroll', persistScrollPositions, { passive: true });
  if (previewEl) previewEl.addEventListener('scroll', persistScrollPositions, { passive: true });
  window.addEventListener('beforeunload', persistScrollPositions);
};

// Start application
bootstrap();
