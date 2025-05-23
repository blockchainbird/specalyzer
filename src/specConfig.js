/**
 * Spec config extraction utilities
 */

const { JSDOM } = require('jsdom');
const vm = require('vm');

/**
 * Find script containing specConfig
 * @param {NodeList} scripts - List of script elements
 * @returns {Element|null} The script element or null
 */
function findSpecConfigScript(scripts) {
  for (const script of scripts) {
    if (script.textContent.includes('window.specConfig')) {
      return script;
    }
  }
  return null;
}

/**
 * Extract config object from script element
 * @param {Element} script - Script element
 * @returns {Object|null} The specConfig object or null
 */
function extractConfigFromScript(script) {
  try {
    const sandbox = { window: {} };
    vm.createContext(sandbox);
    vm.runInContext(script.textContent, sandbox);
    
    return sandbox.window.specConfig;
  } catch (e) {
    return null;
  }
}

/**
 * Extract repository URL from spec config
 * @param {string} html - HTML content
 * @returns {Object|string|null} Repository URL or null
 */
function extractRepoUrlFromSpecConfig(html) {
  const dom = new JSDOM(html);
  const scripts = dom.window.document.querySelectorAll('script');
  
  const specConfigScript = findSpecConfigScript(scripts);
  if (!specConfigScript) return null;
  
  const config = extractConfigFromScript(specConfigScript);
  return (config && config.source) ? config.source : null;
}

// Export functions
module.exports.extractRepoUrlFromSpecConfig = extractRepoUrlFromSpecConfig;
