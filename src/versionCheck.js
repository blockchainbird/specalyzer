/**
 * Version checking module
 * Checks for the existence of a versions directory and counts v* subdirectories
 */

const https = require('https');
const fetcher = require('./fetcher');
const chalk = require('chalk');

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
        versions: [],
        baseUrl: normalizedUrl  // Include the base URL for links
      };
    }
    
    // If versions directory exists, try to list its contents to find v* subdirectories
    const versionDirs = await listVersionDirectories(versionsUrl);
    
    return {
      exists: true,
      count: versionDirs.length,
      versions: versionDirs,
      baseUrl: baseUrl // Include the base URL for constructing version links
    };
  } catch (error) {
    console.error(chalk.red(`❌ Error checking versions: ${error.message}`));
    return {
      exists: false,
      count: 0,
      versions: [],
      error: error.message,
      baseUrl: normalizedUrl  // Include the base URL for links
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
    console.log(chalk.blue(`📁 Checking directory: ${url}`));
    const parsedUrl = new URL(url);
    
    // Choose the right module based on protocol
    const protocol = parsedUrl.protocol === 'https:' ? https : require('http');
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'HEAD',
      timeout: 5000 // 5 second timeout
    };
    
    const req = protocol.request(options, (res) => {
      // Status codes 200, 301, 302 indicate the directory exists
      const exists = res.statusCode >= 200 && res.statusCode < 400;
      console.log(chalk.cyan(`📂 Directory ${url}: ${exists ? 'exists' : 'does not exist'} (status: ${res.statusCode})`));
      resolve(exists);
    });
    
    req.on('error', (err) => {
      console.log(chalk.red(`❌ Error checking directory ${url}: ${err.message}`));
      resolve(false);
    });
    
    req.on('timeout', () => {
      console.log(chalk.yellow(`⏰ Timeout checking directory ${url}`));
      req.abort();
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
  console.log(chalk.magenta(`🔍 Checking for version directories at: ${versionsUrl}`));
  const versionDirs = [];
  let missingCount = 0;
  const maxMissingVersions = 3; // Allow up to 3 missing versions before stopping
  
  // First check for a GitHub repository structure if it's GitHub
  if (versionsUrl.includes('github.com')) {
    console.log(chalk.blue(`🐙 GitHub repository detected - checking for versions through GitHub API...`));
    // For GitHub, we'd need to use the GitHub API but we'll skip for now
  }
  
  // Check for common version patterns
  const versionPatterns = [
    // numeric versions from 1 to 20
    ...Array.from({length: 20}, (_, i) => `v${i+1}`),
    // semantic versions
    '1.0', 'v1.0', 'v1.0.0',
    '2.0', 'v2.0', 'v2.0.0',
    // other common patterns
    'latest', 'stable', 'current', 'next', 'beta'
  ];
  
  for (const vPattern of versionPatterns) {
    const versionUrl = new URL(`${vPattern}/`, versionsUrl).toString();
    const exists = await checkDirectoryExists(versionUrl);
    
    if (exists) {
      versionDirs.push(vPattern);
      missingCount = 0; // Reset missing count when we find a directory
    } else {
      missingCount++;
      if (missingCount >= maxMissingVersions) {
        // Stop checking after several consecutive missing versions
        break;
      }
    }
  }
  
  return versionDirs;
}

/**
 * Format specification version history information for display
 * @param {Object} versionInfo - Version information object
 * @returns {string} Formatted string for display
 */
function formatVersionInfo(versionInfo) {
  if (!versionInfo.exists) {
    return 'No specification version history found. This specification does not have archived versions available.';
  }
  
  const versionCount = versionInfo.count;
  const versions = versionInfo.versions.join(', ');
  
  return `Specification version history found: ${versionCount} archived version${versionCount !== 1 ? 's' : ''} available (${versions})`;
}

module.exports = {
  checkVersions,
  formatVersionInfo
};
