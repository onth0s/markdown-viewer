const marked = require('marked');

// Exact copy of functions from markdown-renderer.js (production)
let escapeHtml = (v) => v.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
let inlineTokenTypes = new Set(['text','strong','em','del','codespan','br','link','image','checkbox']);
let hasInlineChildren = (t) => t.tokens && t.tokens.length > 0 && inlineTokenTypes.has(t.tokens[0].type);

let contentOffsetInRaw = (token) => {
  if (!token.tokens || !token.tokens.length) return 0;
  let sumRaws = token.tokens.reduce((s, t) => s + (t.raw ? t.raw.length : 0), 0);
  let off = token.raw.length - 1 - sumRaws;
  return off < 0 ? 0 : off;
};

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
      } else if (tok.tokens && tok.tokens.length > 0) {
        let childOff = 0;
        let fc = tok.tokens[0].raw;
        if (fc) { let idx = tok.raw.indexOf(fc); if (idx >= 0) childOff = idx; }
        let childStart = Math.max(0, localStart - tokStart - childOff);
        let childEnd = Math.min(rawLen - childOff, localEnd - tokStart - childOff);
        walkInlineTokens(tok.tokens, 0, childStart, childEnd);
      } else {
        tok._sel = true;
      }
    }
    offsetNow = tokEnd;
  }
};

let isBlockContainer = (token) => {
  return token.type === 'paragraph' ||
         token.type === 'heading' ||
         token.type === 'list' ||
         token.type === 'list_item' ||
         token.type === 'table' ||
         token.type === 'blockquote' ||
         token.type === 'space';
};

let markPartial = (token, localStart, localEnd) => {
  if (hasInlineChildren(token)) {
    let co = contentOffsetInRaw(token);
    let sumRaws = token.tokens.reduce((s, t) => s + (t.raw ? t.raw.length : 0), 0);
    walkInlineTokens(token.tokens, 0, Math.max(0, localStart - co), Math.min(sumRaws, localEnd - co));
  } else if (token.type === 'list' && token.items) {
    let o = 0;
    for (let item of token.items) {
      let rl = item.raw ? item.raw.length : 0;
      let its = o, ite = o + rl;
      if (its < localEnd && ite > localStart) {
        markPartial(item, Math.max(0, localStart - its), Math.min(rl, localEnd - its));
      }
      o = ite;
    }
  } else if (token.type === 'list_item' && token.tokens) {
    let sumChildRaws = token.tokens.reduce((s, t) => s + (t.raw ? t.raw.length : 0), 0);
    let trailingNl = token.raw.endsWith('\n') ? 1 : 0;
    let prefixLen = Math.max(0, token.raw.length - sumChildRaws - trailingNl);
    let o = prefixLen;
    for (let child of token.tokens) {
      let rl = child.raw ? child.raw.length : 0;
      let cs = o, ce = o + rl;
      if (cs < localEnd && ce > localStart) {
        markPartial(child, Math.max(0, localStart - cs), Math.min(rl, localEnd - cs));
      }
      o = ce;
    }
  } else if (token.tokens && token.tokens.length > 0 && !inlineTokenTypes.has(token.tokens[0].type)) {
    let o = 0;
    for (let child of token.tokens) {
      let rl = child.raw ? child.raw.length : 0;
      let cs = o, ce = o + rl;
      if (cs < localEnd && ce > localStart) {
        markPartial(child, Math.max(0, localStart - cs), Math.min(rl, localEnd - cs));
      }
      o = ce;
    }
  } else if (token.type === 'code') {
    let contentOff = token.raw.indexOf(token.text || '');
    if (contentOff < 0) contentOff = 0;
    let textLen = (token.text || '').length;
    let codeStart = Math.max(0, Math.min(textLen, localStart - contentOff));
    let codeEnd = Math.max(0, Math.min(textLen, localEnd - contentOff));
    if (codeStart >= codeEnd) return;
    let text = token.text || '';
    let lines = text.split('\n');
    let lineOff = 0;
    let firstLine = -1, lastLine = -1;
    for (let i = 0; i < lines.length; i++) {
      let lineEnd = lineOff + lines[i].length + (i < lines.length - 1 ? 1 : 0);
      if (lineOff < codeEnd && lineEnd > codeStart) {
        if (firstLine < 0) firstLine = i;
        lastLine = i;
      }
      lineOff = lineEnd;
    }
    if (firstLine >= 0) token._sel = { firstLine, lastLine };
  } else {
    token._sel = true;
  }
};

// ============================================================================
// DIAGNOSTIC: Dump token tree with _sel values after marking
// ============================================================================
function dumpTokens(tokens, indent) {
  indent = indent || '';
  for (let tok of tokens) {
    let sel = tok._sel ? JSON.stringify(tok._sel) : 'none';
    let rawSnip = (tok.raw || '').substring(0, 40).replace(/\n/g, '\\n');
    console.log(`${indent}[${tok.type}] raw="${rawSnip}" _sel=${sel}`);
    if (tok.tokens) dumpTokens(tok.tokens, indent + '  ');
    if (tok.items) dumpTokens(tok.items, indent + '  ');
  }
}

// ============================================================================
// FULL RENDER (same as production renderWithSelection)
// ============================================================================
let baseRenderer = new marked.Renderer();
let proto = Object.getPrototypeOf(baseRenderer);

let renderWithSelection = (md, selStart, selEnd) => {
  let cleanMd = '';
  for (let i = 0; i < md.length; i++) {
    if (md[i] !== '\r') cleanMd += md[i];
  }
  let translateOffset = (o) => {
    if (o == null) return o;
    let c = 0;
    for (let i = 0; i < o; i++) { if (md[i] !== '\r') c++; }
    return c;
  };
  let cleanStart = translateOffset(selStart);
  let cleanEnd = translateOffset(selEnd);

  let tokens = marked.lexer(cleanMd);
  if (cleanStart == null || cleanEnd == null || cleanStart === cleanEnd) {
    return marked.parser(tokens, { renderer: baseRenderer });
  }

  let offset = 0;
  for (let token of tokens) {
    let rawLen = token.raw ? token.raw.length : 0;
    let tokenStart = offset;
    let tokenEnd = offset + rawLen;
    if (tokenStart < cleanEnd && tokenEnd > cleanStart) {
      let contentEnd = tokenEnd;
      if (rawLen > 0 && token.raw[rawLen - 1] === '\n') contentEnd--;

      let localStart = Math.max(0, cleanStart - tokenStart);
      let localEnd = Math.min(rawLen, cleanEnd - tokenStart);

      if (isBlockContainer(token)) {
        markPartial(token, localStart, localEnd);
      } else {
        if (tokenStart >= cleanStart && contentEnd <= cleanEnd) {
          token._sel = true;
          markPartial(token, localStart, localEnd);
        } else {
          markPartial(token, localStart, localEnd);
        }
      }
    }
    offset = tokenEnd;
  }

  // Dump the marked token tree
  console.log('  --- Token tree after marking ---');
  dumpTokens(tokens, '  ');
  console.log('  --- End token tree ---');

  // Build selRenderer
  let selRenderer = Object.create(baseRenderer);

  let textWrapper = (fn) => function(token, ...args) {
    if (token && token._sel && typeof token._sel === 'object') {
      let raw = token.raw || token.text || '';
      let s = Math.max(0, Math.min(raw.length, token._sel.splitStart));
      let e = Math.max(s, Math.min(raw.length, token._sel.splitEnd));
      return escapeHtml(raw.substring(0, s)) +
             '<span class="preview-selection">' + escapeHtml(raw.substring(s, e)) + '</span>' +
             escapeHtml(raw.substring(e));
    }
    let html = fn.call(this, token, ...args);
    if (token && token._sel) return '<span class="preview-selection">' + html + '</span>';
    return html;
  };

  let inlineWrapper = (fn) => function(token, ...args) {
    let html = fn.call(this, token, ...args);
    if (token && token._sel) return '<span class="preview-selection">' + html + '</span>';
    return html;
  };

  let wrapMethod = (key, factory) => {
    let originalFn = baseRenderer[key] || proto[key];
    if (typeof originalFn === 'function') {
      selRenderer[key] = factory(originalFn);
    }
  };

  wrapMethod('text', textWrapper);
  wrapMethod('strong', inlineWrapper);
  wrapMethod('em', inlineWrapper);
  wrapMethod('del', inlineWrapper);
  wrapMethod('br', inlineWrapper);
  wrapMethod('link', inlineWrapper);
  wrapMethod('image', inlineWrapper);
  wrapMethod('checkbox', inlineWrapper);

  wrapMethod('codespan', (fn) => function(token, ...args) {
    if (token && token._sel && typeof token._sel === 'object') {
      let t = token.text || '';
      let s = Math.max(0, Math.min(t.length, token._sel.splitStart));
      let e = Math.max(s, Math.min(t.length, token._sel.splitEnd));
      if (s <= 0 && e >= t.length) return '<code class="preview-selection">' + escapeHtml(t) + '</code>';
      return '<code>' + escapeHtml(t.substring(0, s)) +
             '<span class="preview-selection">' + escapeHtml(t.substring(s, e)) + '</span>' +
             escapeHtml(t.substring(e)) + '</code>';
    }
    if (token && token._sel) return '<code class="preview-selection">' + escapeHtml(token.text || '') + '</code>';
    return fn.call(this, token, ...args);
  });

  wrapMethod('code', (fn) => function(token, ...args) {
    let html = fn.call(this, token, ...args);
    if (token && token._sel === true) {
      let trimmed = html.replace(/\n$/, '');
      let nl = html.endsWith('\n') ? '\n' : '';
      let withSel = trimmed.replace(/^(<\w+)([\s>])/, '$1 class="preview-selection"$2');
      if (withSel !== trimmed) return withSel + nl;
      return '<div class="preview-selection">' + trimmed + '</div>' + nl;
    }
    return html;
  });

  return marked.parser(tokens, { renderer: selRenderer });
};

// ============================================================================
// TESTS
// ============================================================================
let pass = 0, fail = 0;
function assertContains(desc, html, substr) {
  if (html.includes(substr)) {
    console.log('  PASS:', desc);
    pass++;
  } else {
    console.log('  FAIL:', desc);
    console.log('       Expected to contain:', JSON.stringify(substr));
    console.log('       Full HTML:', JSON.stringify(html));
    fail++;
  }
}
function assertNotContains(desc, html, substr) {
  if (!html.includes(substr)) {
    console.log('  PASS:', desc);
    pass++;
  } else {
    console.log('  FAIL:', desc);
    console.log('       Expected NOT to contain:', JSON.stringify(substr));
    console.log('       Full HTML:', JSON.stringify(html));
    fail++;
  }
}

// ============================================================================
// SCENARIO 1: Mixed paragraph "hello `code` world" - select all (Ctrl-A)
// ============================================================================
console.log('\n=== SCENARIO 1: Mixed paragraph, Ctrl-A ===');
{
  // "hello `code` world\n" = 20 chars
  const md = 'hello `code` world\n';
  console.log('  md =', JSON.stringify(md), 'length =', md.length);
  
  // First, let's inspect the token structure
  let tokens = marked.lexer(md);
  console.log('  --- Raw token dump ---');
  for (let tok of tokens) {
    console.log('  Token:', tok.type, 'raw =', JSON.stringify(tok.raw));
    if (tok.tokens) {
      for (let it of tok.tokens) {
        console.log('    Inline:', it.type, 'raw =', JSON.stringify(it.raw), 'text =', JSON.stringify(it.text));
      }
    }
  }
  
  let html = renderWithSelection(md, 0, md.length);
  console.log('  Output HTML:', html);
  assertContains('codespan should have preview-selection', html, 'preview-selection');
  assertContains('codespan text "code" should be highlighted', html, 'code');
  // The codespan should be rendered with selection class
  assertContains('"code" has selection class on <code>', html, '<code class="preview-selection">code</code>');
}

// ============================================================================
// SCENARIO 2: Mixed paragraph - selection encompasses backticks exactly
// ============================================================================
console.log('\n=== SCENARIO 2: Selection encompasses backtick-quoted portion ===');
{
  // "hello `code` world\n"
  //  01234567890123456789
  //        ^    ^
  // Selecting positions 6 to 12 = "`code`"
  const md = 'hello `code` world\n';
  let html = renderWithSelection(md, 6, 12);
  console.log('  Output HTML:', html);
  assertContains('codespan should be highlighted when sel covers backticks', html, '<code class="preview-selection">code</code>');
}

// ============================================================================
// SCENARIO 3: Selection starts before opening backtick, ends after closing
// ============================================================================
console.log('\n=== SCENARIO 3: Selection extends past both backticks ===');
{
  // "hello `code` world\n"
  //  01234567890123456789
  //      ^         ^
  // Selecting positions 4 to 14 = "o `code` wo"
  const md = 'hello `code` world\n';
  let html = renderWithSelection(md, 4, 14);
  console.log('  Output HTML:', html);
  assertContains('codespan should be highlighted', html, '<code class="preview-selection">code</code>');
  assertContains('text before should be partially highlighted', html, '<span class="preview-selection">');
}

// ============================================================================
// SCENARIO 4: Selection starts inside, goes past closing backtick
// ============================================================================
console.log('\n=== SCENARIO 4: Selection starts inside codespan, extends past closing backtick ===');
{
  // "hello `code` world\n"
  //  01234567890123456789
  //          ^      ^
  // Selecting positions 8 to 15 = "de` worl"
  const md = 'hello `code` world\n';
  let html = renderWithSelection(md, 8, 15);
  console.log('  Output HTML:', html);
  assertContains('codespan should show partial selection', html, '<span class="preview-selection">');
}

// ============================================================================
// SCENARIO 5: Only codespan paragraph, Ctrl-A
// ============================================================================
console.log('\n=== SCENARIO 5: Only codespan in paragraph, Ctrl-A ===');
{
  const md = '`convert()`\n';
  let html = renderWithSelection(md, 0, md.length);
  console.log('  Output HTML:', html);
  assertContains('codespan fully selected', html, '<code class="preview-selection">convert()</code>');
}

// ============================================================================
// SCENARIO 6: Paragraph with multiple codespans
// ============================================================================
console.log('\n=== SCENARIO 6: Multiple codespans in paragraph, Ctrl-A ===');
{
  const md = 'use `foo` and `bar` here\n';
  console.log('  md =', JSON.stringify(md), 'length =', md.length);
  let html = renderWithSelection(md, 0, md.length);
  console.log('  Output HTML:', html);
  assertContains('first codespan highlighted', html, 'foo');
  assertContains('second codespan highlighted', html, 'bar');
  // Both should have selection
  let fooIdx = html.indexOf('foo');
  let barIdx = html.indexOf('bar');
  let fooHasSel = html.substring(Math.max(0,fooIdx-40), fooIdx).includes('preview-selection');
  let barHasSel = html.substring(Math.max(0,barIdx-40), barIdx).includes('preview-selection');
  if (fooHasSel) { console.log('  PASS: foo has selection'); pass++; }
  else { console.log('  FAIL: foo missing selection'); console.log('    around foo:', html.substring(Math.max(0,fooIdx-40), fooIdx+20)); fail++; }
  if (barHasSel) { console.log('  PASS: bar has selection'); pass++; }
  else { console.log('  FAIL: bar missing selection'); console.log('    around bar:', html.substring(Math.max(0,barIdx-40), barIdx+20)); fail++; }
}

// ============================================================================
// SCENARIO 7: Selection within codespan only (should still work)
// ============================================================================
console.log('\n=== SCENARIO 7: Partial selection within codespan ===');
{
  // "hello `code` world\n"
  //  01234567890123456789
  //         ^^
  // Selecting positions 7 to 9 = "co" (inside backticks)
  const md = 'hello `code` world\n';
  let html = renderWithSelection(md, 7, 9);
  console.log('  Output HTML:', html);
  assertContains('partial codespan selection works', html, '<span class="preview-selection">co</span>');
}

console.log(`\n=== Results: ${pass} passed, ${fail} failed ===\n`);
if (fail > 0) process.exit(1);
