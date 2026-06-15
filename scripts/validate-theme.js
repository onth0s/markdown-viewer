import fs from 'fs';
import path from 'path';

const htmlPath = path.resolve('index.html');
const jsPath = path.resolve('js/common/theme-engine.js');

const htmlContent = fs.readFileSync(htmlPath, 'utf8');
const jsContent = fs.readFileSync(jsPath, 'utf8');

// Extract COLOR_MAP from html
const htmlMapMatch = htmlContent.match(/var COLOR_MAP = \{([\s\S]*?)\};/);
if (!htmlMapMatch) {
  console.error('Failed to find COLOR_MAP in index.html');
  process.exit(1);
}

// Extract COLOR_MAP from js
const jsMapMatch = jsContent.match(/return \{([\s\S]*?)\};/);
if (!jsMapMatch) {
  console.error('Failed to find COLOR_MAP in theme-engine.js');
  process.exit(1);
}

const parseObject = (str) => {
  return new Function(`return { ${str} }`)();
};

let htmlMap, jsMap;
try {
  htmlMap = parseObject(htmlMapMatch[1]);
} catch (e) {
  console.error('Error parsing index.html COLOR_MAP:', e.message);
  process.exit(1);
}

try {
  jsMap = parseObject(jsMapMatch[1]);
} catch (e) {
  console.error('Error parsing theme-engine.js COLOR_MAP:', e.message);
  process.exit(1);
}

const htmlResolved = {};
for (const key of Object.keys(htmlMap)) {
  const val = htmlMap[key];
  htmlResolved[key] = {
    light: [val[0], val[1]],
    dark: [val[2], val[3]]
  };
}

let hasError = false;
const allKeys = new Set([...Object.keys(htmlResolved), ...Object.keys(jsMap)]);
for (const key of allKeys) {
  if (!htmlResolved[key]) {
    console.error(`Key "${key}" is missing in index.html COLOR_MAP`);
    hasError = true;
    continue;
  }
  if (!jsMap[key]) {
    console.error(`Key "${key}" is missing in theme-engine.js COLOR_MAP`);
    hasError = true;
    continue;
  }
  const htmlVal = htmlResolved[key];
  const jsVal = jsMap[key];
  if (
    htmlVal.light[0] !== jsVal.light[0] ||
    htmlVal.light[1] !== jsVal.light[1] ||
    htmlVal.dark[0] !== jsVal.dark[0] ||
    htmlVal.dark[1] !== jsVal.dark[1]
  ) {
    console.error(`Color mismatch for key "${key}":`);
    console.error(`  index.html:      light: ${JSON.stringify(htmlVal.light)}, dark: ${JSON.stringify(htmlVal.dark)}`);
    console.error(`  theme-engine.js: light: ${JSON.stringify(jsVal.light)}, dark: ${JSON.stringify(jsVal.dark)}`);
    hasError = true;
  }
}

if (hasError) {
  process.exit(1);
} else {
  console.log('✓ Theme COLOR_MAP color configs match perfectly!');
}
