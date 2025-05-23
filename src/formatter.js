/**
 * Formatting utilities for console output
 */

// Console formatting colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

/**
 * Apply color to text
 * @param {string} color - Color name
 * @param {string} text - Text to colorize
 * @returns {string} Colorized text
 */
function colorize(color, text) {
  return `${colors[color]}${text}${colors.reset}`;
}

/**
 * Format a color-tagged message
 * @param {string} color - Color name 
 * @param {string} label - Message label
 * @param {string} msg - Message content
 * @returns {string} Formatted message
 */
function formatMessage(color, label, msg) {
  return `${colorize(color, `[${label}]`)} ${msg}`;
}

// Formatted output helpers
const format = {
  error: (msg) => formatMessage('red', 'ERROR', msg),
  info: (label, msg) => formatMessage('blue', label, msg),
  success: (label, msg) => formatMessage('green', label, msg),
  warning: (label, msg) => formatMessage('yellow', label, msg),
  header: (msg) => `\n${colorize('cyan', '==============================')}
${colorize('bold', msg)}
${colorize('cyan', '==============================')}
`
};

// Export modules
module.exports.colors = colors;
module.exports.colorize = colorize;
module.exports.format = format;
