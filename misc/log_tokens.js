const marked = require('marked');

const md = "Some text\n\n```css\n--bg-app: hsl(var(--hue), 11%, var(--bg-app-l));\n```\n\nMore text";
const tokens = marked.lexer(md);
let offset = 0;
for (const token of tokens) {
  const rawLen = token.raw ? token.raw.length : 0;
  const tokenStart = offset;
  const tokenEnd = offset + rawLen;
  console.log(`Token type=${token.type} start=${tokenStart} end=${tokenEnd} raw=${JSON.stringify(token.raw)}`);
  offset = tokenEnd;
}
