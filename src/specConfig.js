/**
 * Spec config extraction utilities
 */

const { JSDOM } = require('jsdom');
const vm = require('vm');
const chalk = require('chalk');

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
 * @returns {string|null} Repository URL or null
 */
function extractRepoUrlFromSpecConfig(html) {
  const dom = new JSDOM(html);
  const scripts = dom.window.document.querySelectorAll('script');
  
  const specConfigScript = findSpecConfigScript(scripts);
  if (!specConfigScript) return null;
  
  const config = extractConfigFromScript(specConfigScript);
  if (!config || !config.source) return null;
  
  // Handle different formats of specConfig.source
  if (typeof config.source === 'string') {
    // If it's already a string URL, return it
    return config.source;
  } else if (typeof config.source === 'object') {
    // Object format could be:
    // 1. { url: 'https://github.com/...' }
    if (config.source.url) {
      return config.source.url;
    }
    
    // 2. { host: 'github', account: 'org', repo: 'repo' }
    if (config.source.host && config.source.account && config.source.repo) {
      // Currently support only github
      if (config.source.host.toLowerCase() === 'github') {
        const url = `https://github.com/${config.source.account}/${config.source.repo}`;
        console.log(chalk.green(`🔗 Constructed GitHub URL: ${url}`));
        return url;
      }
    }
  }
  
  // If we couldn't extract a URL, return null
  return null;
}

// Export functions
module.exports.extractRepoUrlFromSpecConfig = extractRepoUrlFromSpecConfig;
