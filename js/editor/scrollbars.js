export { setupScrollOverlay } from '../common/scroll-utils.js';

export let updateCustomScrollbar = (editor, customScrollbar, customScrollbarThumb) => {
  if (!editor || !customScrollbarThumb || !customScrollbar) return;
  let scrollRatio = editor.scrollTop / (editor.scrollHeight - editor.clientHeight || 1);
  let thumbRatio = editor.clientHeight / editor.scrollHeight;
  let trackHeight = customScrollbar.clientHeight;
  let thumbHeight = Math.max(20, thumbRatio * trackHeight);
  let maxTop = trackHeight - thumbHeight;
  let top = scrollRatio * maxTop;
  customScrollbarThumb.style.height = thumbHeight + 'px';
  customScrollbarThumb.style.top = top + 'px';
};

export let updateCaretIndicator = (editor, customScrollbar, caretIndicator) => {
  if (!caretIndicator || !editor) return;

  let hasFocus = document.activeElement === editor;
  if (!hasFocus) {
    caretIndicator.classList.remove('visible');
    return;
  }

  caretIndicator.classList.add('visible');
  let start = editor.selectionStart;
  let end = editor.selectionEnd;
  let text = editor.value;
  let len = text.length;
  let trackHeight = customScrollbar ? customScrollbar.clientHeight : editor.clientHeight;

  let lineOf = (offset) => {
    let n = 0;
    for (let i = 0; i < offset && i < len; i++) {
      if (text.charCodeAt(i) === 10) n++;
    }
    return n;
  };

  let totalLines = 1;
  for (let i = 0; i < len; i++) {
    if (text.charCodeAt(i) === 10) totalLines++;
  }

  let clamp = (val, max) => val < 0 ? 0 : val > max ? max : val;

  if (start !== end) {
    let startLine = lineOf(start);
    let endLine = lineOf(end);
    let topLine = totalLines <= 1 ? 0 : (startLine / (totalLines - 1)) * trackHeight;
    let bottomLine = totalLines <= 1 ? 0 : (endLine / (totalLines - 1)) * trackHeight;
    let selHeight = Math.max(2, bottomLine - topLine);
    topLine = clamp(topLine, trackHeight - selHeight);
    caretIndicator.style.top = topLine + 'px';
    caretIndicator.style.height = selHeight + 'px';
    caretIndicator.classList.add('selection-active');
  } else {
    let caretLine = lineOf(start);
    let top = totalLines <= 1 ? 0 : (caretLine / (totalLines - 1)) * trackHeight;
    top = clamp(top, trackHeight - 2);
    caretIndicator.style.top = top + 'px';
    caretIndicator.style.height = '2px';
    caretIndicator.classList.remove('selection-active');
  }
};

export let initCustomScrollbar = (editor, customScrollbar, customScrollbarThumb, caretIndicator) => {
  if (!customScrollbar || !editor || !customScrollbarThumb) return;
  let isDragging = false;
  let dragStartY = 0;
  let dragStartScroll = 0;

  customScrollbarThumb.addEventListener('mousedown', (e) => {
    isDragging = true;
    dragStartY = e.clientY;
    dragStartScroll = editor.scrollTop;
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    let trackHeight = customScrollbar.clientHeight;
    let thumbHeight = customScrollbarThumb.clientHeight;
    let maxTop = trackHeight - thumbHeight;
    let deltaY = e.clientY - dragStartY;
    let maxScroll = editor.scrollHeight - editor.clientHeight;
    let scrollDelta = (deltaY / maxTop) * maxScroll;
    editor.scrollTop = dragStartScroll + scrollDelta;
  });

  document.addEventListener('mouseup', () => { isDragging = false; });

  customScrollbar.addEventListener('click', (e) => {
    if (e.target === customScrollbarThumb) return;
    let rect = customScrollbar.getBoundingClientRect();
    let clickY = e.clientY - rect.top;
    let trackHeight = customScrollbar.clientHeight;
    let ratio = clickY / trackHeight;
    editor.scrollTop = ratio * (editor.scrollHeight - editor.clientHeight);
  });

  editor.addEventListener('scroll', () => {
    updateCustomScrollbar(editor, customScrollbar, customScrollbarThumb);
    updateCaretIndicator(editor, customScrollbar, caretIndicator);
  });

  updateCustomScrollbar(editor, customScrollbar, customScrollbarThumb);
  updateCaretIndicator(editor, customScrollbar, caretIndicator);
};


