
/**
 * Custom scrollbar overlay + caret indicator for the editor pane.
 */
export let updateCustomScrollbar = (editor, track, thumb) => {
  if (!editor || !track || !thumb) return;
  let max = editor.scrollHeight - editor.clientHeight;
  if (max <= 0) { thumb.style.height = '0px'; return; }
  let ratio = editor.scrollTop / max;
  let avail = track.clientHeight;
  let thumbH = Math.max(20, (editor.clientHeight / editor.scrollHeight) * avail);
  let maxTop = avail - thumbH;
  thumb.style.height = thumbH + 'px';
  thumb.style.top = (0 + ratio * maxTop) + 'px';
};

export let updateCaretIndicator = (editor, track, caretIndicator) => {
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
  let trackHeight = editor.clientHeight;

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

export let initCustomScrollbar = (editor, track, thumb) => {
  if (!editor || !track || !thumb) return;

  let isDragging = false;
  let dragStartY = 0;
  let dragStartScroll = 0;

  let update = () => {
    let max = editor.scrollHeight - editor.clientHeight;
    if (max <= 0) { thumb.style.height = '0px'; return; }
    let ratio = editor.scrollTop / max;
    let avail = track.clientHeight;
    let thumbH = Math.max(20, (editor.clientHeight / editor.scrollHeight) * avail);
    let maxTop = avail - thumbH;
    thumb.style.height = thumbH + 'px';
    thumb.style.top = (0 + ratio * maxTop) + 'px';
  };

  thumb.addEventListener('mousedown', (e) => {
    isDragging = true;
    dragStartY = e.clientY;
    dragStartScroll = editor.scrollTop;
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    let avail = track.clientHeight;
    let thumbH = thumb.clientHeight;
    let maxTop = avail - thumbH;
    let delta = e.clientY - dragStartY;
    let maxScroll = editor.scrollHeight - editor.clientHeight;
    editor.scrollTop = dragStartScroll + (delta / maxTop) * maxScroll;
  });

  document.addEventListener('mouseup', () => { isDragging = false; });

  track.addEventListener('click', (e) => {
    if (e.target === thumb) return;
    let rect = track.getBoundingClientRect();
    let clickY = e.clientY - rect.top;
    let ratio = clickY / track.clientHeight;
    editor.scrollTop = ratio * (editor.scrollHeight - editor.clientHeight);
  });

  editor.addEventListener('scroll', update);

  return { update };
};
