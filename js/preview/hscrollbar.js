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
    let arrowW = 14;
    let trackW = hscrollbarEl.clientWidth - arrowW * 2;
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
    let arrowW = 14;
    let trackW = hscrollbarEl.clientWidth - arrowW * 2;
    let thumbW = hThumbEl.clientWidth;
    let maxLeft = trackW - thumbW;
    let delta = e.clientX - dragStartX;
    let maxScroll = previewEl.scrollWidth - previewEl.clientWidth;
    previewEl.scrollLeft = dragStartScroll + (delta / maxLeft) * maxScroll;
  });

  document.addEventListener('mouseup', () => { isDragging = false; });

  hscrollbarEl.addEventListener('click', (e) => {
    if (e.target === hThumbEl || e.target.classList.contains('hscrollbar-arrow')) return;
    let rect = hscrollbarEl.getBoundingClientRect();
    let arrowW = 14;
    let clickX = e.clientX - rect.left - arrowW;
    let trackW = hscrollbarEl.clientWidth - arrowW * 2;
    let ratio = Math.max(0, Math.min(1, clickX / trackW));
    previewEl.scrollLeft = ratio * (previewEl.scrollWidth - previewEl.clientWidth);
  });

  let scrollInterval = null;
  hscrollbarEl.querySelectorAll('.hscrollbar-arrow').forEach((arrow) => {
    let dir = arrow.dataset.dir === 'left' ? -1 : 1;
    let step = () => { previewEl.scrollLeft += dir * 40; };
    arrow.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      step();
      scrollInterval = setInterval(step, 80);
    });
    arrow.addEventListener('mouseup', () => clearInterval(scrollInterval));
    arrow.addEventListener('mouseleave', () => clearInterval(scrollInterval));
  });

  previewEl.addEventListener('scroll', update);
  new ResizeObserver(update).observe(previewEl);

  return {
    update,
    setupOverlay: (hScrollOverlay) => {
      if (!hScrollOverlay) return;
      let PROXIMITY_THRESHOLD = 60;
      let show = () => hScrollOverlay.classList.add('visible');
      let hide = () => hScrollOverlay.classList.remove('visible');

      let wrapper = previewEl.parentElement;
      if (wrapper) {
        wrapper.addEventListener('mousemove', (e) => {
          let rect = wrapper.getBoundingClientRect();
          let mouseY = e.clientY - rect.top;
          let mouseX = e.clientX - rect.left;
          let width = rect.width;
          let height = rect.height;

          let nearBottom = mouseY >= height - PROXIMITY_THRESHOLD;
          let nearLeft = mouseX <= PROXIMITY_THRESHOLD;
          let nearRight = mouseX >= width - PROXIMITY_THRESHOLD;

          if (nearBottom && (nearLeft || nearRight)) {
            hScrollOverlay.classList.toggle('at-left', nearLeft);
            hScrollOverlay.classList.toggle('at-right', nearRight);
            show();
          } else {
            hide();
          }
        });
        wrapper.addEventListener('mouseleave', hide);
      }

      hScrollOverlay.addEventListener('mouseenter', show);
      hScrollOverlay.addEventListener('mouseleave', hide);

      let leftBtn = hScrollOverlay.querySelector('.scroll-popup-left');
      let rightBtn = hScrollOverlay.querySelector('.scroll-popup-right');
      if (leftBtn) leftBtn.addEventListener('click', () => { previewEl.scrollLeft = 0; });
      if (rightBtn) rightBtn.addEventListener('click', () => { previewEl.scrollLeft = previewEl.scrollWidth; });
    }
  };
};
