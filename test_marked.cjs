const m = require('marked');

console.log('=== Paragraph with bold ===');
console.log(JSON.stringify(m.lexer('hello **world** foo\n'), null, 2));

console.log('\n=== List ===');
console.log(JSON.stringify(m.lexer('- item 1\n- item 2\n'), null, 2));

console.log('\n=== Heading ===');
console.log(JSON.stringify(m.lexer('## hello **world**\n'), null, 2));

console.log('\n=== Blockquote ===');
console.log(JSON.stringify(m.lexer('> hello\n> world\n'), null, 2));

console.log('\n=== Code block ===');
console.log(JSON.stringify(m.lexer('```\ncode\n```\n'), null, 2));

// Check inline raw vs text
let tokens = m.lexer('hello **world** foo\n');
console.log('\n=== Paragraph inline raw lengths ===');
let p = tokens[0];
console.log('Paragraph raw:', JSON.stringify(p.raw), 'length:', p.raw.length);
for (let tok of p.tokens) {
  console.log('  Inline:', tok.type, 'raw:', JSON.stringify(tok.raw), 'length:', tok.raw.length);
  if (tok.tokens) {
    for (let t of tok.tokens) {
      console.log('    Nested:', t.type, 'raw:', JSON.stringify(t.raw), 'length:', t.raw.length);
    }
  }
}
