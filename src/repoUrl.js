/**
 * Repository URL handling utilities
 */

/**
 * Determine if URL is a GitHub repository object
 * @param {Object|string} repoUrl - Repository URL
 * @returns {boolean} Whether it's a GitHub repo object
 */
function isGithubRepoObject(repoUrl) {
  return typeof repoUrl === 'object' && repoUrl.host === 'github';
}

/**
 * Format repository URL for display
 * @param {Object|string} repoUrl - Repository URL
 * @returns {string} Formatted URL for display
 */
function formatRepoUrl(repoUrl) {
  if (isGithubRepoObject(repoUrl)) {
    return `https://github.com/${repoUrl.account}/${repoUrl.repo}`;
  }
  return repoUrl;
}

/**
 * Get standardized repository URL string
 * @param {Object|string} repoUrl - Repository URL
 * @returns {string} Standardized URL string
 */
function getRepoUrlString(repoUrl) {
  if (isGithubRepoObject(repoUrl)) {
    return `https://github.com/${repoUrl.account}/${repoUrl.repo}`;
  }
  return repoUrl;
}

// Export functions
module.exports.isGithubRepoObject = isGithubRepoObject;
module.exports.formatRepoUrl = formatRepoUrl;
module.exports.getRepoUrlString = getRepoUrlString;
