import { syncHighlight, setupHighlighter } from './highlighter.js';
import { initCustomScrollbar, updateCaretIndicator, updateCustomScrollbar, setupScrollOverlay } from './scrollbars.js';

export let initEditorController = ({
  editor,
  editorHighlight,
  customScrollbar,
  customScrollbarThumb,
  caretIndicator,
  scrollOverlay,
  onInput,
  onSelectionChange
}) => {
  if (!editor) return;

  setupHighlighter(editor, editorHighlight);
  initCustomScrollbar(editor, customScrollbar, customScrollbarThumb, caretIndicator);
  setupScrollOverlay(scrollOverlay, editor);

  let lastSelStart = -1;
  let lastSelEnd = -1;

  let handleSelectionUpdate = () => {
    let start = editor.selectionStart;
    let end = editor.selectionEnd;
    updateCaretIndicator(editor, customScrollbar, caretIndicator);
    if (lastSelStart === start && lastSelEnd === end) return;
    lastSelStart = start;
    lastSelEnd = end;
    if (onSelectionChange) {
      onSelectionChange(start, end);
    }
  };

  editor.addEventListener('input', () => {
    syncHighlight(editor, editorHighlight);
    updateCaretIndicator(editor, customScrollbar, caretIndicator);
    updateCustomScrollbar(editor, customScrollbar, customScrollbarThumb);
    if (onInput) {
      onInput(editor.value);
    }
  });

  editor.addEventListener('scroll', () => {
    if (editorHighlight) {
      editorHighlight.scrollTop = editor.scrollTop;
    }
  });

  editor.addEventListener('keyup', handleSelectionUpdate);
  editor.addEventListener('keydown', () => {
    queueMicrotask(handleSelectionUpdate);
  });
  editor.addEventListener('mousedown', () => setTimeout(handleSelectionUpdate, 0));
  editor.addEventListener('mouseup', () => setTimeout(handleSelectionUpdate, 0));

  let caretRafPending = false;
  editor.addEventListener('mousemove', (e) => {
    if (e.buttons && !caretRafPending) {
      caretRafPending = true;
      requestAnimationFrame(() => {
        caretRafPending = false;
        handleSelectionUpdate();
      });
    }
  });
  editor.addEventListener('select', handleSelectionUpdate);
  editor.addEventListener('blur', () => {
    if (onSelectionChange) {
      onSelectionChange(editor.selectionStart, editor.selectionStart);
    }
  });

  // Return helper methods
  return {
    presetValue: (value) => {
      editor.value = value;
      editor.scrollTop = 0;
      syncHighlight(editor, editorHighlight);
      editor.focus();
      if (onInput) onInput(value);
    },
    updateHighlight: () => {
      syncHighlight(editor, editorHighlight);
    }
  };
};
