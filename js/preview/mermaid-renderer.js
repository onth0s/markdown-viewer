/* global mermaid */

/**
 * @typedef {{ initialize: (config: object) => void, render: (id: string, text: string) => Promise<{svg: string, bindFunctions?: (el: Element) => void}> }} MermaidAPI
 */

const MERMAID_CDN = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js';

let mermaidScriptPromise = null;

const loadMermaidScript = () => {
  if (window.mermaid) return Promise.resolve(window.mermaid);
  if (mermaidScriptPromise) return mermaidScriptPromise;
  mermaidScriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
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

export const getMermaidTheme = () => {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'default';
};

export const configureMermaid = (theme) => {
  if (typeof mermaid === 'undefined') return;
  mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme });
};

export const initMermaid = () => {
  if (typeof window.mermaid !== 'undefined') {
    configureMermaid(getMermaidTheme());
  }
};

const showMermaidError = (element, error) => {
  const message = error && error.message ? error.message : 'Unable to render Mermaid chart.';
  element.classList.add('mermaid-error');
  element.textContent = 'Mermaid render error: ' + message;
};

export const renderMermaidDiagramsNow = async (output, theme) => {
  if (!output) return;
  const elements = Array.from(output.querySelectorAll('.mermaid'));
  if (elements.length === 0) return;
  if (typeof mermaid === 'undefined') {
    try {
      await loadMermaidScript();
    } catch (e) {
      console.warn('[mermaid-renderer] failed to load mermaid:', e);
      for (const el of elements) {
        showMermaidError(el, new Error('Mermaid rendering engine is offline (failed to fetch CDN script).'));
      }
      return;
    }
  }
  if (!theme) theme = getMermaidTheme();
  const version = ++mermaidRenderVersion;
  configureMermaid(theme);
  for (let i = 0; i < elements.length; i++) {
    if (version !== mermaidRenderVersion) return;
    const el = elements[i];
    const source = el.dataset.mermaidSource || el.textContent;
    el.dataset.mermaidSource = source;
    el.classList.remove('mermaid-error');
    try {
      const renderId = 'mermaid-' + Date.now() + '-' + version + '-' + i;
      const result = await window.mermaid.render(renderId, source);
      if (version !== mermaidRenderVersion) return;
      el.innerHTML = result.svg;
      if (typeof result.bindFunctions === 'function') result.bindFunctions(el);
    } catch (error) {
      showMermaidError(el, error);
    }
  }
};

export const scheduleMermaidRender = (output) => {
  if (mermaidRenderTimer) clearTimeout(mermaidRenderTimer);
  mermaidRenderTimer = setTimeout(() => {
    mermaidRenderTimer = null;
    renderMermaidDiagramsNow(output);
  }, 150);
};

export const renderMermaidDiagrams = (output, theme) => {
  if (mermaidRenderTimer) {
    clearTimeout(mermaidRenderTimer);
    mermaidRenderTimer = null;
  }
  return renderMermaidDiagramsNow(output, theme);
};

export const preloadMermaid = () => loadMermaidScript();
