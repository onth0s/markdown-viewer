const marked = require('marked');
const fs = require('fs');
const path = require('path');

// Mock renderWithSelection directly
let renderer = new marked.Renderer();
let renderCode = renderer.code.bind(renderer);
renderer.code = (token) => {
  let lang = (token.lang || '').match(/^\S*/)?.[0].toLowerCase();
  if (lang !== 'mermaid') return renderCode(token);
  return '<pre class="mermaid">' + token.text + '</pre>\n';
};

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
        let contentStart = tokStart + contentOff;
        if (fullyCovered) {
          tok._sel = true;
        } else {
          let s = Math.max(0, Math.min(textLen, localStart - contentStart));
          let e = Math.max(0, Math.min(textLen, localEnd - contentStart));
          if (e > s) tok._sel = { splitStart: s, splitEnd: e };
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

let isBlockContainer = (token) => {
  return token.type === 'paragraph' ||
         token.type === 'heading' ||
         token.type === 'list' ||
         token.type === 'listitem' ||
         token.type === 'table' ||
         token.type === 'tablerow' ||
         token.type === 'tablecell' ||
         token.type === 'blockquote' ||
         token.type === 'code' ||
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
  } else if (token.type === 'listitem' && token.tokens) {
    let o = 0;
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
    let lang = (token.lang || '').match(/^\S*/)?.[0].toLowerCase();
    if (lang === 'mermaid') { token._sel = true; return; }
    let contentOff = token.raw.indexOf(token.text || '');
    if (contentOff < 0) contentOff = 0;
    let textLen = (token.text || '').length;
    let codeStart = Math.max(0, Math.min(textLen, localStart - contentOff));
    let codeEnd = Math.max(0, Math.min(textLen, localEnd - contentOff));
    if (codeStart >= codeEnd) { return; }
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

let escapeHtml = (value) => {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
};

let renderWithSelection = (md, selStart, selEnd) => {
  // Normalize Windows line endings to \n and adjust selection indices accordingly
  let cleanMd = "";
  let map = [];
  for (let i = 0; i < md.length; i++) {
    if (md[i] !== '\r') {
      cleanMd += md[i];
      map.push(i);
    }
  }
  // Helper to translate offset from original md to cleanMd
  let translateOffset = (origOffset) => {
    if (origOffset == null) return origOffset;
    let clean = 0;
    for (let i = 0; i < origOffset; i++) {
      if (md[i] !== '\r') clean++;
    }
    return clean;
  };
  
  let cleanStart = translateOffset(selStart);
  let cleanEnd = translateOffset(selEnd);
  
  let options = { headerIds: false, mangle: false };
  if (cleanStart == null || cleanEnd == null || cleanStart === cleanEnd) {
    return marked.parse(cleanMd, { ...options, renderer });
  }
  let tokens = marked.lexer(cleanMd);
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
        } else {
          markPartial(token, localStart, localEnd);
        }
      }
    }
    offset = tokenEnd;
  }
  let selRenderer = Object.create(renderer);
  let textWrapper = (fn) => {
    return function (token, ...args) {
      if (token && token._sel && typeof token._sel === 'object') {
        let raw = token.raw || token.text || '';
        let s = Math.max(0, Math.min(raw.length, token._sel.splitStart));
        let e = Math.max(s, Math.min(raw.length, token._sel.splitEnd));
        return escapeHtml(raw.substring(0, s)) +
               '<span class="preview-selection">' + escapeHtml(raw.substring(s, e)) + '</span>' +
               escapeHtml(raw.substring(e));
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
  let wrap = (key, wrapper) => {
    let fn = renderer[key];
    if (typeof fn === 'function') selRenderer[key] = wrapper(fn);
  };
  wrap('code', (fn) => {
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
            let lines = content.split('\n');
            let result = [];
            for (let i = 0; i < lines.length; i++) {
              if (i >= token._sel.firstLine && i <= token._sel.lastLine) {
                result.push('<span class="preview-selection">' + lines[i] + '</span>');
              } else {
                result.push(lines[i]);
              }
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
    };
  });
  wrap('text', textWrapper);
  wrap('strong', inlineWrapper);
  wrap('em', inlineWrapper);
  wrap('codespan', (fn) => {
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
  });
  wrap('br', inlineWrapper);
  wrap('del', inlineWrapper);
  wrap('link', inlineWrapper);
  wrap('image', inlineWrapper);
  wrap('checkbox', inlineWrapper);
  return marked.parser(tokens, { ...options, renderer: selRenderer });
};

// Comprehensive Test Suite
const tests = [
  { md: "convert()\r\n", start: 0, end: 9, desc: "select convert() - paragraph" },
  { md: "convert()\r\n", start: 3, end: 6, desc: "select ver in convert() - paragraph" },
  { md: "## convert()\r\n", start: 6, end: 9, desc: "select ver in convert() - heading" },
  { md: "`convert()`\r\n", start: 1, end: 10, desc: "select convert() in inline code" },
  { md: "`convert()`\r\n", start: 4, end: 7, desc: "select ver in inline code convert()" },
  { md: "This uses `markedjs/marked`.\r\n", start: 15, end: 21, desc: "select marked in inline code" },
  { md: "This uses `markedjs/marked`.\r\n", start: 11, end: 28, desc: "select whole inline code" },
  { md: "**convert()**\r\n", start: 2, end: 11, desc: "select convert() inside bold" },
  { md: "**convert()**\r\n", start: 5, end: 8, desc: "select ver in bold convert()" }
];

for (let t of tests) {
  console.log(`\n=== Test: ${t.desc} ===`);
  console.log(`MD: ${JSON.stringify(t.md)}`);
  console.log(`Selection: ${JSON.stringify(t.md.substring(t.start, t.end))} [${t.start}, ${t.end})`);
  let out = renderWithSelection(t.md, t.start, t.end);
  console.log(`Result: ${JSON.stringify(out)}`);
}
