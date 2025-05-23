// specupVersion.js
// Given a repository URL, fetch its package.json and extract the spec-up-t version

const https = require('https');

/**
 * Constructs a URL for the raw package.json file from a GitHub repository URL
 * @param {string} repoUrl - The GitHub repository URL
 * @returns {string|null} The raw URL for package.json or null if not a GitHub repo
 */
function getRawPackageJsonUrl(repoUrl) {
  // Support GitHub only for now
  // Accepts: https://github.com/org/repo or https://github.com/org/repo.git
  const m = repoUrl.match(/^https:\/\/github.com\/([^\/]+)\/([^\/\.]+)(?:\.git)?/);
  if (!m) return null;
  
  const org = m[1];
  const repo = m[2];
  // Default branch: main
  return `https://raw.githubusercontent.com/${org}/${repo}/main/package.json`;
}

/**
 * Fetches and parses JSON from a URL (callback style)
 * @param {string} url - The URL to fetch JSON from
 * @param {function} callback - Callback with (error, jsonData) parameters
 */
function fetchJson(url, callback) {
  https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        callback(null, JSON.parse(data));
      } catch (e) {
        callback(e);
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
  fetchJson,
  getSpecUpTVersionFromPackageJson
};
