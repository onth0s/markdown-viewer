
/**
 * Custom scrollbar overlay + caret indicator for the editor pane.
 */

/**
 * Applies thumb position/size to a scrollbar track based on the current scroll state.
 * @param {HTMLElement} editor - The scrollable element
 * @param {HTMLElement} track  - The scrollbar track
 * @param {HTMLElement} thumb  - The scrollbar thumb
 */
const applyScrollThumb = (editor, track, thumb) => {
  const max = editor.scrollHeight - editor.clientHeight;
  if (max <= 0) { thumb.style.height = '0px'; return; }
  const ratio = editor.scrollTop / max;
  const avail = track.clientHeight;
  const thumbH = Math.max(20, (editor.clientHeight / editor.scrollHeight) * avail);
  const maxTop = avail - thumbH;
  thumb.style.height = thumbH + 'px';
  thumb.style.top = (ratio * maxTop) + 'px';
};

export const updateCustomScrollbar = (editor, track, thumb) => {
  if (!editor || !track || !thumb) return;
  applyScrollThumb(editor, track, thumb);
};

export const updateCaretIndicator = (editor, track, caretIndicator) => {
  if (!caretIndicator || !editor) return;

  const hasFocus = document.activeElement === editor;
  if (!hasFocus) {
    caretIndicator.classList.remove('visible');
    return;
  }

  caretIndicator.classList.add('visible');
  const start = editor.selectionStart;
  const end = editor.selectionEnd;
  const text = editor.value;
  const len = text.length;
  const trackHeight = editor.clientHeight;

  const lineOf = (offset) => {
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

  const clamp = (val, max) => val < 0 ? 0 : val > max ? max : val;

  if (start !== end) {
    const startLine = lineOf(start);
    const endLine = lineOf(end);
    let topLine = totalLines <= 1 ? 0 : (startLine / (totalLines - 1)) * trackHeight;
    const bottomLine = totalLines <= 1 ? 0 : (endLine / (totalLines - 1)) * trackHeight;
    const selHeight = Math.max(2, bottomLine - topLine);
    topLine = clamp(topLine, trackHeight - selHeight);
    caretIndicator.style.top = topLine + 'px';
    caretIndicator.style.height = selHeight + 'px';
    caretIndicator.classList.add('selection-active');
  } else {
    const caretLine = lineOf(start);
    let top = totalLines <= 1 ? 0 : (caretLine / (totalLines - 1)) * trackHeight;
    top = clamp(top, trackHeight - 2);
    caretIndicator.style.top = top + 'px';
    caretIndicator.style.height = '2px';
    caretIndicator.classList.remove('selection-active');
  }
};

export const initCustomScrollbar = (editor, track, thumb) => {
  if (!editor || !track || !thumb) return;

  let isDragging = false;
  let dragStartY = 0;
  let dragStartScroll = 0;

  thumb.addEventListener('mousedown', (e) => {
    isDragging = true;
    dragStartY = e.clientY;
    dragStartScroll = editor.scrollTop;
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const avail = track.clientHeight;
    const thumbH = thumb.clientHeight;
    const maxTop = avail - thumbH;
    const delta = e.clientY - dragStartY;
    const maxScroll = editor.scrollHeight - editor.clientHeight;
    editor.scrollTop = dragStartScroll + (delta / maxTop) * maxScroll;
  });

  document.addEventListener('mouseup', () => { isDragging = false; });

  track.addEventListener('click', (e) => {
    if (e.target === thumb) return;
    const rect = track.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const ratio = clickY / track.clientHeight;
    editor.scrollTop = ratio * (editor.scrollHeight - editor.clientHeight);
  });

  editor.addEventListener('scroll', () => applyScrollThumb(editor, track, thumb));

  return { update: () => applyScrollThumb(editor, track, thumb) };
};
