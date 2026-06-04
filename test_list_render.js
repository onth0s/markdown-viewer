const marked = require('marked');

// Full simulation of the selRenderer text wrapper behavior for lists
let escapeHtml = (v) => v.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

let r = new marked.Renderer();
let origText = r.text.bind(r);
let selR = Object.create(r);

selR.text = function(token, ...args) {
  if (token && token._sel && typeof token._sel === 'object') {
    let raw = token.raw || token.text || '';
    let s = Math.max(0, Math.min(raw.length, token._sel.splitStart));
    let e = Math.max(s, Math.min(raw.length, token._sel.splitEnd));
    return escapeHtml(raw.substring(0, s)) +
           '<span class="preview-selection">' + escapeHtml(raw.substring(s, e)) + '</span>' +
           escapeHtml(raw.substring(e));
  }
  let html = origText.call(this, token, ...args);
  if (token && token._sel) {
    return '<span class="preview-selection">' + html + '</span>';
  }
  return html;
};

const listMd = '- item one\n- item two\n- item three\n';
let tokens = marked.lexer(listMd);
let list = tokens[0];

// Simulate: mark inner text token of item two as fully selected
// item two = items[1]
// items[1].tokens[0] = outer text token {raw:"item two", tokens:[inner]}
// items[1].tokens[0].tokens[0] = inner text token {raw:"item two", escaped:false}
let innerTextToken = list.items[1].tokens[0].tokens[0];
console.log('Marking inner text:', JSON.stringify(innerTextToken));
innerTextToken._sel = true;

let html = marked.parser(tokens, { renderer: selR });
console.log('\nRendered HTML:');
console.log(html);
console.log('\nContains preview-selection?', html.includes('preview-selection'));

// Now test partial selection
tokens = marked.lexer(listMd);
list = tokens[0];
// Mark partial: splitStart=2, splitEnd=6 -> "em o" in "item one"
let innerFirst = list.items[0].tokens[0].tokens[0];
innerFirst._sel = { splitStart: 2, splitEnd: 6 };
html = marked.parser(tokens, { renderer: selR });
console.log('\nPartial selection rendered:');
console.log(html);
