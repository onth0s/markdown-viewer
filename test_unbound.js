const marked = require('marked');

// The fix: don't use fn.bind(r) - use the wrapper 'this' instead
let r = new marked.Renderer();
let origText = r.text; // NOT bound - use dynamic this
let selR = Object.create(r);
selR.text = function(token, ...args) {
  let html = origText.call(this, token, ...args); // 'this' = actual parser context
  if (token && token._sel) return '<span class="preview-selection">' + html + '</span>';
  return html;
};

const md = '- item one\n- item two\n';
let tokens = marked.lexer(md);
tokens[0].items[1].tokens[0].tokens[0]._sel = true;
let html = marked.parser(tokens, { renderer: selR });
console.log('With unbound text renderer:');
console.log(html);
console.log('Contains preview-selection:', html.includes('preview-selection'));
