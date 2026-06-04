import {
  STORAGE_THEME_KEY,
  STORAGE_CONTENT_KEY,
  STORAGE_SCROLL_KEY,
  STORAGE_SCROLL_POS_KEY,
  STORAGE_SWAP_KEY
} from './constants.js';

export let saveLastContent = (content) => {
  try { localStorage.setItem(STORAGE_CONTENT_KEY, content); } catch (e) {}
};

export let loadLastContent = () => {
  try { return localStorage.getItem(STORAGE_CONTENT_KEY); } catch (e) { return null; }
};

export let loadThemeSettings = () => {
  try {
    let raw = localStorage.getItem(STORAGE_THEME_KEY);
    if (raw === 'dark') return true;
    if (raw === 'light') return false;
  } catch (e) {}
  return true;
};

export let saveThemeSettings = (settings) => {
  try { localStorage.setItem(STORAGE_THEME_KEY, settings ? 'dark' : 'light'); } catch (e) {}
};

export let loadScrollBarSettings = () => {
  try {
    let raw = localStorage.getItem(STORAGE_SCROLL_KEY);
    return raw !== 'false';
  } catch (e) { return true; }
};

export let saveScrollBarSettings = (settings) => {
  try { localStorage.setItem(STORAGE_SCROLL_KEY, settings ? 'true' : 'false'); } catch (e) {}
};

export let saveScrollPositions = (editorRatio, previewRatio, caret) => {
  try {
    let payload = JSON.stringify({
      editor: editorRatio,
      preview: previewRatio,
      caret: caret
    });
    localStorage.setItem(STORAGE_SCROLL_POS_KEY, payload);
  } catch (e) {}
};

export let loadScrollPositions = () => {
  try {
    let raw = localStorage.getItem(STORAGE_SCROLL_POS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) { return null; }
};

export let loadSwappedState = () => {
  try {
    return localStorage.getItem(STORAGE_SWAP_KEY) === 'true';
  } catch (e) {
    return false;
  }
};

export let saveSwappedState = (swapped) => {
  try {
    localStorage.setItem(STORAGE_SWAP_KEY, swapped ? 'true' : 'false');
  } catch (e) {}
};
