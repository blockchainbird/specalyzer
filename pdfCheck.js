// pdfCheck.js
// Checks if index.pdf exists next to index.html at a given base URL

const https = require('https');

function checkIndexPdfExists(baseUrl, callback) {
  const url = baseUrl.replace(/\/$/, '') + '/index.pdf';
  https.get(url, (res) => {
    // 200 means file exists, 404 means not found
    res.resume(); // Always consume response to free up memory
    if (res.statusCode === 200) {
      callback(null, true);
    } else if (res.statusCode === 404) {
      callback(null, false);
    } else {
      callback(new Error('Unexpected status code: ' + res.statusCode));
    }
  }).on('error', err => callback(err));
}

module.exports = { checkIndexPdfExists };
