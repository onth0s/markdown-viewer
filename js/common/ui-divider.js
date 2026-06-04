import { loadSwappedState, saveSwappedState } from './storage.js';

export let setupDivider = () => {
  let lastLeftRatio = 0.5;
  let divider = document.getElementById('split-divider');
  let leftPane = document.getElementById('edit');
  let rightPane = document.getElementById('preview');
  let container = document.getElementById('container');
  let isDragging = false;

  if (!divider || !leftPane || !rightPane || !container) return;

  divider.addEventListener('mouseenter', () => divider.classList.add('hover'));
  divider.addEventListener('mouseleave', () => { if (!isDragging) divider.classList.remove('hover'); });
  divider.addEventListener('mousedown', () => { isDragging = true; divider.classList.add('active'); document.body.style.cursor = 'col-resize'; });
  divider.addEventListener('dblclick', () => {
    let cr = container.getBoundingClientRect();
    let half = (cr.width - divider.offsetWidth) / 2;
    leftPane.style.width = half + 'px';
    rightPane.style.width = half + 'px';
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
    }
  });
  document.addEventListener('mouseleave', () => {
    if (isDragging) {
      isDragging = false;
      divider.classList.remove('active', 'hover');
      document.body.style.cursor = 'default';
    }
  });
  window.addEventListener('resize', () => {
    let cr = container.getBoundingClientRect();
    let dw = divider.offsetWidth;
    let avail = cr.width - dw;
    leftPane.style.width = (avail * lastLeftRatio) + 'px';
    rightPane.style.width = (avail * (1 - lastLeftRatio)) + 'px';
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
