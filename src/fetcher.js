/**
 * HTTP utilities for fetching data
 */

const https = require('https');
const pdfCheck = require('./pdfCheck');
const specupVersion = require('./specupVersion');
const chalk = require('chalk');

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
    console.log(chalk.cyan(`📄 Fetching package.json from: ${url}`));
    specupVersion.fetchJson(url, (err, data) => {
      if (err) {
        // Don't log 404 errors as they're expected when trying different branches
        if (!err.message.includes('HTTP Error: 404')) {
          console.log(chalk.red(`❌ Error fetching package.json: ${err.message}`));
        }
        reject(err);
      } else {
        console.log(chalk.green(`✅ Successfully fetched package.json from: ${url}`));
        resolve(data);
      }
    });
  });
}

/**
 * Gets the last modified date for a URL
 * @param {string} url - The URL to check
 * @returns {Promise<{date: Date|null, headers: Object}>} The last modified date and response headers
 */
function getLastModified(url) {
  return new Promise((resolve, reject) => {
    const requestUrl = url.endsWith('/') ? url : `${url}/`;
    const options = {
      method: 'HEAD'
    };

    https.get(requestUrl, options, (res) => {
      const headers = res.headers;
      let lastModified = null;
      
      // Try to get Last-Modified header
      if (headers['last-modified']) {
        lastModified = new Date(headers['last-modified']);
      }
      
      resolve({
        date: lastModified,
        headers: headers
      });
    }).on('error', (err) => {
      // Don't fail the whole process for this, just return null
      console.error(chalk.red(`⚠️  Error getting last modified date: ${err.message}`));
      resolve({
        date: null,
        headers: {}
      });
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
module.exports.getLastModified = getLastModified;
module.exports.normalizeUrl = normalizeUrl;
