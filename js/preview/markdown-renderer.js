import { escapeHtml, stripCR } from '../common/utils.js';
import { scheduleMermaidRender } from './mermaid-renderer.js';
import { enrichTokensWithPositions } from '../selection/source-mapper.js';
import { wrapEmojis } from '../common/emoji-helper.js';

/* global marked, DOMPurify */

let baseRenderer = null;
let sourcePosRenderer = null;

export const getSourcePosRenderer = () => {
  if (typeof marked === 'undefined') return null;
  if (sourcePosRenderer) return sourcePosRenderer;

  baseRenderer = new marked.Renderer();
  const renderCode = baseRenderer.code.bind(baseRenderer);
  baseRenderer.code = (token) => {
    const lang = (token.lang || '').match(/^\S*/)?.[0].toLowerCase();
    if (lang !== 'mermaid') return renderCode(token);
    return '<pre class="mermaid">' + escapeHtml(token.text) + '</pre>\n';
  };

  const renderImage = baseRenderer.image.bind(baseRenderer);
  baseRenderer.image = (token) => {
    const href = token.href || '';
    if (href.endsWith('markdown-preview-logo.svg') || href.endsWith('logo.png')) {
      return `<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" alt="${escapeHtml(token.text || '')}" class="themed-logo" data-original-src="${href}">`;
    }
    return renderImage(token);
  };

  const originalListitem = baseRenderer.listitem;
  baseRenderer.listitem = function (token) {
    let html = originalListitem.call(this, token);
    if (token.task) {
      html = html.replace('<li', '<li class="task-list-item"');
      html = html.replace('<input ', '<input class="task-list-item-checkbox" ');
    }
    return html;
  };

  sourcePosRenderer = createSourcePosRenderer(baseRenderer);
  return sourcePosRenderer;
};

/**
 * Injects a data-source-pos attribute into the first opening HTML tag of a
 * rendered HTML string, linking it back to the source markdown offset range.
 *
 * @param {string} html  - Rendered HTML segment
 * @param {object} token - The marked token being rendered
 * @returns {string} HTML with injected data-source-pos attribute
 */
const wrapWithSourcePos = (html, token) => {
  if (!token || token.start == null || token.end == null) return html;
  const posAttr = `data-source-pos="${token.start}-${token.end}"`;

  // Inject into the first opening HTML tag found in the output
  const trimmed = html.trim();
  const tagMatch = trimmed.match(/^<(\w+)([\s>])/);
  if (tagMatch) {
    const tagName = tagMatch[1];
    return trimmed.replace(/^<\w+/, `<${tagName} ${posAttr}`) + html.substring(trimmed.length);
  }

  // Fallback: wrap in a neutral span
  return `<span ${posAttr}>${html}</span>`;
};

// Decorate the renderer to automatically attach data-source-pos to all HTML tags
export const createSourcePosRenderer = (baseRenderer) => {
  const decoratedRenderer = Object.create(baseRenderer);
  const proto = Object.getPrototypeOf(baseRenderer);
  const keys = Object.getOwnPropertyNames(proto).concat(Object.getOwnPropertyNames(baseRenderer));

  for (const key of keys) {
    if (key === 'constructor') continue;
    const originalFn = baseRenderer[key] || proto[key];
    if (typeof originalFn === 'function') {
      decoratedRenderer[key] = function (token, ...args) {
        const html = originalFn.call(this, token, ...args);
        return wrapWithSourcePos(html, token);
      };
    }
  }
  return decoratedRenderer;
};

export const convert = (output, markdown) => {
  if (!output) return;
  const activeRenderer = getSourcePosRenderer();
  if (!activeRenderer) {
    output.innerHTML = `
      <div style="padding: 24px; color: var(--text-primary); text-align: center; border: 1px solid var(--border-default); border-radius: 6px; background: var(--bg-surface); margin: 20px;">
        <h3 style="margin: 0 0 10px 0; color: #ff3b30;">Markdown Parser Offline</h3>
        <p style="margin: 0; font-size: 14px;">The markdown compilation engine could not be loaded. Please check your internet connection and try reloading.</p>
      </div>
    `;
    return;
  }
  try {
    const cleanMd = stripCR(markdown);
    const tokens = marked.lexer(cleanMd);
    enrichTokensWithPositions(tokens);

    const html = marked.parser(tokens, { renderer: activeRenderer, headerIds: false, mangle: false });
    let sanitized;
    if (typeof DOMPurify !== 'undefined') {
      sanitized = DOMPurify.sanitize(html, { ADD_ATTR: ['class', 'data-source-pos'] });
    } else {
      console.warn('[markdown-renderer] DOMPurify is not loaded — HTML output is not sanitized.');
      sanitized = html;
    }
    output.innerHTML = sanitized;
    const hasCode = !!output.querySelector('pre code');
    if (hasCode) {
      const runHighlight = () => {
        Prism.highlightAllUnder(output);
        output.querySelectorAll('code[class*="language-"]').forEach(codeEl => {
          const nodes = Array.from(codeEl.childNodes);
          nodes.forEach(node => {
            if (node.nodeType === 3) {
              const span = document.createElement('span');
              span.className = 'token plain-text';
              codeEl.insertBefore(span, node);
              span.appendChild(node);
            }
          });
        });
      };
      if (typeof Prism !== 'undefined') {
        runHighlight();
      } else {
        const prismScript = document.querySelector('script[src*="prism-core.min.js"]');
        if (prismScript) {
          prismScript.addEventListener('load', runHighlight, { once: true });
        }
      }
    }
    wrapEmojis(output);
    scheduleMermaidRender(output);
  } catch (e) {
    output.innerHTML = '<div class="mermaid-error">Render error: ' + escapeHtml(e.message || e) + '</div>';
  }
};
