/**
 * Main analyzer module
 */

const fetcher = require('./fetcher');
const specConfig = require('./specConfig');
const repoUrl = require('./repoUrl');
const reporter = require('./reporter');
const formatter = require('./formatter');
const versionCheck = require('./versionCheck');

/**
 * Fetch and analyze HTML to extract repo URL
 * @param {string} url - URL to analyze
 * @returns {Promise<Object|string>} Repository URL
 */
async function fetchAndAnalyzeHtml(url) {
  // Check if the URL is already a GitHub repo URL
  if (url.includes('github.com')) {
    return url; // If it's already a GitHub URL, return it directly
  }
  
  try {
    const html = await fetcher.fetchIndexHtml(url);
    const repo = specConfig.extractRepoUrlFromSpecConfig(html);
    
    if (!repo) {
      throw new Error('Could not find specConfig.source in index.html');
    }
    
    return repo;
  } catch (error) {
    // If we can't fetch the HTML, assume the URL is the repo itself
    console.log(`Note: Treating ${url} as a repository URL directly`);
    return url;
  }
}

/**
 * Check for PDF and print status
 * @param {string} url - URL to check
 * @returns {Promise<void>}
 */
async function checkAndPrintPdfStatus(url) {
  try {
    const exists = await fetcher.checkIndexPdf(url);
    reporter.printPdfStatus(exists);
  } catch (error) {
    reporter.printPdfStatus(false, error);
  }
}

/**
 * Analyze a specification site
 * @param {string} normalizedUrl - The normalized URL to analyze
 * @returns {Promise<void>}
 */
async function analyzeSpec(normalizedUrl) {
  try {
    // Fetch and analyze HTML
    const repo = await fetchAndAnalyzeHtml(normalizedUrl);
    
    // Print repository information
    reporter.printRepositoryInfo(repo);
    
    // Check PDF existence
    await checkAndPrintPdfStatus(normalizedUrl);
    
    // Get and print spec-up-t version
    const repoUrlString = repoUrl.getRepoUrlString(repo);
    await reporter.fetchAndPrintVersion(repoUrlString);
    
    // Check for versions directory and count version subdirectories
    try {
      const versionInfo = await versionCheck.checkVersions(normalizedUrl);
      reporter.printVersionInfo(versionInfo);
    } catch (versionError) {
      console.error(formatter.format.error(`Error checking versions: ${versionError.message}`));
    }
    
  } catch (error) {
    console.error('\n' + formatter.format.error(`${error.message}\n`));
    process.exit(1);
  }
}

// Export functions
module.exports.analyzeSpec = analyzeSpec;
