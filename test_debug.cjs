const marked = require('marked');

let inlineTokenTypes = new Set(['text','strong','em','del','codespan','br','link','image','checkbox']);
let hasInlineChildren = (t) => t.tokens && t.tokens.length > 0 && inlineTokenTypes.has(t.tokens[0].type);

let escapeHtml = (value) => {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
};

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
    console.log(`  walk: type=${tok.type} raw=${JSON.stringify(tok.raw)} rawLen=${rawLen} tokStart=${tokStart} tokEnd=${tokEnd} localStart=${localStart} localEnd=${localEnd}`);
    if (tokStart < localEnd && tokEnd > localStart) {
      let fullyCovered = tokStart >= localStart && tokEnd <= localEnd;
      if (tok.type === 'text' && (!tok.tokens || !tok.tokens.length)) {
        if (fullyCovered) tok._sel = true;
        else tok._sel = { splitStart: Math.max(0, localStart - tokStart), splitEnd: Math.min(rawLen, localEnd - tokStart) };
        console.log(`  → text _sel=${JSON.stringify(tok._sel)}`);
      } else if (tok.type === 'codespan') {
        let contentOff = tok.raw.indexOf(tok.text || '');
        if (contentOff < 0) contentOff = 0;
        let textLen = (tok.text || '').length;
        let contentStart = tokStart + contentOff;
        if (fullyCovered) tok._sel = true;
        else {
          let s = Math.max(0, Math.min(textLen, localStart - contentStart));
          let e = Math.max(0, Math.min(textLen, localEnd - contentStart));
          tok._sel = (e > s) ? { splitStart: s, splitEnd: e } : true;
        }
      } else {
        tok._sel = true;
        if (!fullyCovered && tok.tokens && tok.tokens.length) {
          let childOff = 0;
          let fc = tok.tokens[0].raw;
          if (fc) { let idx = tok.raw.indexOf(fc); if (idx >= 0) childOff = idx; }
          walkInlineTokens(tok.tokens, childOff, Math.max(0, localStart - tokStart), Math.min(rawLen, localEnd - tokStart));
        }
      }
    }
    offsetNow = tokEnd;
  }
};

function test(md, selStart, selEnd, desc) {
  console.log(`\n=== ${desc} ===`);
  console.log(`MD: ${JSON.stringify(md)}`);
  console.log(`Selection: ${JSON.stringify(md.substring(selStart, selEnd))} [${selStart}, ${selEnd})`);

  let tokens = marked.lexer(md);
  console.log(`Block tokens: ${tokens.length}`);
  
  let offset = 0;
  for (let token of tokens) {
    let rawLen = token.raw ? token.raw.length : 0;
    let tokenStart = offset;
    let tokenEnd = offset + rawLen;
    console.log(`Block token: type=${token.type} raw=${JSON.stringify(token.raw)} [${tokenStart}, ${tokenEnd})`);
    if (token.tokens) console.log(`  children: ${token.tokens.length}`);
    
    if (tokenStart < selEnd && tokenEnd > selStart) {
      let contentEnd = tokenEnd;
      if (rawLen > 0 && token.raw[rawLen - 1] === '\n') contentEnd--;
      if (tokenStart >= selStart && contentEnd <= selEnd) {
        console.log(`  → fully covered (contentEnd=${contentEnd})`);
        if (hasInlineChildren(token)) {
          markPartial(token, Math.max(0, selStart - tokenStart), Math.min(rawLen, selEnd - tokenStart));
        } else {
          token._sel = true;
        }
      } else {
        console.log(`  → partially covered`);
        markPartial(token, Math.max(0, selStart - tokenStart), Math.min(rawLen, selEnd - tokenStart));
      }
    }
    offset = tokenEnd;
  }
  
  // Render
  let renderer = new marked.Renderer();
  let selRenderer = Object.create(renderer);
  
  let textWrapper = (fn) => {
    return function (token, ...args) {
      if (token && token._sel && typeof token._sel === 'object') {
        let raw = token.raw || token.text || '';
        let s = Math.max(0, Math.min(raw.length, token._sel.splitStart));
        let e = Math.max(s, Math.min(raw.length, token._sel.splitEnd));
        let before = escapeHtml(raw.substring(0, s));
        let middle = escapeHtml(raw.substring(s, e));
        let after = escapeHtml(raw.substring(e));
        console.log(`  textWrapper: raw=${JSON.stringify(raw)} _sel=${JSON.stringify(token._sel)}`);
        console.log(`    before=${JSON.stringify(before)} middle=${JSON.stringify(middle)} after=${JSON.stringify(after)}`);
        return before + '<span class="preview-selection">' + middle + '</span>' + after;
      }
      let html = fn.call(this, token, ...args);
      if (token && token._sel) {
        return '<span class="preview-selection">' + html + '</span>';
      }
      return html;
    };
  };
  let inlineWrapper = (fn) => {
    return function (token, ...args) {
      let html = fn.call(this, token, ...args);
      if (token && token._sel) {
        return '<span class="preview-selection">' + html + '</span>';
      }
      return html;
    };
  };
  let codespanWrapper = (fn) => {
    return function (token, ...args) {
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
      return fn.call(this, token, ...args);
    };
  };
  let blockWrapper = (fn) => {
    return function (token, ...args) {
      let html = fn.call(this, token, ...args);
      if (token && token._sel === true) {
        let trimmed = html.replace(/\n$/, '');
        let nl = html.endsWith('\n') ? '\n' : '';
        let withSel = trimmed.replace(/^(<\w+)([\s>])/, '$1 class="preview-selection"$2');
        if (withSel !== trimmed) return withSel + nl;
        return '<div class="preview-selection">' + trimmed + '</div>' + nl;
      }
      return html;
    };
  };
  let codeWrapper = (fn) => {
    return function (token, ...args) {
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
            let allLines = content.split('\n');
            let last = allLines.length - 1;
            while (last >= 0 && allLines[last] === '') last--;
            let lines = last < 0 ? [] : allLines.slice(0, last + 1);
            let result = [];
            for (let i = 0; i < lines.length; i++) {
              if (i >= token._sel.firstLine && i <= token._sel.lastLine) {
                result.push('<span class="preview-selection">' + lines[i] + '</span>');
              } else {
                result.push(lines[i]);
              }
              if (i < lines.length - 1) result.push('\n');
            }
            return '<div class="preview-selection-container">' + before + result.join('') + '\n' + after.replace(/\n$/, '') + '</div>\n';
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
    };
  };
  
  let wrap = (key, wrapper) => {
    let fn = renderer[key];
    if (typeof fn === 'function') selRenderer[key] = wrapper(fn);
  };
  wrap('space', blockWrapper);
  wrap('code', codeWrapper);
  wrap('blockquote', blockWrapper);
  wrap('html', blockWrapper);
  wrap('def', blockWrapper);
  wrap('heading', blockWrapper);
  wrap('hr', blockWrapper);
  wrap('list', blockWrapper);
  wrap('listitem', blockWrapper);
  wrap('paragraph', blockWrapper);
  wrap('table', blockWrapper);
  wrap('tablerow', blockWrapper);
  wrap('tablecell', blockWrapper);
  wrap('text', textWrapper);
  wrap('strong', inlineWrapper);
  wrap('em', inlineWrapper);
  wrap('codespan', codespanWrapper);
  wrap('br', inlineWrapper);
  wrap('del', inlineWrapper);
  wrap('link', inlineWrapper);
  wrap('image', inlineWrapper);
  wrap('checkbox', inlineWrapper);
  
  let result = marked.parser(tokens, { headerIds: false, mangle: false, renderer: selRenderer });
  console.log(`Result: ${JSON.stringify(result)}`);
}

function markPartial(token, localStart, localEnd) {
  console.log(`  markPartial: type=${token.type} raw=${JSON.stringify(token.raw)} [${localStart}, ${localEnd})`);
  if (hasInlineChildren(token)) {
    let co = contentOffsetInRaw(token);
    let sumRaws = token.tokens.reduce((s, t) => s + (t.raw ? t.raw.length : 0), 0);
    console.log(`    hasInline, co=${co}, sumRaws=${sumRaws}`);
    walkInlineTokens(token.tokens, 0, Math.max(0, localStart - co), Math.min(sumRaws, localEnd - co));
  } else if (token.type === 'list' && token.items) {
    let o = 0;
    for (let item of token.items) {
      let rl = item.raw ? item.raw.length : 0;
      let its = o, ite = o + rl;
      if (its < localEnd && ite > localStart) {
        if (its >= localStart && ite <= localEnd) item._sel = true;
        else markPartial(item, Math.max(0, localStart - its), Math.min(rl, localEnd - its));
      }
      o = ite;
    }
  } else if (token.tokens && token.tokens.length > 0 && !inlineTokenTypes.has(token.tokens[0].type)) {
    let o = 0;
    for (let child of token.tokens) {
      let rl = child.raw ? child.raw.length : 0;
      let cs = o, ce = o + rl;
      if (cs < localEnd && ce > localStart) {
        if (cs >= localStart && ce <= localEnd) child._sel = true;
        else markPartial(child, Math.max(0, localStart - cs), Math.min(rl, localEnd - cs));
      }
      o = ce;
    }
  } else {
    token._sel = true;
  }
}

// Test 1: select full word
test('convert()\n', 0, 9, 'select convert() - paragraph');

// Test 2: select "ver" within convert()
test('convert()\n', 3, 6, 'select ver in convert() - paragraph');

// Test 3: heading with convert()
test('## convert()\n', 6, 9, 'select ver in convert() - heading');

// Test 4: inline code convert()
test('`convert()`\n', 1, 10, 'select convert() in inline code');

// Test 5: select "ver" in inline code convert()
test('`convert()`\n', 4, 7, 'select ver in inline code convert()');

// Test 6: paragraph with inline code - select "marked" in `markedjs/marked`
test('This uses `markedjs/marked`.\n', 15, 21, 'select marked in inline code');

// Test 7: paragraph with inline code - select whole inline code
test('This uses `markedjs/marked`.\n', 11, 28, 'select whole inline code');

// Test 8: bold text
test('**convert()**\n', 2, 11, 'select convert() inside bold');

// Test 9: select "ver" in bold text
test('**convert()**\n', 5, 8, 'select ver in bold convert()');
