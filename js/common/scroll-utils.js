/**
 * @file scroll-utils.js
 * Shared scroll overlay utility used by both the editor and preview panes.
 */

const PROXIMITY_THRESHOLD = 60;

/**
 * Factory that attaches a proximity-based overlay to a wrapper element.
 * The overlay becomes visible when `triggerFn` returns true for the cursor position.
 *
 * @param {HTMLElement} overlayEl  - The overlay element to show/hide.
 * @param {HTMLElement} wrapperEl  - The element whose mousemove events are tracked.
 * @param {function}    triggerFn  - (mouseX, mouseY, rect) => boolean
 */
const setupProximityOverlay = (overlayEl, wrapperEl, triggerFn) => {
  if (!overlayEl || !wrapperEl) return;

  const show = () => overlayEl.classList.add('visible');
  const hide = () => overlayEl.classList.remove('visible');

  wrapperEl.addEventListener('mousemove', (e) => {
    const rect = wrapperEl.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    if (triggerFn(mouseX, mouseY, rect)) {
      show();
    } else {
      hide();
    }
  });

  wrapperEl.addEventListener('mouseleave', hide);
  overlayEl.addEventListener('mouseenter', show);
  overlayEl.addEventListener('mouseleave', hide);
};

/**
 * Attaches a proximity-based scroll overlay to a scrollable element.
 * The overlay becomes visible when the cursor hovers near the top-right
 * or bottom-right corner of the wrapping element.
 *
 * @param {HTMLElement} overlayEl - The overlay element to show/hide.
 * @param {HTMLElement} scrollEl  - The scrollable target element.
 */
export const setupScrollOverlay = (overlayEl, scrollEl) => {
  if (!overlayEl || !scrollEl) return;

  const wrapper = scrollEl.parentElement;
  if (!wrapper) return;

  setupProximityOverlay(overlayEl, wrapper, (mouseX, mouseY, rect) => {
    const nearRight = mouseX >= rect.width - PROXIMITY_THRESHOLD;
    const nearTop = mouseY <= PROXIMITY_THRESHOLD;
    const nearBottom = mouseY >= rect.height - PROXIMITY_THRESHOLD;
    if (nearRight && (nearTop || nearBottom)) {
      overlayEl.classList.toggle('at-top', nearTop);
      overlayEl.classList.toggle('at-bottom', nearBottom);
      return true;
    }
    return false;
  });

  const topBtn = overlayEl.querySelector('.scroll-popup-top');
  const bottomBtn = overlayEl.querySelector('.scroll-popup-bottom');
  if (topBtn) topBtn.addEventListener('click', () => { scrollEl.scrollTop = 0; });
  if (bottomBtn) bottomBtn.addEventListener('click', () => { scrollEl.scrollTop = scrollEl.scrollHeight; });
};

export const setupFullscreenOverlay = (overlayEl, wrapperEl) => {
  setupProximityOverlay(overlayEl, wrapperEl, (mouseX, mouseY) => {
    return mouseX <= PROXIMITY_THRESHOLD && mouseY <= PROXIMITY_THRESHOLD;
  });
};

export const setupClearallOverlay = (overlayEl, wrapperEl) => {
  if (!overlayEl || !wrapperEl) return;
  setupProximityOverlay(overlayEl, wrapperEl, (mouseX, mouseY, rect) => {
    return mouseX <= PROXIMITY_THRESHOLD && mouseY >= rect.height - PROXIMITY_THRESHOLD;
  });
};
