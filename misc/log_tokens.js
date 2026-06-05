const marked = require('marked');

let md = "Some text\n\n```css\n--bg-app: hsl(var(--hue), 11%, var(--bg-app-l));\n```\n\nMore text";
let tokens = marked.lexer(md);
let offset = 0;
for (let token of tokens) {
  let rawLen = token.raw ? token.raw.length : 0;
  let tokenStart = offset;
  let tokenEnd = offset + rawLen;
  console.log(`Token type=${token.type} start=${tokenStart} end=${tokenEnd} raw=${JSON.stringify(token.raw)}`);
  offset = tokenEnd;
}
