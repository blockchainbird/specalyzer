/**
 * HTTP utilities for fetching data
 */

const https = require('https');
const pdfCheck = require('./pdfCheck');
const specupVersion = require('./specupVersion');

/**
 * Fetches index.html from a URL
 * @param {string} url - The base URL to fetch from
 * @returns {Promise<string>} The HTML content
 */
function fetchIndexHtml(url) {
  return new Promise((resolve, reject) => {
    https.get(`${url}/index.html`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

/**
 * Checks if index.pdf exists at a URL
 * @param {string} url - The base URL to check
 * @returns {Promise<boolean>} Whether the PDF exists
 */
function checkIndexPdf(url) {
  return new Promise((resolve, reject) => {
    pdfCheck.checkIndexPdfExists(url, (err, exists) => {
      if (err) reject(err);
      else resolve(exists);
    });
  });
}

/**
 * Fetches and parses package.json from a URL
 * @param {string} url - The URL to the raw package.json
 * @returns {Promise<Object>} The parsed package.json
 */
function fetchPackageJson(url) {
  return new Promise((resolve, reject) => {
    specupVersion.fetchJson(url, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}

/**
 * Normalize input to a valid URL
 * @param {string} str - Input URL or domain
 * @returns {string} Normalized URL
 */
function normalizeUrl(str) {
  let url = str.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }
  return url.replace(/\/$/, ''); // Remove trailing slash
}

// Export functions directly from module
module.exports.fetchIndexHtml = fetchIndexHtml;
module.exports.checkIndexPdf = checkIndexPdf;
module.exports.fetchPackageJson = fetchPackageJson;
module.exports.normalizeUrl = normalizeUrl;
