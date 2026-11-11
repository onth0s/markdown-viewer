import test from 'node:test';
import assert from 'node:assert/strict';
import { wrapWithSourcePos } from '../../js/preview/markdown-renderer.js';

test('wrapWithSourcePos: injects data-source-pos into standard opening tag without string duplication', () => {
  const token = { start: 10, end: 25 };
  const html = '<h1 class="header">Hello World</h1>\n';
  const result = wrapWithSourcePos(html, token);

  assert.strictEqual(result, '<h1 data-source-pos="10-25" class="header">Hello World</h1>\n');
});

test('wrapWithSourcePos: preserves leading whitespace and does not duplicate content on multi-tag HTML', () => {
  const token = { start: 0, end: 50 };
  const html = '  <div><p>First paragraph</p><p>Second paragraph</p></div>';
  const result = wrapWithSourcePos(html, token);

  assert.strictEqual(result, '  <div data-source-pos="0-50"><p>First paragraph</p><p>Second paragraph</p></div>');
});

test('wrapWithSourcePos: wraps raw text in fallback span with data-source-pos', () => {
  const token = { start: 5, end: 15 };
  const html = 'Just some raw text without html tags';
  const result = wrapWithSourcePos(html, token);

  assert.strictEqual(result, '<span data-source-pos="5-15">Just some raw text without html tags</span>');
});

test('wrapWithSourcePos: returns unaltered if token position or html is invalid', () => {
  assert.strictEqual(wrapWithSourcePos('   ', { start: 0, end: 10 }), '   ');
  assert.strictEqual(wrapWithSourcePos('<p>test</p>', null), '<p>test</p>');
  assert.strictEqual(wrapWithSourcePos('<p>test</p>', { start: null }), '<p>test</p>');
});
