const marked = require('marked');

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
      } else if (tok.tokens && tok.tokens.length > 0) {
        let childOff = 0;
        let fc = tok.tokens[0].raw;
        if (fc) { let idx = tok.raw.indexOf(fc); if (idx >= 0) childOff = idx; }
        walkInlineTokens(tok.tokens, 0, Math.max(0, localStart - tokStart - childOff), Math.min(rawLen - childOff, localEnd - tokStart - childOff));
      } else {
        tok._sel = true;
      }
    }
    offsetNow = tokEnd;
  }
};

let markPartialCurrent = (token, localStart, localEnd) => {
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
        markPartialCurrent(item, Math.max(0, localStart - its), Math.min(rl, localEnd - its));
      }
      o = ite;
    }
  } else if (token.type === 'listitem' && token.tokens) { // BUG: should be list_item
    let o = 0;
    for (let child of token.tokens) {
      let rl = child.raw ? child.raw.length : 0;
      let cs = o, ce = o + rl;
      if (cs < localEnd && ce > localStart) {
        markPartialCurrent(child, Math.max(0, localStart - cs), Math.min(rl, localEnd - cs));
      }
      o = ce;
    }
  } else if (token.tokens && token.tokens.length > 0 && !inlineTokenTypes.has(token.tokens[0].type)) {
    let o = 0;
    for (let child of token.tokens) {
      let rl = child.raw ? child.raw.length : 0;
      let cs = o, ce = o + rl;
      if (cs < localEnd && ce > localStart) {
        markPartialCurrent(child, Math.max(0, localStart - cs), Math.min(rl, localEnd - cs));
      }
      o = ce;
    }
  } else if (token.type === 'code') {
    token._sel = { firstLine: 0, lastLine: 0 };
  } else {
    token._sel = true;
    console.log('  [WARN] fell to _sel=true for type:', token.type);
  }
};

// ===== LIST TESTS =====
console.log('\n========== LIST TESTS ==========');

function resetTokens(tokens) {
  if (!tokens) return;
  for (let t of tokens) {
    delete t._sel;
    resetTokens(t.tokens);
    if (t.items) resetTokens(t.items);
  }
}

function findAllLeaves(token, out) {
  if (!out) out = [];
  if (token._sel !== undefined) out.push({ type: token.type, raw: token.raw, _sel: token._sel });
  if (token.tokens) token.tokens.forEach(t => findAllLeaves(t, out));
  if (token.items) token.items.forEach(t => findAllLeaves(t, out));
  return out;
}

const listMd = '- item one\n- item two\n- item three\n';
// offset:       0          11          22           35
// 'item one' = [2..10], 'item two' = [13..21], 'item three' = [24..34]

const listTests = [
  { start: 2, end: 10, desc: 'select "item one" (full first item content)' },
  { start: 4, end: 8, desc: 'select "em o" in "item one" (partial first item)' },
  { start: 13, end: 21, desc: 'select "item two" (full second item content)' },
  { start: 2, end: 21, desc: 'select across items one and two' },
];

for (let test of listTests) {
  let tokens = marked.lexer(listMd);
  let list = tokens[0];
  console.log('\nTest:', test.desc);
  console.log('Selecting:', JSON.stringify(listMd.substring(test.start, test.end)));
  markPartialCurrent(list, test.start, test.end);
  let leaves = findAllLeaves(list);
  console.log('Marked leaves:', JSON.stringify(leaves));
}

// ===== TABLE TESTS =====
console.log('\n========== TABLE TESTS ==========');

const tableMd = '| A | B |\n|---|---|\n| 1 | 2 |\n| 3 | 4 |\n';
// Line 0: '| A | B |' = 9 chars + \n = offset [0..10)
// Line 1: '|---|---|' = 8 chars + \n = offset [10..19) (separator)
// Line 2: '| 1 | 2 |' = 9 chars + \n = offset [19..29)
// Line 3: '| 3 | 4 |' = 9 chars + \n = offset [29..39)
// A is at offset 2..3, B at 6..7
// 1 is at offset 21..22, 2 at 25..26
// 3 is at offset 31..32, 4 at 35..36

const tableTests = [
  { start: 2, end: 3, desc: 'select "A" header cell' },
  { start: 21, end: 22, desc: 'select "1" data cell' },
  { start: 19, end: 29, desc: 'select entire row "| 1 | 2 |"' },
];

for (let test of tableTests) {
  let tokens = marked.lexer(tableMd);
  let table = tokens[0];
  console.log('\nTest:', test.desc);
  console.log('Selecting:', JSON.stringify(tableMd.substring(test.start, test.end)));
  markPartialCurrent(table, test.start, test.end);
  console.log('table._sel:', table._sel); // Should NOT be true
  // Check header/row cell tokens
  for (let cell of table.header) {
    let leaves = findAllLeaves(cell);
    if (leaves.length) console.log('Header cell marked:', JSON.stringify(leaves));
  }
  for (let row of table.rows) {
    for (let cell of row) {
      let leaves = findAllLeaves(cell);
      if (leaves.length) console.log('Data cell marked:', JSON.stringify(leaves));
    }
  }
}
