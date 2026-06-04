/**
 * @file color-engine.js
 * HUE-based color palette engine.
 * All theme colors are derived from a single hue value (0–359).
 * Changing the hue triggers a CSS repaint via a single custom property update —
 * no DOM loops, no style recalculation beyond what the browser does naturally.
 */

const HUE_KEY = 'mdv_hue';
export const DEFAULT_HUE = 228;

/** Read the stored hue, or return the default. */
export let getHue = () => {
  let raw = localStorage.getItem(HUE_KEY);
  return raw !== null ? parseInt(raw, 10) : DEFAULT_HUE;
};

/**
 * Apply a hue to the document root.
 * Hot path — called on every slider input event.
 * @param {number|string} hue - Integer 0–359
 */
export let applyHue = (hue) => {
  document.documentElement.style.setProperty('--hue', hue);
};

/** Persist the hue to localStorage. Call on pointer-up only, not during drag. */
export let saveHue = (hue) => {
  localStorage.setItem(HUE_KEY, hue);
};
