/**
 * @file theme-engine.js
 * Lightness & Brightness engine.
 * Interpolates theme variables across:
 * A (0 - white) -> LIGHT (25) -> B (50 - illegible midpoint) -> DARK (75) -> C (100 - black)
 *
 * Persistence (getBrightness/saveBrightness/DEFAULT_*) is centralized in storage.js.
 */

export { DEFAULT_LIGHT_BRIGHTNESS, DEFAULT_DARK_BRIGHTNESS, getBrightness, saveBrightness } from './storage.js';


// Defined anchors: [S, L] percentages for Light (25) and Dark (75) themes.
// At A (0), L = 100, S = 0.
// At B (50), L = 50. Saturation is average of Light and Dark.
// At C (100), L = 0, S = 0.
export const COLOR_MAP = (() => {
  if (typeof window !== 'undefined' && window.__INITIAL_THEME__ && window.__INITIAL_THEME__.colorMap) {
    const rawMap = window.__INITIAL_THEME__.colorMap;
    const resolved = {};
    for (const key of Object.keys(rawMap)) {
      const val = rawMap[key];
      resolved[key] = { light: [val[0], val[1]], dark: [val[2], val[3]] };
    }
    return resolved;
  }
  return {
    'color-primary':        { light: [38, 45], dark: [59, 64] },
    'color-primary-hover':  { light: [38, 52], dark: [64, 69] },
    'color-primary-active': { light: [38, 38], dark: [55, 57] },
    'color-primary-subtle': { light: [30, 95], dark: [36, 18] },
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
    'text-link':            { light: [38, 45], dark: [59, 64] },
    'syntax-heading':       { light: [38, 45], dark: [59, 64] },
    'syntax-bold':          { light: [13, 16], dark: [40, 93] },
    'syntax-italic':        { light: [13, 16], dark: [40, 93] },
    'syntax-code':          { light: [38, 45], dark: [59, 64] },
    'syntax-fence':         { light: [8, 43],  dark: [11, 44] },
    'syntax-link':          { light: [38, 45], dark: [59, 64] },
    'syntax-image':         { light: [38, 45], dark: [80, 72] },
    'syntax-quote':         { light: [8, 43],  dark: [11, 44] },
    'syntax-list':          { light: [38, 45], dark: [59, 64] },
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
})();

/** Interpolate a single color role value */
const interpolateColor = (brightness, lightHsl, darkHsl) => {
  const [sLight, lLight] = lightHsl;
  const [sDark, lDark] = darkHsl;
  const sMid = (sLight + sDark) / 2;
  const lMid = 50;

  let s, l;

  if (brightness <= 25) {
    // Segment A (0) to LIGHT (25)
    // S: 0 -> sLight
    // L: 100 -> lLight
    const t = brightness / 25;
    s = t * sLight;
    l = 100 - t * (100 - lLight);
  } else if (brightness <= 50) {
    // Segment LIGHT (25) to B (50)
    // S: sLight -> sMid
    // L: lLight -> 50
    const t = (brightness - 25) / 25;
    s = sLight + t * (sMid - sLight);
    l = lLight + t * (lMid - lLight);
  } else if (brightness <= 75) {
    // Segment B (50) to DARK (75)
    // S: sMid -> sDark
    // L: 50 -> lDark
    const t = (brightness - 50) / 25;
    s = sMid + t * (sDark - sMid);
    l = lMid + t * (lDark - lMid);
  } else {
    // Segment DARK (75) to C (100)
    // S: sDark -> 0
    // L: lDark -> 0
    const t = (brightness - 75) / 25;
    s = sDark - t * sDark;
    l = lDark - t * lDark;
  }

  return [Math.round(s), Math.round(l)];
};

/** Apply brightness to the document root element */
export const applyBrightness = (brightness) => {
  const doc = document.documentElement;
  for (const [name, config] of Object.entries(COLOR_MAP)) {
    const [s, l] = interpolateColor(brightness, config.light, config.dark);
    doc.style.setProperty(`--${name}-s`, `${s}%`);
    doc.style.setProperty(`--${name}-l`, `${l}%`);
  }

  // Apply clamped variables to the settings popup to limit its slider response
  const clampedBrightness = Math.max(25, Math.min(75, brightness));
  const popupEl = document.getElementById('wrench-popup');
  if (popupEl) {
    for (const [name, config] of Object.entries(COLOR_MAP)) {
      const [s, l] = interpolateColor(clampedBrightness, config.light, config.dark);
      popupEl.style.setProperty(`--${name}`, `hsl(var(--hue), ${s}%, ${l}%)`);
    }
  }

  // Navbar logo: keep dark mode values (>=50), scale lightness to 75% at brightness 25 (<50). Clamped to [25, 75].
  let logoS, logoL;
  if (clampedBrightness >= 50) {
    [logoS, logoL] = interpolateColor(clampedBrightness, COLOR_MAP['color-primary'].light, COLOR_MAP['color-primary'].dark);
  } else {
    const t = Math.min(1, clampedBrightness / 25);
    logoS = Math.round(t * COLOR_MAP['color-primary'].light[0]);
    logoL = Math.round(50 + ((50 - clampedBrightness) / 50) * 50);
  }
  doc.style.setProperty('--nav-logo-color', `hsl(var(--hue), ${logoS}%, ${logoL}%)`);

  // Wrench icon / navbar icons:
  let iconS, iconL;
  if (brightness >= 50) {
    const clampedB = Math.min(75, brightness);
    [iconS, iconL] = interpolateColor(clampedB, COLOR_MAP['text-primary'].light, COLOR_MAP['text-primary'].dark);
  } else {
    const bVal = Math.max(0, brightness);
    iconS = COLOR_MAP['text-primary'].light[0];
    const t = Math.min(1, bVal / 25);
    iconL = Math.round(16 + t * (75 - 16));
  }
  doc.style.setProperty('--nav-icon-color', `hsl(var(--hue), ${iconS}%, ${iconL}%)`);

  // Gradual fade for Prism tokens at extreme brightness levels [0, 25] and [75, 100]
  let prismOpacity = 1.0;
  if (brightness < 25) {
    prismOpacity = brightness / 25;
  } else if (brightness > 75) {
    prismOpacity = (100 - brightness) / 25;
  }
  doc.style.setProperty('--prism-opacity', prismOpacity.toString());

  // Gradual fade for emojis at extreme brightness levels — native emoji
  // rendering ignores CSS color, so we opacity-fade them at the extremes.
  let emojiOpacity = 1.0;
  if (brightness < 25) {
    emojiOpacity = brightness / 25;
  } else if (brightness > 75) {
    emojiOpacity = (100 - brightness) / 25;
  }
  doc.style.setProperty('--emoji-opacity', emojiOpacity.toString());

  // Directly apply opacity to all wrapped emojis in the DOM as a
  // cross-browser safety net — some environments render emoji glyphs
  // outside the normal CSS compositing pipeline.
  document.querySelectorAll('.emoji-wrapper').forEach(el => {
    el.style.opacity = emojiOpacity;
  });
};

