/**
 * @file scroll-utils.js
 * Shared scroll overlay utility used by both the editor and preview panes.
 */

/**
 * Attaches a proximity-based scroll overlay to a scrollable element.
 * The overlay becomes visible when the cursor hovers near the top-right
 * or bottom-right corner of the wrapping element.
 *
 * @param {HTMLElement} overlayEl - The overlay element to show/hide.
 * @param {HTMLElement} scrollEl  - The scrollable target element.
 */
export let setupScrollOverlay = (overlayEl, scrollEl) => {
  if (!overlayEl || !scrollEl) return;
  let PROXIMITY_THRESHOLD = 60;

  let show = () => { overlayEl.classList.add('visible'); };
  let hide = () => { overlayEl.classList.remove('visible'); };

  let wrapper = scrollEl.parentElement;
  if (wrapper) {
    wrapper.addEventListener('mousemove', (e) => {
      let rect = wrapper.getBoundingClientRect();
      let mouseY = e.clientY - rect.top;
      let mouseX = e.clientX - rect.left;
      let height = rect.height;
      let nearRight = mouseX >= rect.width - PROXIMITY_THRESHOLD;
      let nearTop = mouseY <= PROXIMITY_THRESHOLD;
      let nearBottom = mouseY >= height - PROXIMITY_THRESHOLD;

      if (nearRight && (nearTop || nearBottom)) {
        overlayEl.classList.toggle('at-top', nearTop);
        overlayEl.classList.toggle('at-bottom', nearBottom);
        show();
      } else {
        hide();
      }
    });

    wrapper.addEventListener('mouseleave', () => { hide(); });
  }

  overlayEl.addEventListener('mouseenter', () => { show(); });
  overlayEl.addEventListener('mouseleave', () => { hide(); });

  let topBtn = overlayEl.querySelector('.scroll-popup-top');
  let bottomBtn = overlayEl.querySelector('.scroll-popup-bottom');

  if (topBtn) {
    topBtn.addEventListener('click', () => { scrollEl.scrollTop = 0; });
  }
  if (bottomBtn) {
    bottomBtn.addEventListener('click', () => { scrollEl.scrollTop = scrollEl.scrollHeight; });
  }
};
