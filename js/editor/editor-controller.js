import { syncHighlight, setupHighlighter } from './highlighter.js';
import { initCustomScrollbar, updateCaretIndicator, updateCustomScrollbar } from './scrollbars.js';
import { setupScrollOverlay } from '../common/scroll-utils.js';
import { wrapEmojis } from '../common/emoji-helper.js';

export const initEditorController = ({
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

  let lastSelStart = null;
  let lastSelEnd = null;

  const handleSelectionUpdate = () => {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    updateCaretIndicator(editor, customScrollbar, caretIndicator);
    if (lastSelStart === start && lastSelEnd === end) return;
    lastSelStart = start;
    lastSelEnd = end;
    if (onSelectionChange) {
      onSelectionChange(start, end);
    }
  };

  // Rate-limit the highlight repaint to once per animation frame.
  // The onInput callback (markdown re-render) runs synchronously for live-preview responsiveness.
  let highlightRafPending = false;

  editor.addEventListener('input', () => {
    if (!highlightRafPending) {
      highlightRafPending = true;
      requestAnimationFrame(() => {
        highlightRafPending = false;
        syncHighlight(editor, editorHighlight);
        wrapEmojis(editorHighlight);
      });
    }
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

  const editorWrapper = editor.parentElement;
  if (editorWrapper) {
    editorWrapper.addEventListener('wheel', (e) => {
      const orig = editor.scrollTop;
      editor.scrollTop += e.deltaY;
      if (editor.scrollTop !== orig) e.preventDefault();
    }, { passive: false });
  }

  editor.addEventListener('keyup', handleSelectionUpdate);
  editor.addEventListener('keydown', () => {
    queueMicrotask(handleSelectionUpdate);
  });
  editor.addEventListener('mousedown', () => setTimeout(handleSelectionUpdate, 0));
  editor.addEventListener('mouseup', () => setTimeout(handleSelectionUpdate, 0));
  editor.addEventListener('focus', () => {
    updateCaretIndicator(editor, customScrollbar, caretIndicator);
  });

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
    updateCaretIndicator(editor, customScrollbar, caretIndicator);
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
      wrapEmojis(editorHighlight);
      editor.focus();
      if (onInput) onInput(editor.value);
      updateCaretIndicator(editor, customScrollbar, caretIndicator);
      updateCustomScrollbar(editor, customScrollbar, customScrollbarThumb);
    },
    updateHighlight: () => {
      syncHighlight(editor, editorHighlight);
      wrapEmojis(editorHighlight);
    },
    updateScrollbars: () => {
      updateCaretIndicator(editor, customScrollbar, caretIndicator);
      updateCustomScrollbar(editor, customScrollbar, customScrollbarThumb);
    }
  };
};
