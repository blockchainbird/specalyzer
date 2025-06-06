// specupVersion.js
// Given a repository URL, fetch its package.json and extract the spec-up-t version

const https = require('https');

/**
 * Constructs URLs for the raw package.json file from a GitHub repository URL
 * Tries both main and master branches
 * @param {string} repoUrl - The GitHub repository URL
 * @returns {Array<string>|null} Array of raw URLs for package.json or null if not a GitHub repo
 */
function getRawPackageJsonUrls(repoUrl) {
  // Support GitHub only for now
  // Accepts: https://github.com/org/repo or https://github.com/org/repo.git
  const m = repoUrl.match(/^https:\/\/github.com\/([^\/]+)\/([^\/\.]+)(?:\.git)?/);
  if (!m) return null;
  
  const org = m[1];
  const repo = m[2];

  // Return URLs for both main and master branches
  return [
    `https://raw.githubusercontent.com/${org}/${repo}/main/package.json`,
    `https://raw.githubusercontent.com/${org}/${repo}/master/package.json`
  ];
}

/**
 * Constructs a URL for the raw package.json file from a GitHub repository URL
 * @param {string} repoUrl - The GitHub repository URL
 * @returns {string|null} The raw URL for package.json or null if not a GitHub repo
 * @deprecated Use getRawPackageJsonUrls instead
 */
function getRawPackageJsonUrl(repoUrl) {
  const urls = getRawPackageJsonUrls(repoUrl);
  return urls ? urls[0] : null; // Return the first URL (main branch) for backward compatibility
}

/**
 * Fetches and parses JSON from a URL (callback style)
 * @param {string} url - The URL to fetch JSON from
 * @param {function} callback - Callback with (error, jsonData) parameters
 */
function fetchJson(url, callback) {
  https.get(url, (res) => {
    // Check if the response is successful
    if (res.statusCode >= 400) {
      return callback(new Error(`HTTP Error: ${res.statusCode}`));
    }
    
    // Check content type to ensure it's JSON
    const contentType = res.headers['content-type'];
    if (contentType && !contentType.includes('application/json') && !contentType.includes('text/plain')) {
      return callback(new Error(`Invalid content type: ${contentType}`));
    }
    
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        // Trim the data to remove any whitespace before parsing
        const trimmedData = data.trim();
        if (!trimmedData) {
          return callback(new Error('Empty response received'));
        }
        callback(null, JSON.parse(trimmedData));
      } catch (e) {
        callback(new Error(`JSON parsing error: ${e.message}`));
      }
    });
  }).on('error', err => callback(err));
}

/**
 * Extracts the spec-up-t version from package.json data
 * @param {Object} pkg - The parsed package.json data
 * @param {string} depName - The dependency name to look for (default: 'spec-up-t')
 * @returns {string|null} The version string or null if not found
 */
function getSpecUpTVersionFromPackageJson(pkg, depName = 'spec-up-t') {
  if (!pkg) return null;
  
  return (
    (pkg.dependencies && pkg.dependencies[depName]) ||
    (pkg.devDependencies && pkg.devDependencies[depName]) ||
    null
  );
}

/**
 * Determines if a repository is using the original spec-up instead of spec-up-t
 * Detection hierarchy:
 * 1. First confirms it's NOT spec-up-t by checking dependencies
 * 2. Checks if package name is explicitly "spec-up"
 * 3. Looks for characteristic spec-up script patterns
 * 4. Analyzes dependency patterns typical of original spec-up
 * 5. Checks repository URL as a fallback
 * 
 * @param {Object} pkg - The parsed package.json data
 * @returns {boolean} True if using original spec-up, false if not
 */
function isUsingSpecUp(pkg) {
  if (!pkg) return false;
  
  // First, check if it's definitely spec-up-t
  // If it has spec-up-t as a dependency, then it's NOT original spec-up
  if ((pkg.dependencies && pkg.dependencies['spec-up-t']) || 
      (pkg.devDependencies && pkg.devDependencies['spec-up-t'])) {
    return false;
  }
  
  // Method 1: Check if the package name is explicitly "spec-up"
  if (pkg.name === 'spec-up') {
    return true;
  }
  
  // Method 2: Check for characteristic spec-up scripts
  if (pkg.scripts) {
    const hasSpecUpScripts = !!(
      (pkg.scripts.edit && pkg.scripts.edit.includes('node -e \"require(\'./index\')')) ||
      (pkg.scripts.render && pkg.scripts.render.includes('node -e \"require(\'./index\')'))
    );
    
    if (hasSpecUpScripts) {
      return true;
    }
  }
  
  // Method 3: Check for spec-up characteristic dependencies pattern
  // Original spec-up has a very specific set of direct dependencies
  if (pkg.dependencies) {
    // Need to have at least these core dependencies to be considered spec-up
    const hasSpecUpCoreDeps = !!(
      pkg.dependencies['markdown-it'] && 
      pkg.dependencies['gulp'] &&
      pkg.dependencies['markdown-it-anchor'] &&
      pkg.dependencies['markdown-it-attrs']
    );
    
    // Count how many of the characteristic spec-up dependencies are present
    const specUpTypicalDeps = [
      'markdown-it-chart', 'markdown-it-container', 'markdown-it-deflist',
      'markdown-it-icons', 'markdown-it-ins', 'markdown-it-mark',
      'markdown-it-modify-token', 'markdown-it-multimd-table', 'markdown-it-prism',
      'markdown-it-references', 'markdown-it-sub', 'markdown-it-sup',
      'markdown-it-task-lists', 'markdown-it-textual-uml', 'markdown-it-toc-and-anchor',
      'merge-stream', 'pkg-dir', 'prismjs', 'yargs',
      'gulp-clean-css', 'gulp-concat', 'gulp-terser',
      'axios', 'fs-extra'
    ];
    
    let depMatchCount = 0;
    for (const dep of specUpTypicalDeps) {
      if (pkg.dependencies[dep]) {
        depMatchCount++;
      }
    }
    
    // If it has the core dependencies and at least 10 of the typical dependencies,
    // it's very likely to be spec-up
    if (hasSpecUpCoreDeps && depMatchCount >= 10) {
      return true;
    }
  }
  
  // Method 4: Check if repository URL references spec-up repository
  // This is less reliable but useful as a secondary indicator
  const hasSpecUpRepo = !!(
    pkg.repository &&
    typeof pkg.repository === 'object' &&
    pkg.repository.url &&
    pkg.repository.url.includes('github.com/decentralized-identity/spec-up')
  );
  
  return hasSpecUpRepo;
}

/**
 * Extracts the original spec-up version from package.json data
 * Version detection methods (in order of reliability):
 * 1. Package's own version if name is "spec-up"
 * 2. Version tag in repository URL
 * 3. Package version with prefix if dependency pattern matches spec-up
 * 
 * @param {Object} pkg - The parsed package.json data
 * @returns {string|null} The version string or null if not found
 */
function getSpecUpVersionFromPackageJson(pkg) {
  if (!pkg) return null;
  
  // Primary method: If the package itself is spec-up, use its version
  // This is the most reliable case for spec-up repositories
  if (pkg.name === 'spec-up' && pkg.version) {
    return pkg.version;
  }
  
  // Secondary method: Try to extract from repository URL if it's pointing to a specific version/tag
  // This can be useful for repositories that clone spec-up but don't change the repo URL
  if (pkg.repository && 
      typeof pkg.repository === 'object' && 
      pkg.repository.url) {
    
    const repoUrl = pkg.repository.url;
    // Look for version tags in URL like "/v0.10.6" or similar patterns
    const versionMatch = repoUrl.match(/\/v(\d+\.\d+\.\d+)/);
    if (versionMatch && versionMatch[1]) {
      return versionMatch[1];
    }
  }
  
  // Last resort: If we're confident it's spec-up (based on dependencies pattern)
  // but can't determine the version, check for spec-up-related version info
  if (pkg.dependencies && pkg.dependencies['markdown-it'] && 
      pkg.dependencies['gulp'] && pkg.version) {
    // Return the package version with a note that it's approximate
    return `~${pkg.version}`;
  }
  
  return null;
}

module.exports = {
  getRawPackageJsonUrl,
  getRawPackageJsonUrls,
  fetchJson,
  getSpecUpTVersionFromPackageJson,
  isUsingSpecUp,
  getSpecUpVersionFromPackageJson
};
