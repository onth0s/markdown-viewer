import { escapeHtml } from '../common/utils.js';

/* global mermaid */

/**
 * @typedef {{ initialize: (config: object) => void, render: (id: string, text: string) => Promise<{svg: string, bindFunctions?: (el: Element) => void}> }} MermaidAPI
 */

const MERMAID_CDN = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js';

let mermaidScriptPromise = null;

let loadMermaidScript = () => {
  if (window.mermaid) return Promise.resolve(window.mermaid);
  if (mermaidScriptPromise) return mermaidScriptPromise;
  mermaidScriptPromise = new Promise((resolve, reject) => {
    let s = document.createElement('script');
    s.src = MERMAID_CDN;
    s.crossOrigin = 'anonymous';
    s.onload = () => resolve(window.mermaid);
    s.onerror = () => {
      mermaidScriptPromise = null;
      reject(new Error('Failed to load mermaid from CDN'));
    };
    document.head.appendChild(s);
  });
  return mermaidScriptPromise;
};

let mermaidRenderTimer = null;
let mermaidRenderVersion = 0;

export let getMermaidTheme = () => {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'default';
};

export let configureMermaid = (theme) => {
  if (typeof mermaid === 'undefined') return;
  mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme });
};

export let initMermaid = () => {
  if (typeof window.mermaid !== 'undefined') {
    configureMermaid(getMermaidTheme());
  }
};

let showMermaidError = (element, error) => {
  let message = error && error.message ? error.message : 'Unable to render Mermaid chart.';
  element.classList.add('mermaid-error');
  element.textContent = 'Mermaid render error: ' + message;
};

export let renderMermaidDiagramsNow = async (output, theme) => {
  if (!output) return;
  let elements = Array.from(output.querySelectorAll('.mermaid'));
  if (elements.length === 0) return;
  if (typeof mermaid === 'undefined') {
    try {
      await loadMermaidScript();
    } catch (e) {
      console.warn('[mermaid-renderer] failed to load mermaid:', e);
      return;
    }
  }
  if (!theme) theme = getMermaidTheme();
  let version = ++mermaidRenderVersion;
  configureMermaid(theme);
  for (let i = 0; i < elements.length; i++) {
    if (version !== mermaidRenderVersion) return;
    let el = elements[i];
    let source = el.dataset.mermaidSource || el.textContent;
    el.dataset.mermaidSource = source;
    el.classList.remove('mermaid-error');
    try {
      let renderId = 'mermaid-' + Date.now() + '-' + version + '-' + i;
      let result = await window.mermaid.render(renderId, source);
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

export let preloadMermaid = () => loadMermaidScript();
