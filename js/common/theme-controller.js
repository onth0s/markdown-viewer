/**
 * @file theme-controller.js
 * Wires the dark / light theme toggle to the UI and swaps CSS stylesheet links
 * for both the GitHub Markdown theme and Prism syntax highlighting.
 *
 * Depends on theme-engine.js for palette math and logo-engine.js for icon repaints.
 */

import { PREVIEW_CSS_LIGHT, PREVIEW_CSS_DARK, PRISM_CSS_LIGHT, PRISM_CSS_DARK } from './constants.js';
import { getBrightness, applyBrightness, saveBrightness, DEFAULT_LIGHT_BRIGHTNESS, DEFAULT_DARK_BRIGHTNESS } from './theme-engine.js';
import { updateThemedLogos } from './logo-engine.js';

/**
 * Swaps the GitHub Markdown and Prism CSS <link> elements to the correct theme.
 * Returns a Promise that resolves once the new stylesheet has loaded (or immediately
 * if the link was just created or already points at the desired href).
 *
 * @param {boolean} useDark
 * @returns {Promise<void>}
 */
export let setPreviewCss = (useDark) => {
  let link = document.getElementById('gh-markdown-link');
  let desired = useDark ? PREVIEW_CSS_DARK : PREVIEW_CSS_LIGHT;

  let prismLink = document.getElementById('prism-theme-link');
  let desiredPrism = useDark ? PRISM_CSS_DARK : PRISM_CSS_LIGHT;

  if (prismLink) {
    prismLink.setAttribute('href', desiredPrism);
  }

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

/**
 * Sets the data-theme attribute on the document root.
 * @param {boolean} enabled - true → dark, false → light
 */
export let setTheme = (enabled) => {
  document.documentElement.setAttribute('data-theme', enabled ? 'dark' : 'light');
};

/**
 * Reads stored brightness, applies it, and wires the theme toggle button.
 *
 * @param {HTMLElement} previewEl              - Preview wrapper (for scroll-ratio preservation)
 * @param {HTMLElement} outputEl               - Output element (for Mermaid re-render)
 * @param {function}    renderMermaidDiagrams  - Async fn to re-render Mermaid diagrams
 */
export let initThemeToggle = (previewEl, outputEl, renderMermaidDiagrams) => {
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
