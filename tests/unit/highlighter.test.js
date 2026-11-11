import test from 'node:test';
import assert from 'node:assert/strict';
import { highlightMd } from '../../js/editor/highlighter.js';

test('highlighter: correctly highlights bold and italics without delimiter collision', () => {
  const input = '**bold** and *italic* and _italic2_';
  const highlighted = highlightMd(input);

  assert.ok(highlighted.includes('<span class="hl-strong">**bold**</span>'), 'Bold should be wrapped in hl-strong');
  assert.ok(highlighted.includes('*<span class="hl-em">italic</span>*'), 'Asterisk italic should be wrapped in hl-em');
  assert.ok(highlighted.includes('_<span class="hl-em">italic2</span>_'), 'Underscore italic should be wrapped in hl-em');
});

test('highlighter: prevents italic regex from corrupting inline code blocks', () => {
  const input = '`some_code_with_underscores` and _italic_';
  const highlighted = highlightMd(input);

  assert.ok(highlighted.includes('<span class="hl-code">`some_code_with_underscores`</span>'), 'Code block should remain intact');
  assert.ok(highlighted.includes('_<span class="hl-em">italic</span>_'), 'Italic should be wrapped in hl-em');
  assert.ok(!highlighted.includes('%%MDCODE'), 'All code placeholders should be restored');
});

test('highlighter: prevents images from being incorrectly matched as links', () => {
  const input = '![alt text](https://example.com/img.png) and [link text](https://example.com)';
  const highlighted = highlightMd(input);

  assert.ok(highlighted.includes('<span class="hl-image">![<span class="hl-img-alt">alt text</span>](<span class="hl-img-url">https://example.com/img.png</span>)</span>'), 'Image syntax should be wrapped in hl-image');
  assert.ok(highlighted.includes('<span class="hl-link">[<span class="hl-link-text">link text</span>](<span class="hl-link-url">https://example.com</span>)</span>'), 'Link syntax should be wrapped in hl-link');
  assert.ok(!highlighted.includes('hl-link">![alt text'), 'Image should not be wrapped in hl-link');
});
