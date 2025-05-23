/**
 * Version checking module
 * Checks for the existence of a versions directory and counts v* subdirectories
 */

const https = require('https');
const url = require('url');
const path = require('path');

/**
 * Checks if there's a versions directory in the same directory as index.html
 * @param {string} baseUrl - The base URL where index.html is located
 * @returns {Promise<{exists: boolean, count: number, versions: string[]}>} Result object with existence flag and version info
 */
async function checkVersions(baseUrl) {
  // Normalize URL to ensure it ends with a trailing slash
  const normalizedUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  
  // Construct URL for the versions directory
  const versionsUrl = new URL('versions/', normalizedUrl).toString();
  
  try {
    // First check if the versions directory exists
    const versionsExists = await checkDirectoryExists(versionsUrl);
    
    if (!versionsExists) {
      return {
        exists: false,
        count: 0,
        versions: []
      };
    }
    
    // If versions directory exists, try to list its contents to find v* subdirectories
    const versionDirs = await listVersionDirectories(versionsUrl);
    
    return {
      exists: true,
      count: versionDirs.length,
      versions: versionDirs
    };
  } catch (error) {
    console.error('Error checking versions:', error.message);
    return {
      exists: false,
      count: 0,
      versions: [],
      error: error.message
    };
  }
}

/**
 * Checks if a directory exists by making a HEAD request
 * @param {string} url - URL of the directory
 * @returns {Promise<boolean>} Whether the directory exists
 */
function checkDirectoryExists(url) {
  return new Promise((resolve) => {
    const req = https.request(url, { method: 'HEAD' }, (res) => {
      // Status codes 200, 301, 302 indicate the directory exists
      resolve(res.statusCode >= 200 && res.statusCode < 400);
    });
    
    req.on('error', () => {
      resolve(false);
    });
    
    req.end();
  });
}

/**
 * Lists subdirectories in the versions directory that match v* pattern
 * Note: This is a simplified approach and may not work for all web servers
 * More reliable implementation would require server-side directory listing
 * or specific knowledge of the repository structure
 * @param {string} versionsUrl - URL of the versions directory
 * @returns {Promise<string[]>} Array of version directory names (e.g., ['v1', 'v2'])
 */
async function listVersionDirectories(versionsUrl) {
  // This is a heuristic approach - try common version patterns sequentially
  const versionDirs = [];
  
  // Check for directories v1 through v20 (arbitrary upper limit)
  for (let i = 1; i <= 20; i++) {
    const versionUrl = new URL(`v${i}/`, versionsUrl).toString();
    const exists = await checkDirectoryExists(versionUrl);
    
    if (exists) {
      versionDirs.push(`v${i}`);
    } else {
      // Stop checking after first missing version
      // This assumes versions are sequential without gaps
      // Remove this break if versions might have gaps
      break;
    }
  }
  
  return versionDirs;
}

/**
 * Format version information for display
 * @param {Object} versionInfo - Version information object
 * @returns {string} Formatted string for display
 */
function formatVersionInfo(versionInfo) {
  if (!versionInfo.exists) {
    return 'No versions directory found.';
  }
  
  const versionCount = versionInfo.count;
  const versions = versionInfo.versions.join(', ');
  
  return `Versions directory exists with ${versionCount} version${versionCount !== 1 ? 's' : ''}: ${versions}`;
}

module.exports = {
  checkVersions,
  formatVersionInfo
};
