/**
 * @file settings-panel.js
 * Wires the wrench (⚙) popup, hue slider, and brightness slider.
 * Extracted from main.js bootstrap to keep UI widget concerns separate.
 */

import { getHue, applyHue, saveHue, DEFAULT_HUE } from './color-engine.js';
import { getBrightness, applyBrightness, saveBrightness, DEFAULT_LIGHT_BRIGHTNESS, DEFAULT_DARK_BRIGHTNESS } from './theme-engine.js';
import { updateThemedLogos } from './logo-engine.js';
import { setTheme, setPreviewCss } from './theme-controller.js';

/**
 * Initialises the settings panel.
 *
 * @param {HTMLElement} previewEl             - Preview wrapper (for scroll-ratio preservation)
 * @param {HTMLElement} outputEl              - Output element (for Mermaid re-render)
 * @param {function}    renderMermaidDiagrams - Async fn to re-render Mermaid diagrams
 */
export const initSettingsPanel = (previewEl, outputEl, renderMermaidDiagrams) => {

  // ── Wrench popup toggle ───────────────────────────────────────────────────
  const wrenchBtn = document.getElementById('wrench-button');
  const wrenchPopup = document.getElementById('wrench-popup');
  if (wrenchBtn && wrenchPopup) {
    const positionPopup = () => {
      const header = document.querySelector('header');
      const btnRect = wrenchBtn.getBoundingClientRect();
      const navBottom = header ? header.getBoundingClientRect().bottom : btnRect.bottom;
      wrenchPopup.style.top = (navBottom + 4) + 'px';
      wrenchPopup.style.left = btnRect.left + 'px';
    };
    wrenchBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const opening = !wrenchBtn.classList.contains('open');
      wrenchBtn.classList.toggle('open');
      if (opening) positionPopup();
    });
    wrenchPopup.addEventListener('click', (e) => { e.stopPropagation(); });
    document.addEventListener('click', () => wrenchBtn.classList.remove('open'));
  }

  // ── Hue slider ───────────────────────────────────────────────────────────
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
    // Click the label → reset to default hue
    const hueLabel = document.querySelector('.wrench-label[for="hue-slider"]');
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

  // ── Brightness slider ─────────────────────────────────────────────────────
  const brightnessSlider = document.getElementById('brightness-slider');
  if (brightnessSlider) {
    brightnessSlider.value = getBrightness();

    brightnessSlider.addEventListener('input', async () => {
      const val = parseInt(brightnessSlider.value, 10);
      applyBrightness(val);
      updateThemedLogos();

      const isDark = val >= 50;
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = isDark ? 'dark' : 'light';
      if (currentTheme !== newTheme) {
        setTheme(isDark);
        const ratio = (previewEl && (previewEl.scrollHeight - previewEl.clientHeight) > 0)
          ? previewEl.scrollTop / (previewEl.scrollHeight - previewEl.clientHeight)
          : 0;
        await setPreviewCss(isDark);
        await renderMermaidDiagrams(outputEl);
        if (previewEl && (previewEl.scrollHeight - previewEl.clientHeight) > 0) {
          previewEl.scrollTop = ratio * (previewEl.scrollHeight - previewEl.clientHeight);
        }
      }
    });

    brightnessSlider.addEventListener('change', () => {
      const val = parseInt(brightnessSlider.value, 10);
      saveBrightness(val);
    });

    // Click the label → reset brightness to the default for the current side
    const brightnessLabel = document.querySelector('.wrench-label[for="brightness-slider"]');
    if (brightnessLabel) {
      brightnessLabel.addEventListener('click', async (e) => {
        e.preventDefault();
        const val = parseInt(brightnessSlider.value, 10);
        const targetVal = val < 50 ? DEFAULT_LIGHT_BRIGHTNESS : DEFAULT_DARK_BRIGHTNESS;

        brightnessSlider.value = targetVal;
        applyBrightness(targetVal);
        updateThemedLogos();
        saveBrightness(targetVal);

        const isDark = targetVal >= 50;
        setTheme(isDark);
        const ratio = (previewEl && (previewEl.scrollHeight - previewEl.clientHeight) > 0)
          ? previewEl.scrollTop / (previewEl.scrollHeight - previewEl.clientHeight)
          : 0;
        await setPreviewCss(isDark);
        await renderMermaidDiagrams(outputEl);
        if (previewEl && (previewEl.scrollHeight - previewEl.clientHeight) > 0) {
          previewEl.scrollTop = ratio * (previewEl.scrollHeight - previewEl.clientHeight);
        }
      });
    }
  }
};
