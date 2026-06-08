import { loadSwappedState, saveSwappedState, savePaneRatio, loadPaneRatio } from './storage.js';

export let setupDivider = () => {
  let divider = document.getElementById('split-divider');
  let leftPane = document.getElementById('edit');
  let rightPane = document.getElementById('preview');
  let container = document.getElementById('container');
  let isDragging = false;

  if (!divider || !leftPane || !rightPane || !container) return;

  let isPortrait = () => window.innerWidth < window.innerHeight;

  // Restore persisted ratio or fall back to 50/50
  let lastLeftRatio = loadPaneRatio() ?? 0.5;

  let applyRatio = (ratio) => {
    let cr = container.getBoundingClientRect();
    if (isPortrait()) {
      leftPane.style.width = '';
      rightPane.style.width = '';
      let dh = divider.offsetHeight;
      let avail = cr.height - dh;
      leftPane.style.height = (avail * ratio) + 'px';
      rightPane.style.height = (avail * (1 - ratio)) + 'px';
    } else {
      leftPane.style.height = '';
      rightPane.style.height = '';
      let dw = divider.offsetWidth;
      let avail = cr.width - dw;
      leftPane.style.width = (avail * ratio) + 'px';
      rightPane.style.width = (avail * (1 - ratio)) + 'px';
    }
  };

  // Apply immediately on load so panes are never mis-sized after reload
  // Use rAF so the container has finished painting its own size first
  requestAnimationFrame(() => applyRatio(lastLeftRatio));

  divider.addEventListener('mouseenter', () => divider.classList.add('hover'));
  divider.addEventListener('mouseleave', () => { if (!isDragging) divider.classList.remove('hover'); });
  divider.addEventListener('mousedown', () => {
    isDragging = true;
    divider.classList.add('active');
    document.body.style.cursor = isPortrait() ? 'row-resize' : 'col-resize';
  });
  divider.addEventListener('dblclick', () => {
    lastLeftRatio = 0.5;
    applyRatio(lastLeftRatio);
    savePaneRatio(lastLeftRatio);
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    e.preventDefault();
    let cr = container.getBoundingClientRect();
    let dw = divider.offsetWidth;
    let dh = divider.offsetHeight;
    let minSize = 100;

    if (isPortrait()) {
      let offsetY = e.clientY - cr.top;
      let maxH = cr.height - minSize - dh;
      let topH = Math.max(minSize, Math.min(offsetY, maxH));
      leftPane.style.height = topH + 'px';
      rightPane.style.height = (cr.height - topH - dh) + 'px';
      lastLeftRatio = topH / (cr.height - dh);
    } else {
      let offsetX = e.clientX - cr.left;
      let maxW = cr.width - minSize - dw;
      let leftW = Math.max(minSize, Math.min(offsetX, maxW));
      leftPane.style.width = leftW + 'px';
      rightPane.style.width = (cr.width - leftW - dw) + 'px';
      lastLeftRatio = leftW / (cr.width - dw);
    }
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      divider.classList.remove('active', 'hover');
      document.body.style.cursor = 'default';
      savePaneRatio(lastLeftRatio);
    }
  });

  document.addEventListener('mouseleave', () => {
    if (isDragging) {
      isDragging = false;
      divider.classList.remove('active', 'hover');
      document.body.style.cursor = 'default';
      savePaneRatio(lastLeftRatio);
    }
  });

  window.addEventListener('resize', () => {
    applyRatio(lastLeftRatio);
  });
};

export let initSwapButton = () => {
  let swapButton = document.getElementById('swap-button');
  if (!swapButton) return;

  // Initialize from storage
  let swapped = loadSwappedState();
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
  });
};
