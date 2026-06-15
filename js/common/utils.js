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
export const escapeHtml = (value) => {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
};

/**
 * Strips Windows carriage returns (\r) from a string.
 * Use this to normalize markdown before processing or offset calculation.
 * @param {string} str - Raw string potentially containing \r\n line endings
 * @returns {string} String with all \r characters removed
 */
export const stripCR = (str) => str.replace(/\r/g, '');
