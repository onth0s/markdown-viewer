import { setupScrollOverlay } from '../common/scroll-utils.js';

export let initPreviewCustomScrollbar = (previewEl, previewTrack, previewThumb) => {
  if (!previewEl || !previewTrack || !previewThumb) return;

  let isDragging = false;
  let dragStartY = 0;
  let dragStartScroll = 0;

  let update = () => {
    let max = previewEl.scrollHeight - previewEl.clientHeight;
    if (max <= 0) { previewThumb.style.height = '0px'; return; }
    let ratio = previewEl.scrollTop / max;
    let trackH = previewTrack.clientHeight;
    let thumbH = Math.max(20, (previewEl.clientHeight / previewEl.scrollHeight) * trackH);
    let maxTop = trackH - thumbH;
    previewThumb.style.height = thumbH + 'px';
    previewThumb.style.top = (0 + ratio * maxTop) + 'px';
  };

  previewThumb.addEventListener('mousedown', (e) => {
    isDragging = true;
    dragStartY = e.clientY;
    dragStartScroll = previewEl.scrollTop;
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    let trackH = previewTrack.clientHeight;
    let thumbH = previewThumb.clientHeight;
    let maxTop = trackH - thumbH;
    let delta = e.clientY - dragStartY;
    let maxScroll = previewEl.scrollHeight - previewEl.clientHeight;
    previewEl.scrollTop = dragStartScroll + (delta / maxTop) * maxScroll;
  });

  document.addEventListener('mouseup', () => { isDragging = false; });

  previewTrack.addEventListener('click', (e) => {
    if (e.target === previewThumb) return;
    let rect = previewTrack.getBoundingClientRect();
    let clickY = e.clientY - rect.top;
    let ratio = clickY / previewTrack.clientHeight;
    previewEl.scrollTop = ratio * (previewEl.scrollHeight - previewEl.clientHeight);
  });

  previewEl.addEventListener('scroll', update);

  return {
    update,
    setupOverlay: (previewOverlay) => {
      setupScrollOverlay(previewOverlay, previewEl);
    }
  };
};
