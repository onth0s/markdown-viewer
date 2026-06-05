import { escapeHtml } from '../common/utils.js';

/* global mermaid */

/**
 * @typedef {{ initialize: (config: object) => void, render: (id: string, text: string) => Promise<{svg: string, bindFunctions?: (el: Element) => void}> }} MermaidAPI
 */

let mermaidRenderTimer = null;
let mermaidRenderVersion = 0;

export let getMermaidTheme = () => {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'default';
};

export let configureMermaid = (theme) => {
  if (typeof mermaid === 'undefined') {
    console.warn('[mermaid-renderer] mermaid is not loaded — diagram rendering is unavailable.');
    return;
  }
  mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme });
};

export let initMermaid = () => {
  configureMermaid(getMermaidTheme());
};

let showMermaidError = (element, error) => {
  let message = error && error.message ? error.message : 'Unable to render Mermaid chart.';
  element.classList.add('mermaid-error');
  element.textContent = 'Mermaid render error: ' + message;
};

export let renderMermaidDiagramsNow = async (output, theme) => {
  if (typeof mermaid === 'undefined') {
    console.warn('[mermaid-renderer] mermaid is not loaded — skipping diagram render.');
    return;
  }
  if (!theme) theme = getMermaidTheme();
  if (!output) return;
  let version = ++mermaidRenderVersion;
  configureMermaid(theme);
  let elements = Array.from(output.querySelectorAll('.mermaid'));
  for (let i = 0; i < elements.length; i++) {
    if (version !== mermaidRenderVersion) return;
    let el = elements[i];
    let source = el.dataset.mermaidSource || el.textContent;
    el.dataset.mermaidSource = source;
    el.classList.remove('mermaid-error');
    try {
      let renderId = 'mermaid-' + Date.now() + '-' + version + '-' + i;
      let result = await mermaid.render(renderId, source);
      if (version !== mermaidRenderVersion) return;
      el.innerHTML = result.svg;
      if (typeof result.bindFunctions === 'function') result.bindFunctions(el);
    } catch (error) {
      showMermaidError(el, error);
    }
  }
};

export let scheduleMermaidRender = (output) => {
  if (mermaidRenderTimer) clearTimeout(mermaidRenderTimer);
  mermaidRenderTimer = setTimeout(() => {
    mermaidRenderTimer = null;
    renderMermaidDiagramsNow(output);
  }, 150);
};

export let renderMermaidDiagrams = (output, theme) => {
  if (mermaidRenderTimer) {
    clearTimeout(mermaidRenderTimer);
    mermaidRenderTimer = null;
  }
  return renderMermaidDiagramsNow(output, theme);
};
