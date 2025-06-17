/**
 * Main analyzer module
 */

const fetcher = require('./fetcher');
const specConfig = require('./specConfig');
const repoUrl = require('./repoUrl');
const reporter = require('./reporter');
const formatter = require('./formatter');
const versionCheck = require('./versionCheck');
const specupVersion = require('./specupVersion');
// Import the HTML reporter module
const htmlReporter = require('./htmlReporter');

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
    
    // Ensure we return a string URL
    if (typeof repo === 'string') {
      return repo;
    } else if (typeof repo === 'object' && repo !== null) {
      // Try to extract URL from the object
      const repoUrl = repo.url || repo.html_url || repo.git_url;
      if (repoUrl && typeof repoUrl === 'string') {
        return repoUrl;
      }
      // If we couldn't extract a URL string, return the original URL
      return url;
    } else {
      // If repo is neither string nor object, return the original URL
      return url;
    }
  } catch (error) {
    // If we can't fetch the HTML, assume the URL is the repo itself
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
    // reporter.printPdfStatus(exists); // Removed console reporting
  } catch (error) {
    // reporter.printPdfStatus(false, error); // Removed console reporting
  }
}

/**
 * Analyze a specification site
 * @param {string} normalizedUrl - The normalized URL to analyze
 * @param {Object} options - Analysis options
 * @returns {Promise<Object>} Analysis results
 */
async function analyzeSpec(normalizedUrl, options = {}) {
  const result = {
    repo: null,
    pdfExists: false,
    pdfError: null,
    specUpVersion: null,
    isUsingSpecUp: false, // New field for spec-up (original) detection
    specUpOriginalVersion: null, // Version if using original spec-up
    versionInfo: null,
    lastModified: null,
    headers: null,
    error: null
  };
  
  try {
    // Get the last modified date
    try {
      const lastModifiedInfo = await fetcher.getLastModified(normalizedUrl);
      result.lastModified = lastModifiedInfo.date;
      result.headers = lastModifiedInfo.headers;
    } catch (error) {
      // Do not log to console, allow HTML report to show this
    }
    
    // Fetch and analyze HTML
    const repo = await fetchAndAnalyzeHtml(normalizedUrl);
    result.repo = repo;
    
    // Check PDF existence
    try {
      const exists = await fetcher.checkIndexPdf(normalizedUrl);
      result.pdfExists = exists;
    } catch (pdfError) {
      result.pdfError = pdfError;
    }
    
    // Get and print spec-up-t version
    const repoUrlString = repoUrl.getRepoUrlString(repo);
    
    try {
      // Get possible URLs for package.json (main and master branches)
      const pkgUrls = specupVersion.getRawPackageJsonUrls(repoUrlString);
      
      if (!pkgUrls || pkgUrls.length === 0) {
        throw new Error('Could not construct raw package.json URL from repo URL.');
      }
      
      // Try each URL in sequence until one works
      let pkg = null;
      let lastError = null;
      
      for (const pkgUrl of pkgUrls) {
        try {
          pkg = await fetcher.fetchPackageJson(pkgUrl);
          // If we got here, we successfully fetched the package.json
          break;
        } catch (err) {
          // Store the error and try the next URL
          lastError = err;
        }
      }
      
      if (pkg) {
        // Check if using original spec-up
        const isUsingSpecUp = specupVersion.isUsingSpecUp(pkg);
        result.isUsingSpecUp = isUsingSpecUp;
        
        if (isUsingSpecUp) {
          // Get the original spec-up version
          const originalVersion = specupVersion.getSpecUpVersionFromPackageJson(pkg);
          result.specUpOriginalVersion = originalVersion;
        } else {
          // Check for spec-up-t version as before
          const version = specupVersion.getSpecUpTVersionFromPackageJson(pkg);
          result.specUpVersion = version;
        }
      }
    } catch (versionError) {
      // Version error will be shown in HTML report
    }
    
    // Check for versions directory and count version subdirectories
    try {
      const versionInfo = await versionCheck.checkVersions(normalizedUrl);
      result.versionInfo = versionInfo;
    } catch (versionError) {
      // Version check error will be shown in HTML report
    }
    
    return result;
  } catch (error) {
    result.error = error;
    
    if (!options.suppressExit) {
      process.exit(1);
    }
    
    return result;
  }
}

/**
 * Generate HTML report for spec analysis
 * @param {string} normalizedUrl - The normalized URL to analyze
 * @param {string} version - Specalyzer version
 * @returns {Promise<string>} Path to generated HTML file
 */
async function generateHtmlReport(normalizedUrl, version) {
  const result = await analyzeSpec(normalizedUrl, { htmlOnly: true, suppressExit: true });
  
  // Generate HTML parts
  let html = htmlReporter.generateHtmlBoilerplate('Specalyzer Report', normalizedUrl);
  
  // Repository section
  if (result.repo) {
    // Make sure we're using the repoUrl module to format the repository URL consistently
    html += htmlReporter.createCardSection(
      'Repository',
      htmlReporter.formatRepositoryInfo(result.repo),
      'primary'
    );
  }
  
  // Last modified info section
  if (result.lastModified) {
    html += htmlReporter.createCardSection(
      'Last Updated',
      htmlReporter.formatLastModified(result.lastModified, result.headers),
      'secondary'
    );
  }
  
  // PDF status section
  const pdfStatus = result.pdfExists ? 'success' : 'warning';
  html += htmlReporter.createCardSection(
    'PDF Status',
    htmlReporter.formatPdfStatus(result.pdfExists, result.pdfError),
    pdfStatus
  );
  
  // Build tool version section (either spec-up-t or original spec-up)
  if (result.isUsingSpecUp) {
    html += htmlReporter.createCardSection(
      'Build Tool Version (Original Spec-Up)',
      htmlReporter.formatSpecUpVersion(result.specUpOriginalVersion, true),
      'success'
    );
  } else {
    html += htmlReporter.createCardSection(
      'Build Tool Version (Spec-Up-T)',
      htmlReporter.formatSpecUpVersion(result.specUpVersion, false),
      'info'
    );
  }
  
  // Specification version history section
  if (result.versionInfo) {
    html += htmlReporter.createCardSection(
      'Specification Version History',
      htmlReporter.formatVersionInfo(result.versionInfo),
      'info'
    );
  }
  
  // Error section if needed
  if (result.error) {
    html += htmlReporter.createCardSection(
      'Error',
      `<div class="alert alert-danger">${result.error.message}</div>`,
      'danger'
    );
  }
  
  // Add footer
  html += htmlReporter.generateHtmlFooter(version, normalizedUrl);
  
  // Save to file and open in browser
  const filePath = await htmlReporter.saveAndOpenReport(html, normalizedUrl);
  
  return filePath;
}

// Export functions
module.exports.analyzeSpec = analyzeSpec;
module.exports.generateHtmlReport = generateHtmlReport;
