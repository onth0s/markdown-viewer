import {
  STORAGE_THEME_KEY,
  STORAGE_CONTENT_KEY,
  STORAGE_SCROLL_KEY,
  STORAGE_SCROLL_POS_KEY,
  STORAGE_SWAP_KEY,
  STORAGE_PANE_RATIO_KEY,
  BRIGHTNESS_KEY,
  HUE_KEY
} from './constants.js';

export const saveLastContent = (content) => {
  try { localStorage.setItem(STORAGE_CONTENT_KEY, content); } catch (e) {}
};

export const loadLastContent = () => {
  try { return localStorage.getItem(STORAGE_CONTENT_KEY); } catch (e) { return null; }
};

export const loadThemeSettings = () => {
  try {
    const raw = localStorage.getItem(STORAGE_THEME_KEY);
    if (raw === 'dark') return true;
    if (raw === 'light') return false;
  } catch (e) {}
  return true;
};

export const saveThemeSettings = (settings) => {
  try { localStorage.setItem(STORAGE_THEME_KEY, settings ? 'dark' : 'light'); } catch (e) {}
};

export const loadScrollBarSettings = () => {
  try {
    const raw = localStorage.getItem(STORAGE_SCROLL_KEY);
    return raw !== 'false';
  } catch (e) { return true; }
};

export const saveScrollBarSettings = (settings) => {
  try { localStorage.setItem(STORAGE_SCROLL_KEY, settings ? 'true' : 'false'); } catch (e) {}
};

export const saveScrollPositions = (editorRatio, previewRatio, caret) => {
  try {
    const payload = JSON.stringify({
      editor: editorRatio,
      preview: previewRatio,
      caret: caret
    });
    localStorage.setItem(STORAGE_SCROLL_POS_KEY, payload);
  } catch (e) {}
};

export const loadScrollPositions = () => {
  try {
    const raw = localStorage.getItem(STORAGE_SCROLL_POS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) { return null; }
};

export const loadSwappedState = () => {
  try {
    return localStorage.getItem(STORAGE_SWAP_KEY) === 'true';
  } catch (e) {
    return false;
  }
};

export const saveSwappedState = (swapped) => {
  try {
    localStorage.setItem(STORAGE_SWAP_KEY, swapped ? 'true' : 'false');
  } catch (e) {}
};

export const savePaneRatio = (ratio) => {
  try { localStorage.setItem(STORAGE_PANE_RATIO_KEY, String(ratio)); } catch (e) {}
};

export const loadPaneRatio = () => {
  try {
    const raw = localStorage.getItem(STORAGE_PANE_RATIO_KEY);
    if (raw === null) return null;
    const v = parseFloat(raw);
    return isNaN(v) ? null : Math.max(0.1, Math.min(0.9, v));
  } catch (e) { return null; }
};

// ─── Hue ─────────────────────────────────────────────────────────────────────

export const DEFAULT_HUE = 228;

export const getHue = () => {
  try {
    const raw = localStorage.getItem(HUE_KEY);
    return raw !== null ? parseInt(raw, 10) : DEFAULT_HUE;
  } catch (e) {
    return DEFAULT_HUE;
  }
};

export const saveHue = (hue) => {
  try { localStorage.setItem(HUE_KEY, hue); } catch (e) {}
};

// ─── Brightness ───────────────────────────────────────────────────────────────

export const DEFAULT_LIGHT_BRIGHTNESS = 25;
export const DEFAULT_DARK_BRIGHTNESS = 75;

export const getBrightness = () => {
  try {
    const val = localStorage.getItem(BRIGHTNESS_KEY);
    if (val !== null) return parseInt(val, 10);
    // Fallback to legacy theme key
    const old = localStorage.getItem(STORAGE_THEME_KEY);
    return old === 'light' ? DEFAULT_LIGHT_BRIGHTNESS : DEFAULT_DARK_BRIGHTNESS;
  } catch (e) {
    return DEFAULT_DARK_BRIGHTNESS;
  }
};

export const saveBrightness = (brightness) => {
  try {
    localStorage.setItem(BRIGHTNESS_KEY, brightness);
    localStorage.setItem(STORAGE_THEME_KEY, brightness < 50 ? 'light' : 'dark');
  } catch (e) {}
};
