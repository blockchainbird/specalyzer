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
const pdfCheck = require('./pdfCheck');

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
    console.error('\n\x1b[31m[ERROR]\x1b[0m Failed to fetch index.html:', err.message, '\n');
    process.exit(1);
  }
  const repoUrl = extractRepoUrlFromSpecConfig(html);
  if (repoUrl) {
    console.log('\n\x1b[36m==============================\x1b[0m');
    console.log('\x1b[1mSpecalyzer Report\x1b[0m');
    console.log('\x1b[36m==============================\x1b[0m\n');
    console.log('\x1b[33m[Repository]\x1b[0m');
    console.log('  ', repoUrl);
    // Check for index.pdf
    pdfCheck.checkIndexPdfExists(normalizedUrl, (err, exists) => {
      if (err) {
        console.log('\x1b[31m[PDF]\x1b[0m   Error checking for index.pdf:', err.message);
      } else if (exists) {
        console.log('\x1b[32m[PDF]\x1b[0m   index.pdf exists next to index.html');
      } else {
        console.log('\x1b[33m[PDF]\x1b[0m   index.pdf does NOT exist next to index.html');
      }
      // Use specupVersion module to get package.json and spec-up-t version
      const repoUrlString = typeof repoUrl === 'object' && repoUrl.host === 'github'
        ? `https://github.com/${repoUrl.account}/${repoUrl.repo}`
        : repoUrl;
      const pkgUrl = specupVersion.getRawPackageJsonUrl(repoUrlString);
      if (!pkgUrl) {
        console.error('\x1b[31m[ERROR]\x1b[0m Could not construct raw package.json URL from repo URL.');
        process.exit(1);
      }
      specupVersion.fetchJson(pkgUrl, (err, pkg) => {
        if (err) {
          console.error('\x1b[31m[ERROR]\x1b[0m Failed to fetch package.json:', err.message);
          process.exit(1);
        }
        const version = specupVersion.getSpecUpTVersionFromPackageJson(pkg);
        if (version) {
          console.log('\x1b[34m[spec-up-t]\x1b[0m version in package.json: \x1b[1m' + version + '\x1b[0m');
        } else {
          console.log('\x1b[34m[spec-up-t]\x1b[0m is not listed as a dependency in package.json');
        }
        console.log('\n\x1b[36m==============================\x1b[0m\n');
      });
    });
  } else {
    console.error('\n\x1b[31m[ERROR]\x1b[0m Could not find specConfig.source in index.html\n');
    process.exit(1);
  }
});
