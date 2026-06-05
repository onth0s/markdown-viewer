import { translateOffset } from './source-mapper.js';
import { clearHighlights, applyHighlight } from './dom-highlighter.js';

export class SelectionEngine {
  /**
   * @param {HTMLElement} previewContainer - The DOM container of the preview panel
   */
  constructor(previewContainer) {
    this.container = previewContainer;
    this.markdown = '';
    this.selStart = 0;
    this.selEnd = 0;
  }

  /**
   * Updates the active markdown text.
   * @param {string} markdown
   */
  setMarkdown(markdown) {
    this.rawMarkdown = markdown || '';
    this.markdown = this.rawMarkdown.replace(/\r/g, '');
  }

  /**
   * Handles selection change events. Translates offsets and updates visual highlights.
   *
   * @param {number} start - Raw start character offset from editor
   * @param {number} end - Raw end character offset from editor
   */
  updateSelection(start, end) {
    if (start === this.selStart && end === this.selEnd) {
      return;
    }

    // Translate absolute offsets to clean line offsets
    let cleanStart = translateOffset(this.rawMarkdown, start);
    let cleanEnd = translateOffset(this.rawMarkdown, end);

    this.selStart = start;
    this.selEnd = end;

    // Clear old visual highlights
    clearHighlights(this.container);

    // Apply new highlights if it's a range selection
    if (cleanStart !== cleanEnd && cleanStart != null && cleanEnd != null) {
      applyHighlight(this.container, this.markdown, cleanStart, cleanEnd);
    }
  }

  /**
   * Clears any active visual selection highlighting.
   */
  clear() {
    clearHighlights(this.container);
    this.selStart = 0;
    this.selEnd = 0;
  }
}
