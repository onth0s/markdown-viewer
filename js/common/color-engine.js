/**
 * @file color-engine.js
 * HUE-based color palette engine.
 * All theme colors are derived from a single hue value (0–359).
 * Changing the hue triggers a CSS repaint via a single custom property update —
 * no DOM loops, no style recalculation beyond what the browser does naturally.
 *
 * Storage (getHue/saveHue/DEFAULT_HUE) is centralized in storage.js.
 */

export { getHue, saveHue, DEFAULT_HUE } from './storage.js';

/**
 * Apply a hue to the document root.
 * Hot path — called on every slider input event.
 * @param {number|string} hue - Integer 0–359
 */
export const applyHue = (hue) => {
  document.documentElement.style.setProperty('--hue', hue);
};
