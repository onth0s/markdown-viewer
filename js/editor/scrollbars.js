
/**
 * Native scrollbar (CSS) - no custom DOM/JS.
 * This module is kept for backward compat: the imported function is a no-op.
 * Native themed scrollbars are styled in css/scrollbars.css.
 */
export let updateCustomScrollbar = () => {};

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

export let initCustomScrollbar = () => {};
