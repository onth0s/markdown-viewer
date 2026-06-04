const marked = require('marked');
const renderer = new marked.Renderer();
const selRenderer = Object.create(renderer);
let escapeHtml = (v) => v.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/'/g,'&#39;').replace(/\"/g,'&quot;');

selRenderer.codespan = function (token, ...args) {
  if (token && token._sel && typeof token._sel === 'object') {
    let t = token.text || '';
    let s = Math.max(0, Math.min(t.length, token._sel.splitStart));
    let e = Math.max(s, Math.min(t.length, token._sel.splitEnd));
    if (s <= 0 && e >= t.length) {
      return '<code class="preview-selection">' + escapeHtml(t) + '</code>';
    }
    return '<code>' +
      escapeHtml(t.substring(0, s)) +
      '<span class="preview-selection">' + escapeHtml(t.substring(s, e)) + '</span>' +
      escapeHtml(t.substring(e)) + '</code>';
  }
  if (token && token._sel) {
    return '<code class="preview-selection">' + escapeHtml(token.text || '') + '</code>';
  }
  return renderer.codespan.call(this, token, ...args);
};

selRenderer.text = function (token, ...args) {
  if (token && token._sel && typeof token._sel === 'object') {
    let raw = token.raw || token.text || '';
    let s = Math.max(0, Math.min(raw.length, token._sel.splitStart));
    let e = Math.max(s, Math.min(raw.length, token._sel.splitEnd));
    return escapeHtml(raw.substring(0, s)) +
           '<span class="preview-selection">' + escapeHtml(raw.substring(s, e)) + '</span>' +
           escapeHtml(raw.substring(e));
  }
  let html = renderer.text.call(this, token, ...args);
  if (token && token._sel) {
    return '<span class="preview-selection">' + html + '</span>';
  }
  return html;
};

const md = 'test1 ' + String.fromCharCode(96) + 'test2 test3' + String.fromCharCode(96) + ' test4';
const tokens = marked.lexer(md);
const p = tokens[0];

// walkInlineTokens simulation
let walkInlineTokens = (tokens, offsetNow, localStart, localEnd) => {
  for (let tok of tokens) {
    let rawLen = tok.raw ? tok.raw.length : 0;
    let tokStart = offsetNow;
    let tokEnd = offsetNow + rawLen;
    if (tokStart < localEnd && tokEnd > localStart) {
      let fullyCovered = tokStart >= localStart && tokEnd <= localEnd;
      if (tok.type === 'text' && (!tok.tokens || !tok.tokens.length)) {
        if (fullyCovered) {
          tok._sel = true;
        } else {
          tok._sel = { splitStart: Math.max(0, localStart - tokStart), splitEnd: Math.min(rawLen, localEnd - tokStart) };
        }
      } else if (tok.type === 'codespan') {
        let contentOff = tok.raw.indexOf(tok.text || '');
        if (contentOff < 0) contentOff = 0;
        let textLen = (tok.text || '').length;
        let s = Math.max(0, Math.min(textLen, (localStart - tokStart) - contentOff));
        let e = Math.max(s, Math.min(textLen, (localEnd - tokStart) - contentOff));
        if (s <= 0 && e >= textLen) {
          tok._sel = true;
        } else if (e > s) {
          tok._sel = { splitStart: s, splitEnd: e };
        }
      }
    }
    offsetNow = tokEnd;
  }
};

console.log('--- TEST 1: Select test2 [7, 12) ---');
p.tokens.forEach(t => delete t._sel);
walkInlineTokens(p.tokens, 0, 7, 12);
console.log('p.tokens structure:', p.tokens.map(t => ({ type: t.type, raw: t.raw, _sel: t._sel })));
console.log('HTML:', marked.parser(tokens, { renderer: selRenderer }));

console.log('\n--- TEST 2: Select test1 through test2 [0, 12) ---');
p.tokens.forEach(t => delete t._sel);
walkInlineTokens(p.tokens, 0, 0, 12);
console.log('p.tokens structure:', p.tokens.map(t => ({ type: t.type, raw: t.raw, _sel: t._sel })));
console.log('HTML:', marked.parser(tokens, { renderer: selRenderer }));

console.log('\n--- TEST 3: Select test2 and test3 [7, 18) ---');
p.tokens.forEach(t => delete t._sel);
walkInlineTokens(p.tokens, 0, 7, 18);
console.log('p.tokens structure:', p.tokens.map(t => ({ type: t.type, raw: t.raw, _sel: t._sel })));
console.log('HTML:', marked.parser(tokens, { renderer: selRenderer }));

console.log('\n--- TEST 4: Ctrl-A [0, 25) ---');
p.tokens.forEach(t => delete t._sel);
walkInlineTokens(p.tokens, 0, 0, 25);
console.log('p.tokens structure:', p.tokens.map(t => ({ type: t.type, raw: t.raw, _sel: t._sel })));
console.log('HTML:', marked.parser(tokens, { renderer: selRenderer }));
