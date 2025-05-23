// pdfCheck.js
// Checks if index.pdf exists next to index.html at a given base URL

const https = require('https');
const http = require('http');

/**
 * Checks if index.pdf exists at the given URL (callback style)
 * @param {string} baseUrl - Base URL where index.pdf would be located
 * @param {function} callback - Callback function with (error, exists) parameters
 */
function checkIndexPdfExists(baseUrl, callback) {
  const url = baseUrl.replace(/\/$/, '') + '/index.pdf';
  console.log(`Checking for PDF at: ${url}`);

  // Choose the appropriate protocol handler
  const handler = url.startsWith('https:') ? https : http;
  
  const req = handler.get(url, (res) => {
    // 200 means file exists, 404 means not found
    res.resume(); // Always consume response to free up memory
    
    if (res.statusCode === 200) {
      callback(null, true);
    } else if (res.statusCode === 404) {
      callback(null, false);
    } else if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      // Handle redirects
      console.log(`Following redirect to: ${res.headers.location}`);
      const redirectUrl = new URL(res.headers.location, url).href;
      checkIndexPdfExists(redirectUrl, callback);
    } else {
      callback(new Error(`Unexpected status code: ${res.statusCode} (${res.statusMessage || 'Unknown'})`));
    }
  }).on('error', err => {
    console.log(`Error checking for PDF: ${err.message}`);
    callback(err);
  });
  
  // Set a timeout to avoid hanging
  req.setTimeout(10000, () => {
    req.abort();
    callback(new Error('Timeout when checking for PDF'));
  });
}

module.exports = { checkIndexPdfExists };
