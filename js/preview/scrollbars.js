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
    let availH = trackH - 28;
    let thumbH = Math.max(20, (previewEl.clientHeight / previewEl.scrollHeight) * availH);
    let maxTop = availH - thumbH;
    previewThumb.style.height = thumbH + 'px';
    previewThumb.style.top = (14 + ratio * maxTop) + 'px';
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
    let maxTop = trackH - 28 - thumbH;
    let delta = e.clientY - dragStartY;
    let maxScroll = previewEl.scrollHeight - previewEl.clientHeight;
    previewEl.scrollTop = dragStartScroll + (delta / maxTop) * maxScroll;
  });

  document.addEventListener('mouseup', () => { isDragging = false; });

  previewTrack.addEventListener('click', (e) => {
    if (e.target === previewThumb || e.target.classList.contains('scrollbar-arrow')) return;
    let rect = previewTrack.getBoundingClientRect();
    let clickY = e.clientY - rect.top;
    let ratio = clickY / previewTrack.clientHeight;
    previewEl.scrollTop = ratio * (previewEl.scrollHeight - previewEl.clientHeight);
  });

  let scrollInterval = null;
  previewTrack.querySelectorAll('.scrollbar-arrow').forEach((arrow) => {
    let dir = arrow.dataset.dir === 'up' ? -1 : 1;
    let step = () => { previewEl.scrollTop += dir * 40; };
    arrow.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      step();
      scrollInterval = setInterval(step, 80);
    });
    arrow.addEventListener('mouseup', () => { clearInterval(scrollInterval); });
    arrow.addEventListener('mouseleave', () => { clearInterval(scrollInterval); });
  });

  previewEl.addEventListener('scroll', update);
  
  // Expose update function so it can be triggered programmatically when preview content changes
  return {
    update,
    setupOverlay: (previewOverlay) => {
      setupScrollOverlay(previewOverlay, previewEl);
    }
  };
};
