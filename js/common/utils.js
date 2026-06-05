/**
 * @file utils.js
 * General-purpose string utilities shared across all modules.
 */

/**
 * Escapes HTML special characters in a string to prevent XSS injection.
 * Hot path — called on every render cycle.
 * @param {string} value - Raw string
 * @returns {string} HTML-safe string
 */
export let escapeHtml = (value) => {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
};
