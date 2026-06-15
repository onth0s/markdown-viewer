import { loadSwappedState, saveSwappedState, savePaneRatio, loadPaneRatio } from './storage.js';

/**
 * Sets up the split-pane divider drag behaviour.
 * Returns a divider handle object so the swap button can access current state
 * without relying on module-level mutable variables.
 *
 * @returns {{ applyRatio: (ratio: number) => void, getLastRatio: () => number }}
 */
export const setupDivider = () => {
  const divider = document.getElementById('split-divider');
  const leftPane = document.getElementById('edit');
  const rightPane = document.getElementById('preview');
  const container = document.getElementById('container');
  let isDragging = false;

  if (!divider || !leftPane || !rightPane || !container) return { applyRatio: () => {}, getLastRatio: () => 0.5 };

  const isPortrait = () => window.innerWidth < window.innerHeight;
  const isSwapped = () => document.documentElement.hasAttribute('data-swapped');

  // Restore persisted ratio or fall back to 50/50
  let lastLeftRatio = loadPaneRatio() ?? 0.5;

  const applyRatio = (ratio) => {
    const cr = container.getBoundingClientRect();
    if (isPortrait()) {
      leftPane.style.width = '';
      rightPane.style.width = '';
      const dh = divider.offsetHeight;
      const avail = cr.height - dh;
      leftPane.style.height = (avail * ratio) + 'px';
      rightPane.style.height = (avail * (1 - ratio)) + 'px';
    } else {
      leftPane.style.height = '';
      rightPane.style.height = '';
      const dw = divider.offsetWidth;
      const avail = cr.width - dw;
      leftPane.style.width = (avail * ratio) + 'px';
      rightPane.style.width = (avail * (1 - ratio)) + 'px';
    }
  };

  // Apply exact pixel sizes — container dimensions are already known
  // since the module runs after full DOM parse
  applyRatio(lastLeftRatio);

  const startDrag = () => {
    isDragging = true;
    divider.classList.add('active');
    document.body.style.cursor = isPortrait() ? 'row-resize' : 'col-resize';
  };

  const moveDrag = (clientX, clientY) => {
    if (!isDragging) return;
    const cr = container.getBoundingClientRect();
    const dw = divider.offsetWidth;
    const dh = divider.offsetHeight;
    const minSize = 100;

    if (isPortrait()) {
      const offsetY = clientY - cr.top;
      const maxH = cr.height - minSize - dh;
      const topH = Math.max(minSize, Math.min(offsetY, maxH));

      if (isSwapped()) {
        // column-reverse: preview at top, editor at bottom
        rightPane.style.height = topH + 'px';
        leftPane.style.height = (cr.height - topH - dh) + 'px';
        lastLeftRatio = (cr.height - topH - dh) / (cr.height - dh);
      } else {
        leftPane.style.height = topH + 'px';
        rightPane.style.height = (cr.height - topH - dh) + 'px';
        lastLeftRatio = topH / (cr.height - dh);
      }
    } else {
      const offsetX = clientX - cr.left;
      const maxW = cr.width - minSize - dw;
      const leftW = Math.max(minSize, Math.min(offsetX, maxW));

      if (isSwapped()) {
        // row-reverse: preview on the left, editor on the right
        rightPane.style.width = leftW + 'px';
        leftPane.style.width = (cr.width - leftW - dw) + 'px';
        lastLeftRatio = (cr.width - leftW - dw) / (cr.width - dw);
      } else {
        leftPane.style.width = leftW + 'px';
        rightPane.style.width = (cr.width - leftW - dw) + 'px';
        lastLeftRatio = leftW / (cr.width - dw);
      }
    }
  };

  const endDrag = () => {
    if (isDragging) {
      isDragging = false;
      divider.classList.remove('active', 'hover');
      document.body.style.cursor = 'default';
      savePaneRatio(lastLeftRatio);
    }
  };

  divider.addEventListener('mouseenter', () => divider.classList.add('hover'));
  divider.addEventListener('mouseleave', () => { if (!isDragging) divider.classList.remove('hover'); });
  divider.addEventListener('mousedown', (e) => { e.preventDefault(); startDrag(); });
  divider.addEventListener('touchstart', (e) => { e.preventDefault(); startDrag(); }, { passive: false });
  divider.addEventListener('dblclick', () => {
    lastLeftRatio = 0.5;
    applyRatio(lastLeftRatio);
    savePaneRatio(lastLeftRatio);
  });

  document.addEventListener('mousemove', (e) => moveDrag(e.clientX, e.clientY));
  document.addEventListener('touchmove', (e) => {
    const t = e.touches[0];
    if (t) { e.preventDefault(); moveDrag(t.clientX, t.clientY); }
  }, { passive: false });

  document.addEventListener('mouseup', endDrag);
  document.addEventListener('touchend', endDrag);

  document.addEventListener('mouseleave', () => {
    if (isDragging) {
      isDragging = false;
      divider.classList.remove('active', 'hover');
      document.body.style.cursor = 'default';
      savePaneRatio(lastLeftRatio);
    }
  });

  window.addEventListener('resize', () => applyRatio(lastLeftRatio));

  return {
    applyRatio,
    getLastRatio: () => lastLeftRatio
  };
};

/**
 * Wires the swap-panes button.
 * @param {{ applyRatio: (ratio: number) => void, getLastRatio: () => number }} dividerHandle
 *   The object returned by setupDivider(). Passed explicitly to avoid module-level state.
 */
export const initSwapButton = (dividerHandle) => {
  const swapButton = document.getElementById('swap-button');
  if (!swapButton) return;

  // Initialize from storage
  const swapped = loadSwappedState();
  if (swapped) {
    document.documentElement.setAttribute('data-swapped', '');
  } else {
    document.documentElement.removeAttribute('data-swapped');
  }

  swapButton.addEventListener('click', () => {
    let isSwapped = loadSwappedState();
    isSwapped = !isSwapped;
    saveSwappedState(isSwapped);
    if (isSwapped) {
      document.documentElement.setAttribute('data-swapped', '');
    } else {
      document.documentElement.removeAttribute('data-swapped');
    }
    // Re-apply ratio so panes reflow in the new layout
    if (dividerHandle) {
      requestAnimationFrame(() => dividerHandle.applyRatio(dividerHandle.getLastRatio()));
    }
  });
};
