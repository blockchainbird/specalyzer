#!/usr/bin/env node

// Get the argument (URL or domain)
const input = process.argv[2];

if (!input) {
  console.error('Usage: npx specalyzer <url>');
  process.exit(1);
}

// Normalize input to a valid URL
function normalizeUrl(str) {
  let url = str.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }
  // Remove trailing slash
  url = url.replace(/\/$/, '');
  return url;
}

const normalizedUrl = normalizeUrl(input);
console.log(`Normalized URL: ${normalizedUrl}`);

const https = require('https');
const { JSDOM } = require('jsdom');
const vm = require('vm');
const specupVersion = require('./specupVersion');

function fetchIndexHtml(url, callback) {
  https.get(url + '/index.html', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => callback(null, data));
  }).on('error', err => callback(err));
}

function extractRepoUrlFromSpecConfig(html) {
  const dom = new JSDOM(html);
  const scripts = dom.window.document.querySelectorAll('script');
  for (const script of scripts) {
    if (!script.textContent.includes('window.specConfig')) continue;
    try {
      const sandbox = { window: {} };
      vm.createContext(sandbox);
      vm.runInContext(script.textContent, sandbox);
      const config = sandbox.window.specConfig;
      if (config && config.source) return config.source;
    } catch (e) {
      // Ignore and continue
    }
  }
  return null;
}

fetchIndexHtml(normalizedUrl, (err, html) => {
  if (err) {
    console.error('Failed to fetch index.html:', err.message);
    process.exit(1);
  }
  const repoUrl = extractRepoUrlFromSpecConfig(html);
  if (repoUrl) {
    console.log('Repository URL from specConfig.source:', repoUrl);
    // Use specupVersion module to get package.json and spec-up-t version
    const repoUrlString = typeof repoUrl === 'object' && repoUrl.host === 'github'
      ? `https://github.com/${repoUrl.account}/${repoUrl.repo}`
      : repoUrl;
    const pkgUrl = specupVersion.getRawPackageJsonUrl(repoUrlString);
    if (!pkgUrl) {
      console.error('Could not construct raw package.json URL from repo URL.');
      process.exit(1);
    }
    specupVersion.fetchJson(pkgUrl, (err, pkg) => {
      if (err) {
        console.error('Failed to fetch package.json:', err.message);
        process.exit(1);
      }
      const version = specupVersion.getSpecUpTVersionFromPackageJson(pkg);
      if (version) {
        console.log('spec-up-t version in package.json:', version);
      } else {
        console.log('spec-up-t is not listed as a dependency in package.json');
      }
    });
  } else {
    console.error('Could not find specConfig.source in index.html');
    process.exit(1);
  }
});
