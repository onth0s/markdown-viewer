export let initPreviewHorizontalScrollbar = (previewEl, hscrollbarEl, hThumbEl) => {
  if (!previewEl || !hscrollbarEl || !hThumbEl) return;

  let isDragging = false;
  let dragStartX = 0;
  let dragStartScroll = 0;

  let update = () => {
    let maxScroll = previewEl.scrollWidth - previewEl.clientWidth;
    if (maxScroll <= 0) {
      hscrollbarEl.style.display = 'none';
      return;
    }
    hscrollbarEl.style.display = 'flex';

    let ratio = previewEl.scrollLeft / maxScroll;
    let trackW = hscrollbarEl.clientWidth;
    let thumbW = Math.max(20, (previewEl.clientWidth / previewEl.scrollWidth) * trackW);
    let maxLeft = trackW - thumbW;

    hThumbEl.style.width = thumbW + 'px';
    hThumbEl.style.marginLeft = (ratio * maxLeft) + 'px';
  };

  hThumbEl.addEventListener('mousedown', (e) => {
    isDragging = true;
    dragStartX = e.clientX;
    dragStartScroll = previewEl.scrollLeft;
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    let trackW = hscrollbarEl.clientWidth;
    let thumbW = hThumbEl.clientWidth;
    let maxLeft = trackW - thumbW;
    let delta = e.clientX - dragStartX;
    let maxScroll = previewEl.scrollWidth - previewEl.clientWidth;
    previewEl.scrollLeft = dragStartScroll + (delta / maxLeft) * maxScroll;
  });

  document.addEventListener('mouseup', () => { isDragging = false; });

  hscrollbarEl.addEventListener('click', (e) => {
    if (e.target === hThumbEl) return;
    let rect = hscrollbarEl.getBoundingClientRect();
    let clickX = e.clientX - rect.left;
    let trackW = hscrollbarEl.clientWidth;
    let ratio = Math.max(0, Math.min(1, clickX / trackW));
    previewEl.scrollLeft = ratio * (previewEl.scrollWidth - previewEl.clientWidth);
  });

  previewEl.addEventListener('scroll', update);
  new ResizeObserver(update).observe(previewEl);

  return { update };
};
