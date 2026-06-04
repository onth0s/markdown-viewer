/**
 * @file theme-engine.js
 * Lightness & Brightness engine.
 * Interpolates theme variables across:
 * A (0 - white) -> LIGHT (25) -> B (50 - illegible midpoint) -> DARK (75) -> C (100 - black)
 */

const BRIGHTNESS_KEY = 'mdv_brightness';
const THEME_KEY = 'com.markdownlivepreview_theme';

export const DEFAULT_LIGHT_BRIGHTNESS = 25;
export const DEFAULT_DARK_BRIGHTNESS = 75;

// Defined anchors: [S, L] percentages for Light (25) and Dark (75) themes.
// At A (0), L = 100, S = 0.
// At B (50), L = 50. Saturation is average of Light and Dark.
// At C (100), L = 0, S = 0.
const COLOR_MAP = {
  'color-primary':        { light: [47, 49], dark: [59, 64] },
  'color-primary-hover':  { light: [46, 56], dark: [64, 69] },
  'color-primary-active': { light: [49, 42], dark: [55, 57] },
  'color-primary-subtle': { light: [73, 96], dark: [36, 18] },
  'bg-app':               { light: [11, 97], dark: [29, 11] },
  'bg-surface':           { light: [0, 100], dark: [31, 15] },
  'bg-header':            { light: [24, 47], dark: [32, 24] },
  'bg-editor':            { light: [0, 100], dark: [31, 15] },
  'bg-preview':           { light: [0, 100], dark: [31, 15] },
  'bg-code':              { light: [67, 92], dark: [42, 20] },
  'border-default':       { light: [22, 88], dark: [30, 25] },
  'border-muted':         { light: [15, 94], dark: [28, 20] },
  'text-primary':         { light: [13, 16], dark: [40, 93] },
  'text-secondary':       { light: [9, 38],  dark: [9, 58]  },
  'text-tertiary':        { light: [9, 58],  dark: [11, 44] },
  'text-on-primary':      { light: [0, 100], dark: [0, 100] },
  'text-link':            { light: [47, 49], dark: [59, 64] },
  'syntax-heading':       { light: [47, 49], dark: [59, 64] },
  'syntax-bold':          { light: [13, 16], dark: [40, 93] },
  'syntax-italic':        { light: [13, 16], dark: [40, 93] },
  'syntax-code':          { light: [47, 49], dark: [59, 64] },
  'syntax-fence':         { light: [8, 43],  dark: [11, 44] },
  'syntax-link':          { light: [47, 49], dark: [59, 64] },
  'syntax-image':         { light: [47, 49], dark: [80, 72] },
  'syntax-quote':         { light: [8, 43],  dark: [11, 44] },
  'syntax-list':          { light: [47, 49], dark: [59, 64] },
  'syntax-hr':            { light: [22, 88], dark: [30, 25] },
  'syntax-table':         { light: [13, 16], dark: [40, 93] },
  'syntax-table-sep':     { light: [22, 88], dark: [30, 25] },
  'syntax-strike':        { light: [8, 43],  dark: [11, 44] },
  'selection-bg':         { light: [75, 88], dark: [43, 29] },
  'selection-text':       { light: [13, 16], dark: [40, 93] },
  'scrollbar-thumb':      { light: [13, 80], dark: [25, 30] },
  'scrollbar-thumb-hover':{ light: [8, 70],  dark: [20, 36] },
  'divider':              { light: [22, 88], dark: [30, 25] },
  'divider-hover':        { light: [10, 75], dark: [25, 30] },
  'divider-active':       { light: [6, 58],  dark: [20, 36] },
  'toggle-bg':            { light: [13, 80], dark: [39, 18] },
  'toggle-knob':          { light: [0, 100], dark: [40, 93] },
  'toggle-icon':          { light: [9, 38],  dark: [9, 58]  },
  'caret-color':          { light: [13, 16], dark: [40, 93] }
};

/** Get stored brightness value (0-100) */
export let getBrightness = () => {
  let val = localStorage.getItem(BRIGHTNESS_KEY);
  if (val !== null) return parseInt(val, 10);
  // Fallback to legacy theme key
  let old = localStorage.getItem(THEME_KEY);
  return old === 'light' ? DEFAULT_LIGHT_BRIGHTNESS : DEFAULT_DARK_BRIGHTNESS;
};

/** Interpolate a single color role value */
let interpolateColor = (brightness, lightHsl, darkHsl) => {
  let [sLight, lLight] = lightHsl;
  let [sDark, lDark] = darkHsl;
  let sMid = (sLight + sDark) / 2;
  let lMid = 50;

  let s, l;

  if (brightness <= 25) {
    // Segment A (0) to LIGHT (25)
    // S: 0 -> sLight
    // L: 100 -> lLight
    let t = brightness / 25;
    s = t * sLight;
    l = 100 - t * (100 - lLight);
  } else if (brightness <= 50) {
    // Segment LIGHT (25) to B (50)
    // S: sLight -> sMid
    // L: lLight -> 50
    let t = (brightness - 25) / 25;
    s = sLight + t * (sMid - sLight);
    l = lLight + t * (lMid - lLight);
  } else if (brightness <= 75) {
    // Segment B (50) to DARK (75)
    // S: sMid -> sDark
    // L: 50 -> lDark
    let t = (brightness - 50) / 25;
    s = sMid + t * (sDark - sMid);
    l = lMid + t * (lDark - lMid);
  } else {
    // Segment DARK (75) to C (100)
    // S: sDark -> 0
    // L: lDark -> 0
    let t = (brightness - 75) / 25;
    s = sDark - t * sDark;
    l = lDark - t * lDark;
  }

  return [Math.round(s), Math.round(l)];
};

/** Apply brightness to the document root element */
export let applyBrightness = (brightness) => {
  let doc = document.documentElement;
  for (let [name, config] of Object.entries(COLOR_MAP)) {
    let [s, l] = interpolateColor(brightness, config.light, config.dark);
    doc.style.setProperty(`--${name}-s`, `${s}%`);
    doc.style.setProperty(`--${name}-l`, `${l}%`);
  }

  // Apply clamped variables to the settings popup to limit its slider response
  let clampedBrightness = Math.max(25, Math.min(75, brightness));
  let popupEl = document.getElementById('wrench-popup');
  if (popupEl) {
    for (let [name, config] of Object.entries(COLOR_MAP)) {
      let [s, l] = interpolateColor(clampedBrightness, config.light, config.dark);
      popupEl.style.setProperty(`--${name}`, `hsl(var(--hue), ${s}%, ${l}%)`);
    }
  }

  // Navbar logo: keep dark mode values (>=50), scale lightness to 75% at brightness 25 (<50). Clamped to [25, 75].
  let logoS, logoL;
  if (clampedBrightness >= 50) {
    [logoS, logoL] = interpolateColor(clampedBrightness, COLOR_MAP['color-primary'].light, COLOR_MAP['color-primary'].dark);
  } else {
    let t = Math.min(1, clampedBrightness / 25);
    logoS = Math.round(t * COLOR_MAP['color-primary'].light[0]);
    logoL = Math.round(50 + ((50 - clampedBrightness) / 50) * 50);
  }
  doc.style.setProperty('--nav-logo-color', `hsl(var(--hue), ${logoS}%, ${logoL}%)`);

  // Wrench icon: clamp to standard [25, 75] range so it keeps 16% lightness (visible grey) at max brightness (white header)
  let [iconS, iconL] = interpolateColor(clampedBrightness, COLOR_MAP['text-primary'].light, COLOR_MAP['text-primary'].dark);
  doc.style.setProperty('--nav-icon-color', `hsl(var(--hue), ${iconS}%, ${iconL}%)`);
};

/** Save brightness to local storage and update corresponding legacy theme state */
export let saveBrightness = (brightness) => {
  localStorage.setItem(BRIGHTNESS_KEY, brightness);
  localStorage.setItem(THEME_KEY, brightness < 50 ? 'light' : 'dark');
};
