const marked = require('marked');

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
        tok._sel = fullyCovered ? true : { splitStart: Math.max(0, localStart - tokStart), splitEnd: Math.min(rawLen, localEnd - tokStart) };
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
    // Find content start offset (skip bullet/number prefix like "- " or "1. ")
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
  } else if (token.type === 'table') {
    // Tables have .header (array of cells) and .rows (array of arrays)
    // but NO .tokens — parse cell positions from the raw string
    let rawLines = token.raw.split('\n');
    let lineOffset = 0;
    let dataRowIdx = 0;
    for (let li = 0; li < rawLines.length; li++) {
      let line = rawLines[li];
      let lineLen = line.length + (li < rawLines.length - 1 ? 1 : 0);
      let lineStart = lineOffset;
      let lineEnd = lineOffset + lineLen;
      let isHeader = li === 0;
      let isSeparator = li === 1;
      if (!isSeparator && line.length > 0 && lineStart < localEnd && lineEnd > localStart) {
        let cells = isHeader ? token.header : (token.rows[dataRowIdx] || null);
        if (cells) {
          let pos = 0;
          for (let ci = 0; ci < cells.length; ci++) {
            let pipePos = line.indexOf('|', pos);
            if (pipePos < 0) break;
            let ccs = pipePos + 1;
            let nPipe = line.indexOf('|', ccs);
            if (nPipe < 0) nPipe = line.length;
            // Trim surrounding spaces
            let ts = ccs; while (ts < nPipe && line[ts] === ' ') ts++;
            let te = nPipe; while (te > ts && line[te - 1] === ' ') te--;
            pos = nPipe;
            let absCellStart = lineOffset + ts;
            let absCellEnd = lineOffset + te;
            if (absCellStart < localEnd && absCellEnd > localStart && cells[ci]) {
              let cell = cells[ci];
              if (cell.tokens && cell.tokens.length > 0) {
                let cellLen = te - ts;
                walkInlineTokens(
                  cell.tokens, 0,
                  Math.max(0, localStart - absCellStart),
                  Math.min(cellLen, localEnd - absCellStart)
                );
              }
            }
          }
        }
      }
      if (!isHeader && !isSeparator && line.length > 0) dataRowIdx++;
      lineOffset += lineLen;
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
    let lang = (token.lang || '').match(/^\S*/)?.[0].toLowerCase();
    if (lang === 'mermaid') { token._sel = true; return; }
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

let isBlockContainer = (token) => {
  return token.type === 'paragraph' ||
         token.type === 'heading' ||
         token.type === 'list' ||
         token.type === 'list_item' ||
         token.type === 'table' ||
         token.type === 'blockquote' ||
         token.type === 'code' ||
         token.type === 'space';
};

let baseRenderer = new marked.Renderer();

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

  // Build selRenderer - CRITICAL: use unbound prototype methods so 'this' stays as parser
  let selRenderer = Object.create(baseRenderer);

  // Wrap a renderer method without pre-binding 'fn' to the renderer
  let wrapMethod = (key, factory) => {
    let proto = Object.getPrototypeOf(baseRenderer);
    let originalFn = proto[key];
    if (typeof originalFn === 'function') {
      selRenderer[key] = factory(originalFn);
    }
  };

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
    if (token && token._sel && typeof token._sel === 'object' && token._sel.firstLine != null) {
      let cs = html.indexOf('<code');
      if (cs >= 0) {
        let ce = html.indexOf('>', cs) + 1;
        let cc = html.lastIndexOf('</code>');
        if (ce > 0 && cc > ce) {
          let before = html.substring(0, ce);
          let content = html.substring(ce, cc);
          let after = html.substring(cc);
          let lines = content.split('\n');
          let result = [];
          for (let i = 0; i < lines.length; i++) {
            result.push(i >= token._sel.firstLine && i <= token._sel.lastLine
              ? '<span class="preview-selection">' + lines[i] + '</span>'
              : lines[i]);
            if (i < lines.length - 1) result.push('\n');
          }
          return before + result.join('') + after;
        }
      }
    }
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

// =============================================================================
// TESTS
// =============================================================================
let pass = 0, fail = 0;
function assert(desc, value, expected) {
  if (value === expected) {
    console.log('  PASS:', desc);
    pass++;
  } else {
    console.log('  FAIL:', desc);
    console.log('       Expected:', JSON.stringify(expected));
    console.log('       Got:     ', JSON.stringify(value));
    fail++;
  }
}
function assertContains(desc, html, substr) {
  if (html.includes(substr)) {
    console.log('  PASS:', desc);
    pass++;
  } else {
    console.log('  FAIL:', desc);
    console.log('       Expected to contain:', JSON.stringify(substr));
    console.log('       HTML:', html.substring(0, 300));
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
    console.log('       HTML:', html.substring(0, 300));
    fail++;
  }
}

// --- LIST TESTS ---
console.log('\n=== LIST TESTS ===');
{
  const md = '- item one\n- item two\n- item three\n';
  // 'item one' = positions [2..10], 'item two' = [13..21], 'item three' = [24..34]

  let html = renderWithSelection(md, 2, 10);
  assertContains('Full "item one" selected', html, '<span class="preview-selection">item one</span>');
  assertNotContains('item two should not be wrapped in selection span', html, '<span class="preview-selection">item two</span>');

  html = renderWithSelection(md, 4, 8);
  assertContains('Partial "em o" in item one', html, '<span class="preview-selection">em o</span>');

  html = renderWithSelection(md, 13, 21);
  assertContains('Full "item two" selected', html, '<span class="preview-selection">item two</span>');
  assertNotContains('"item one" NOT in selection span in item two test', html, '<span class="preview-selection">item one</span>');
}

// --- TABLE TESTS ---
console.log('\n=== TABLE TESTS ===');
{
  const md = '| A | B |\n|---|---|\n| 1 | 2 |\n| 3 | 4 |\n';
  // Char map: '| A | B |\n|---|---|\n| 1 | 2 |\n| 3 | 4 |\n'
  // Line 0: pos 0..9  -> A at [2,3), B at [6,7)
  // Line 1: pos 10..18 (separator)
  // Line 2: pos 20..28 -> 1 at [22,23), 2 at [26,27)
  // Line 3: pos 30..38 -> 3 at [32,33), 4 at [36,37)

  let html = renderWithSelection(md, 2, 3);
  assertNotContains('"A" selection - entire table NOT selected', html, 'class="preview-selection"><table');
  assertContains('"A" header cell selected', html, '<span class="preview-selection">A</span>');
  assertNotContains('"B" NOT selected when selecting "A"', html, '<span class="preview-selection">B</span>');

  html = renderWithSelection(md, 22, 23);
  assertContains('"1" data cell selected', html, '<span class="preview-selection">1</span>');
  assertNotContains('"2" NOT selected when selecting "1"', html, '<span class="preview-selection">2</span>');

  html = renderWithSelection(md, 20, 29);
  assertContains('Row "| 1 | 2 |" - cell 1 selected', html, '<span class="preview-selection">1</span>');
  assertContains('Row "| 1 | 2 |" - cell 2 selected', html, '<span class="preview-selection">2</span>');
  assertNotContains('Row "| 1 | 2 |" - cell 3 NOT selected', html, '<span class="preview-selection">3</span>');
}

// --- EXISTING TESTS ---
console.log('\n=== PARAGRAPH TESTS ===');
{
  let html = renderWithSelection('convert()\n', 0, 9);
  assertContains('Full paragraph selected', html, 'preview-selection');
  html = renderWithSelection('convert()\n', 3, 6);
  assertContains('Partial paragraph selected', html, '<span class="preview-selection">ver</span>');
}

console.log('\n=== INLINE CODE TESTS ===');
{
  let html = renderWithSelection('`convert()`\n', 4, 7);
  assertContains('Partial inline code selected', html, '<span class="preview-selection">ver</span>');

  // Test selecting starting outside backtick and ending inside or past it
  let htmlOutsideLeft = renderWithSelection('`convert()`\n', 0, 7);
  assertContains('Selection starts outside and covers part of codespan', htmlOutsideLeft, '<span class="preview-selection">conver</span>');

  let htmlOutsideRight = renderWithSelection('`convert()`\n', 4, 12);
  assertContains('Selection covers part and goes past closing backtick', htmlOutsideRight, '<span class="preview-selection">vert()</span>');

  // Test full Ctrl-A selection on the text
  let htmlAll = renderWithSelection('`convert()`\n', 0, 12);
  assertContains('Full Ctrl-A selects the entire codespan', htmlAll, '<code class="preview-selection">convert()</code>');

  // USER SCENARIO: "test1 `test2 test3` test4"
  // Indices:
  // t e s t 1 _ ` t e s t 2 _  t  e  s  t  3  `  _  t  e  s  t  4
  // 0 1 2 3 4 5 6 7 8 9 0 1 2  3  4  5  6  7  8 19 20 21 22 23 24 25
  const userMd = 'test1 `test2 test3` test4';
  
  // 1. Selecting "test2" -> positions 7 to 12.
  let selTest2 = renderWithSelection(userMd, 7, 12);
  assertContains('Selecting test2 matches split selection', selTest2, '<code><span class="preview-selection">test2</span> test3</code>');

  // 2. Selecting "test1 through test2" -> positions 0 to 12.
  let sel1to2 = renderWithSelection(userMd, 0, 12);
  assertContains('Selecting test1 through test2 matches', sel1to2, '<span class="preview-selection">test1 </span><code><span class="preview-selection">test2</span> test3</code>');

  // 3. Selecting "test2 and test3" -> positions 7 to 18 (encompasses codespan contents exactly).
  let sel2to3 = renderWithSelection(userMd, 7, 18);
  assertContains('Selecting test2 and test3 highlights entire codespan', sel2to3, '<code class="preview-selection">test2 test3</code>');

  // 4. Ctrl-A -> selecting positions 0 to 25.
  let selCtrlA = renderWithSelection(userMd, 0, 25);
  assertContains('Ctrl-A highlights test1, codespan, and test4', selCtrlA, '<span class="preview-selection">test1 </span><code class="preview-selection">test2 test3</code><span class="preview-selection"> test4</span>');
}

console.log('\n=== BOLD TESTS ===');
{
  let html = renderWithSelection('**convert()**\n', 5, 8);
  assertContains('Partial bold selected', html, '<span class="preview-selection">ver</span>');
}

console.log(`\n=== Results: ${pass} passed, ${fail} failed ===`);
if (fail > 0) process.exit(1);


