export const initPreviewHorizontalScrollbar = (previewEl, hscrollbarEl, hThumbEl) => {
  if (!previewEl || !hscrollbarEl || !hThumbEl) return;

  let isDragging = false;
  let dragStartX = 0;
  let dragStartScroll = 0;

  const update = () => {
    const maxScroll = previewEl.scrollWidth - previewEl.clientWidth;
    if (maxScroll <= 0) {
      hscrollbarEl.style.display = 'none';
      return;
    }
    hscrollbarEl.style.display = 'flex';

    const ratio = previewEl.scrollLeft / maxScroll;
    const trackW = hscrollbarEl.clientWidth;
    const thumbW = Math.max(20, (previewEl.clientWidth / previewEl.scrollWidth) * trackW);
    const maxLeft = trackW - thumbW;

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
    const trackW = hscrollbarEl.clientWidth;
    const thumbW = hThumbEl.clientWidth;
    const maxLeft = trackW - thumbW;
    const delta = e.clientX - dragStartX;
    const maxScroll = previewEl.scrollWidth - previewEl.clientWidth;
    previewEl.scrollLeft = dragStartScroll + (delta / maxLeft) * maxScroll;
  });

  document.addEventListener('mouseup', () => { isDragging = false; });

  hscrollbarEl.addEventListener('click', (e) => {
    if (e.target === hThumbEl) return;
    const rect = hscrollbarEl.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const trackW = hscrollbarEl.clientWidth;
    const ratio = Math.max(0, Math.min(1, clickX / trackW));
    previewEl.scrollLeft = ratio * (previewEl.scrollWidth - previewEl.clientWidth);
  });

  previewEl.addEventListener('scroll', update);
  new ResizeObserver(update).observe(previewEl);

  return { update };
};
