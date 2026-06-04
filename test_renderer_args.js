const marked = require('marked');

// Check what the text renderer actually receives as args
let r = new marked.Renderer();
let origText = r.text.bind(r);
r.text = function(token, ...args) {
  console.log('text called, type:', typeof token, 'token:', JSON.stringify(token).substring(0, 120));
  return origText.call(this, token, ...args);
};

const listMd = '- item one\n- item two\n';
try {
  let html = marked.parse(listMd, { renderer: r });
  console.log(html);
} catch (e) {
  console.error('Error:', e.message);
}
