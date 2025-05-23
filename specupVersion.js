// specupVersion.js
// Given a repository URL, fetch its package.json and extract the spec-up-t version

const https = require('https');

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
