/**
 * @file overlay-actions.js
 * Wires the fullscreen and clear-all popup button actions.
 * The proximity-based visibility of these overlays is handled by scroll-utils.js;
 * this module only binds the click behaviour.
 */

/**
 * Wires the fullscreen toggle button inside the preview fullscreen overlay.
 * Toggles the data-fullscreen attribute on the document root and fires a resize event.
 *
 * @param {HTMLElement} overlayEl - The fullscreen popup overlay element
 */
export const initFullscreenButton = (overlayEl) => {
  const btn = overlayEl && overlayEl.querySelector('.fullscreen-popup-btn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const isFullscreen = document.documentElement.hasAttribute('data-fullscreen');
    if (isFullscreen) {
      document.documentElement.removeAttribute('data-fullscreen');
      window.dispatchEvent(new Event('resize'));
    } else {
      document.documentElement.setAttribute('data-fullscreen', '');
    }
  });
};

/**
 * Wires the clear-all button inside the editor clearall overlay.
 * Clears all localStorage data and reloads the page.
 *
 * @param {HTMLElement} overlayEl - The clearall popup overlay element
 */
export const initClearallButton = (overlayEl) => {
  const btn = overlayEl && overlayEl.querySelector('.clearall-popup-btn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    localStorage.clear();
    location.reload();
  });
};
