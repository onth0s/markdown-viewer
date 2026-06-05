import { escapeHtml } from '../editor/highlighter.js';
import { scheduleMermaidRender } from './mermaid-renderer.js';
import { enrichTokensWithPositions, wrapWithSourcePos } from '../selection/source-mapper.js';

/* global marked, DOMPurify */

let renderer = new marked.Renderer();
let renderCode = renderer.code.bind(renderer);
renderer.code = (token) => {
  let lang = (token.lang || '').match(/^\S*/)?.[0].toLowerCase();
  if (lang !== 'mermaid') return renderCode(token);
  return '<pre class="mermaid">' + escapeHtml(token.text) + '</pre>\n';
};

let renderImage = renderer.image.bind(renderer);
renderer.image = (token) => {
  let href = token.href || '';
  if (href.endsWith('markdown-preview-logo.svg') || href.endsWith('logo.png')) {
    return `<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" alt="${escapeHtml(token.text || '')}" class="themed-logo" data-original-src="${href}">`;
  }
  return renderImage(token);
};

// Decorate the renderer to automatically attach data-source-pos to all HTML tags
export let createSourcePosRenderer = (baseRenderer) => {
  let decoratedRenderer = Object.create(baseRenderer);
  let proto = Object.getPrototypeOf(baseRenderer);
  let keys = Object.getOwnPropertyNames(proto).concat(Object.getOwnPropertyNames(baseRenderer));

  for (let key of keys) {
    if (key === 'constructor') continue;
    let originalFn = baseRenderer[key] || proto[key];
    if (typeof originalFn === 'function') {
      decoratedRenderer[key] = function (token, ...args) {
        let html = originalFn.call(this, token, ...args);
        return wrapWithSourcePos(html, token);
      };
    }
  }
  return decoratedRenderer;
};

const sourcePosRenderer = createSourcePosRenderer(renderer);

export let convert = (output, markdown) => {
  if (!output) return;
  try {
    let cleanMd = "";
    for (let i = 0; i < markdown.length; i++) {
      if (markdown[i] !== '\r') {
        cleanMd += markdown[i];
      }
    }
    let tokens = marked.lexer(cleanMd);
    enrichTokensWithPositions(tokens);

    let html = marked.parser(tokens, { renderer: sourcePosRenderer, headerIds: false, mangle: false });
    let sanitized;
    if (typeof DOMPurify !== 'undefined') {
      sanitized = DOMPurify.sanitize(html, { ADD_ATTR: ['class', 'data-source-pos'] });
    } else {
      console.warn('[markdown-renderer] DOMPurify is not loaded — HTML output is not sanitized.');
      sanitized = html;
    }
    output.innerHTML = sanitized;
    if (typeof Prism !== 'undefined') {
      Prism.highlightAllUnder(output);
    }
    scheduleMermaidRender(output);
  } catch (e) {
    output.innerHTML = '<div class="mermaid-error">Render error: ' + escapeHtml(e.message || e) + '</div>';
  }
};
