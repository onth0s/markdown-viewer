import { loadSwappedState, saveSwappedState, savePaneRatio, loadPaneRatio } from './storage.js';

export let setupDivider = () => {
  let divider = document.getElementById('split-divider');
  let leftPane = document.getElementById('edit');
  let rightPane = document.getElementById('preview');
  let container = document.getElementById('container');
  let isDragging = false;

  if (!divider || !leftPane || !rightPane || !container) return;

  // Restore persisted ratio or fall back to 50/50
  let lastLeftRatio = loadPaneRatio() ?? 0.5;

  let applyRatio = (ratio) => {
    let cr = container.getBoundingClientRect();
    let dw = divider.offsetWidth;
    let avail = cr.width - dw;
    leftPane.style.width = (avail * ratio) + 'px';
    rightPane.style.width = (avail * (1 - ratio)) + 'px';
  };

  // Apply immediately on load so panes are never mis-sized after reload
  // Use rAF so the container has finished painting its own width first
  requestAnimationFrame(() => applyRatio(lastLeftRatio));

  divider.addEventListener('mouseenter', () => divider.classList.add('hover'));
  divider.addEventListener('mouseleave', () => { if (!isDragging) divider.classList.remove('hover'); });
  divider.addEventListener('mousedown', () => {
    isDragging = true;
    divider.classList.add('active');
    document.body.style.cursor = 'col-resize';
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
    let offsetX = e.clientX - cr.left;
    let dw = divider.offsetWidth;
    let minW = 100;
    let maxW = cr.width - minW - dw;
    let leftW = Math.max(minW, Math.min(offsetX, maxW));
    leftPane.style.width = leftW + 'px';
    rightPane.style.width = (cr.width - leftW - dw) + 'px';
    lastLeftRatio = leftW / (cr.width - dw);
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
