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

module.exports = {
  getRawPackageJsonUrl,
  getRawPackageJsonUrls,
  fetchJson,
  getSpecUpTVersionFromPackageJson
};
