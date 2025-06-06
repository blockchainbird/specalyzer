/**
 * HTML Report Generator Module
 * Provides functions to generate formatted HTML reports for spec analysis
 */

const fs = require('fs');
const path = require('path');
const open = require('open');
const chalk = require('chalk');
const formatter = require('./formatter');
const repoUrl = require('./repoUrl');

/**
 * Generate HTML boilerplate with Bootstrap styling
 * @param {string} title - The title of the HTML page
 * @param {string} url - The URL being analyzed
 * @returns {string} HTML boilerplate string
 */
function generateHtmlBoilerplate(title, url) {
  const timestamp = new Date().toLocaleString();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🔍</text></svg>">
  <style>
    body {
      padding: 2rem;
      background-color: #f8f9fa;
    }
    .card {
      margin-bottom: 1.5rem;
      box-shadow: 0 0.25rem 0.5rem rgba(0,0,0,0.05);
      border-radius: 0.5rem;
      overflow: hidden;
      transition: transform 0.2s;
    }
    .card:hover {
      transform: translateY(-3px);
    }
    .card-header {
      font-weight: bold;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .report-header {
      margin-bottom: 2rem;
      padding: 1.5rem;
      border-radius: 0.5rem;
      background: linear-gradient(135deg, #6610f2, #198754);
      color: white;
      box-shadow: 0 0.25rem 0.75rem rgba(0,0,0,0.1);
    }
    .report-header h1 {
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .report-header p {
      color: rgba(255,255,255,0.9);
      margin-bottom: 0.25rem;
    }
    .report-footer {
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid #dee2e6;
      color: #6c757d;
      font-size: 0.875rem;
    }
    .version-list {
      max-height: 300px;
      overflow-y: auto;
      padding: 0.75rem;
      border: 1px solid #dee2e6;
      border-radius: 0.5rem;
      background-color: #f8f9fa;
      margin-top: 1rem;
    }
    .badge-container {
      margin-bottom: 1rem;
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .refresh-btn {
      transition: all 0.3s ease;
    }
    .refresh-btn:hover {
      transform: rotate(180deg);
    }
    .info-icon {
      margin-right: 0.5rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="report-header">
      <div class="d-flex justify-content-between align-items-start">
        <div>
          <h1><i class="bi bi-search"></i> Specalyzer Report</h1>
          <p><strong><i class="bi bi-globe"></i> URL:</strong> <a href="${url}" target="_blank" class="text-light">${url}</a></p>
          <p><strong><i class="bi bi-calendar3"></i> Generated:</strong> ${timestamp}</p>
        </div>
        <div>
          <a href="javascript:void(0);" onclick="refreshReport()" class="btn btn-light">
            <i class="bi bi-arrow-repeat refresh-btn"></i> Refresh Analysis
          </a>
        </div>
      </div>
    </div>
    <div class="alert alert-info mb-4 d-flex align-items-center">
      <i class="bi bi-info-circle me-3 fs-4"></i> 
      <div>This report provides an analysis of the specification at the URL above.</div>
    </div>
`;
}

/**
 * Create a card section with Bootstrap styling
 * @param {string} title - Title for the card header
 * @param {string} content - HTML content for the card body
 * @param {string} cardType - Bootstrap card type (primary, success, warning, danger, info)
 * @returns {string} HTML string for the card section
 */
function createCardSection(title, content, cardType = 'primary') {
  // Map card types to Bootstrap icons
  const iconMap = {
    'primary': 'bi-github',
    'success': 'bi-file-earmark-pdf',
    'warning': 'bi-exclamation-triangle',
    'danger': 'bi-bug',
    'info': 'bi-info-circle',
    'secondary': 'bi-gear'
  };
  
  const icon = iconMap[cardType] || 'bi-card-text';
  
  return `
    <div class="card border-${cardType} mb-4 shadow-sm">
      <div class="card-header bg-${cardType} text-white">
        <i class="bi ${icon} me-2"></i>${title}
      </div>
      <div class="card-body">
        ${content}
      </div>
    </div>
  `;
}

/**
 * Format repository information as HTML
 * @param {string|Object} repo - Repository URL or object containing repository info
 * @returns {string} HTML string for repository info
 */
function formatRepositoryInfo(repo) {
  // Handle different repository types (string URL or object)
  let repoUrl = '';
  if (typeof repo === 'string') {
    repoUrl = repo;
  } else if (repo && typeof repo === 'object') {
    // If it's an object, try to get the URL from it
    repoUrl = repo.url || repo.html_url || repo.git_url || 
              (repo.toString && repo.toString() !== '[object Object]' ? repo.toString() : 'Unknown repository');
  } else {
    // Fallback for any other type
    repoUrl = 'Unknown repository';
  }
  
  // Check if it's a GitHub repository
  const isGitHub = typeof repoUrl === 'string' && repoUrl.includes('github.com');
  
  let badgeHtml = '';
  if (isGitHub) {
    try {
      const repoPath = new URL(repoUrl).pathname.replace(/^\//, '').replace(/\.git$/, '');
      badgeHtml = `
        <div class="badge-container">
          <img src="https://img.shields.io/github/stars/${repoPath}?style=flat-square&logo=github" alt="GitHub stars" class="me-2">
          <img src="https://img.shields.io/github/last-commit/${repoPath}?style=flat-square&logo=git" alt="Last commit">
        </div>
      `;
    } catch (error) {
      // If URL parsing fails, don't show badges
      badgeHtml = '';
    }
  }
  
  const repoHtml = `
    <div class="d-flex align-items-center mb-3">
      <i class="bi ${isGitHub ? 'bi-github' : 'bi-git'} fs-3 me-2"></i>
      <h5 class="mb-0">Repository URL:</h5>
    </div>
    <p><a href="${repoUrl}" target="_blank" class="btn btn-outline-primary">
      <i class="bi bi-box-arrow-up-right me-1"></i> ${repoUrl}
    </a></p>
    ${badgeHtml}
  `;
  
  return repoHtml;
}

/**
 * Format PDF status as HTML
 * @param {boolean} exists - Whether PDF exists
 * @param {Error|null} error - Error if any
 * @returns {string} HTML string for PDF status
 */
function formatPdfStatus(exists, error = null) {
  if (exists) {
    return `
      <div class="d-flex align-items-center">
        <div class="rounded-circle bg-success text-white p-2 me-3">
          <i class="bi bi-file-earmark-pdf fs-3"></i>
        </div>
        <div>
          <h5 class="mb-1">PDF Document Available</h5>
          <p class="mb-0 text-success"><i class="bi bi-check-circle-fill me-1"></i> The PDF version of this specification is available.</p>
        </div>
      </div>
    `;
  } else {
    return `
      <div class="d-flex align-items-center">
        <div class="rounded-circle bg-warning text-white p-2 me-3">
          <i class="bi bi-file-earmark-pdf fs-3"></i>
        </div>
        <div>
          <h5 class="mb-1">PDF Document Not Found</h5>
          <p class="mb-0 text-warning">
            <i class="bi bi-exclamation-triangle-fill me-1"></i>
            ${error ? `Error: ${error.message}` : 'The PDF version of this specification could not be found.'}
          </p>
          <small class="text-muted mt-2">PDF files make specifications more accessible and preserve content for offline reading.</small>
        </div>
      </div>
    `;
  }
}

/**
 * Format Spec-Up version information as HTML
 * @param {string|null} version - The detected Spec-Up version or null if not found
 * @returns {string} HTML string for version info
 */
function formatSpecUpVersion(version) {
  if (version) {
    return `
      <div class="d-flex align-items-center">
        <div class="rounded-circle bg-info text-white p-2 me-3">
          <i class="bi bi-code-square fs-3"></i>
        </div>
        <div>
          <h5 class="mb-1">Spec-Up-T Version</h5>
          <p class="mb-0"><code>${version}</code></p>
          <small class="text-muted">The specification was built with Spec-Up-T version ${version}.</small>
        </div>
      </div>
    `;
  } else {
    return `
      <div class="d-flex align-items-center">
        <div class="rounded-circle bg-secondary text-white p-2 me-3">
          <i class="bi bi-question-circle fs-3"></i>
        </div>
        <div>
          <h5 class="mb-1">Spec-Up-T Version Not Detected</h5>
          <p class="mb-0 text-muted">
            <i class="bi bi-info-circle me-1"></i>
            Could not determine which version of Spec-Up-T was used to build this specification.
          </p>
        </div>
      </div>
    `;
  }
}

/**
 * Format version information as HTML
 * @param {Object} versionInfo - Version information object
 * @returns {string} HTML string for version info
 */
function formatVersionInfo(versionInfo) {
  if (!versionInfo || !versionInfo.exists) {
    return `
      <div class="d-flex align-items-center">
        <div class="rounded-circle bg-secondary text-white p-2 me-3">
          <i class="bi bi-layers fs-3"></i>
        </div>
        <div>
          <h5 class="mb-1">No Version History</h5>
          <p class="mb-0 text-muted">
            <i class="bi bi-info-circle me-1"></i>
            This specification does not have a versions directory or previous versions.
          </p>
          <small class="text-muted mt-2">Version history helps track changes over time and allows referencing specific points in the specification's evolution.</small>
        </div>
      </div>
    `;
  }

  // Ensure we have a baseUrl for constructing version links
  let baseUrl = versionInfo.baseUrl || '';
  if (baseUrl && !baseUrl.endsWith('/')) {
    baseUrl += '/';
  }

  let versionLinks = '';
  if (versionInfo.versions && versionInfo.versions.length > 0) {
    versionLinks = '<div class="version-list"><div class="list-group">';
    versionInfo.versions.forEach(version => {
      const versionUrl = `${baseUrl}versions/${version}/`;
      versionLinks += `
        <a href="${versionUrl}" target="_blank" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
          <span><i class="bi bi-clock-history me-2"></i>${version}</span>
          <span class="badge bg-primary rounded-pill">
            <i class="bi bi-box-arrow-up-right"></i>
          </span>
        </a>
      `;
    });
    versionLinks += '</div></div>';
  }

  return `
    <div>
      <div class="d-flex align-items-center mb-3">
        <div class="rounded-circle bg-info text-white p-2 me-3">
          <i class="bi bi-layers fs-3"></i>
        </div>
        <div>
          <h5 class="mb-1">Version History Available</h5>
          <p class="mb-0">
            <i class="bi bi-check-circle-fill me-1 text-success"></i>
            This specification has ${versionInfo.count} previous version${versionInfo.count !== 1 ? 's' : ''}.
          </p>
        </div>
      </div>
      ${versionLinks}
    </div>
  `;
}

/**
 * Format last modified information as HTML
 * @param {Date} lastModified - Last modified date
 * @param {Object} headers - HTTP headers
 * @returns {string} HTML string for last modified info
 */
function formatLastModified(lastModified, headers = {}) {
  if (!lastModified) {
    return `
      <div class="d-flex align-items-center">
        <div class="rounded-circle bg-secondary text-white p-2 me-3">
          <i class="bi bi-calendar-x fs-3"></i>
        </div>
        <div>
          <h5 class="mb-1">Last Updated Information Unavailable</h5>
          <p class="mb-0 text-muted">
            <i class="bi bi-info-circle me-1"></i>
            Could not determine when this specification was last updated.
          </p>
        </div>
      </div>
    `;
  }

  const formattedDate = lastModified.toLocaleDateString(undefined, { 
    weekday: 'long',
    year: 'numeric', 
    month: 'long', 
    day: 'numeric'
  });
  
  const formattedTime = lastModified.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Calculate how long ago the file was modified
  const now = new Date();
  const ageInMs = now - lastModified;
  const ageInDays = Math.floor(ageInMs / (1000 * 60 * 60 * 24));
  
  let ageText = '';
  if (ageInDays === 0) {
    ageText = 'today';
  } else if (ageInDays === 1) {
    ageText = 'yesterday';
  } else if (ageInDays < 30) {
    ageText = `${ageInDays} days ago`;
  } else if (ageInDays < 365) {
    const months = Math.floor(ageInDays / 30);
    ageText = `${months} month${months > 1 ? 's' : ''} ago`;
  } else {
    const years = Math.floor(ageInDays / 365);
    const remainingMonths = Math.floor((ageInDays % 365) / 30);
    ageText = `${years} year${years > 1 ? 's' : ''}${remainingMonths > 0 ? ` and ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}` : ''} ago`;
  }

  return `
    <div class="d-flex align-items-center">
      <div class="rounded-circle bg-secondary text-white p-2 me-3">
        <i class="bi bi-calendar-check fs-3"></i>
      </div>
      <div>
        <h5 class="mb-1">Last Updated</h5>
        <p class="mb-0">
          <i class="bi bi-clock me-1"></i>
          <strong>${formattedDate}</strong> at ${formattedTime} <span class="badge bg-secondary">${ageText}</span>
        </p>
        <small class="text-muted mt-2">This information is based on the server's last-modified header response.</small>
      </div>
    </div>
  `;
}

/**
 * Generate HTML footer with links and information
 * @param {string} version - Specalyzer version
 * @param {string} url - The URL that was analyzed
 * @returns {string} HTML footer string
 */
function generateHtmlFooter(version, url) {
  const currentYear = new Date().getFullYear();

  return `
    <div class="report-footer">
      <div class="row">
        <div class="col-md-6 text-md-start text-center mb-3 mb-md-0">
          <p class="mb-1">Generated with Specalyzer v${version}</p>
          <small>A tool for analyzing specifications built with Spec-Up-T</small>
        </div>
        <div class="col-md-6 text-md-end text-center">
          <p class="mb-1">
            <a href="https://github.com/blockchainbird/specalyzer" target="_blank" class="btn btn-sm btn-outline-secondary">
              <i class="bi bi-github me-1"></i> GitHub Repository
            </a>
          </p>
        </div>
      </div>
      <div class="text-center mt-2">
        <small class="text-muted">© ${currentYear} Blockchain Bird - Specalyzer</small>
      </div>
    </div>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
  <script>
    function refreshReport() {
      const url = "${url}";
      const command = "npx specalyzer " + url + " --html";
      
      if (confirm("This will run the following command in your terminal:\\n\\n" + command + "\\n\\nContinue?")) {
        const newTab = window.open('', '_blank');
        newTab.document.write('<html><head><title>Refreshing Specalyzer Report</title><style>body{font-family:Arial,sans-serif;margin:40px;line-height:1.6;}pre{background:#f4f4f4;padding:10px;border-radius:5px;}</style></head><body><h1>Refreshing Specalyzer Report</h1><p>To refresh the analysis, please run the following command in your terminal:</p><pre>' + command + '</pre><p>A new report will be generated and opened in your browser.</p><p>This tab can be closed.</p></body></html>');
        newTab.document.close();
      }
    }
  </script>
</body>
</html>`;
}

/**
 * Save the HTML report to a file and open it in the default browser
 * @param {string} html - The HTML content to save
 * @param {string} url - The URL that was analyzed
 * @returns {Promise<string>} Path to the saved file
 */
async function saveAndOpenReport(html, url) {
  // Create a filename from the URL
  const urlObj = new URL(url);
  const baseFilename = urlObj.hostname.replace(/\./g, '_') + '_report';
  const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
  const filename = `${baseFilename}_${timestamp}.html`;
  
  // Get the reports directory (create it if it doesn't exist)
  const reportsDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  const filePath = path.join(reportsDir, filename);
  
  // Write the file
  fs.writeFileSync(filePath, html);
  console.log(chalk.green(`💾 Report saved to: ${filePath}`));
  
  // Open in default browser
  try {
    await open(filePath);
  } catch (error) {
    console.error(chalk.red(`❌ Could not open report in browser: ${error.message}`));
  }
  
  return filePath;
}

/**
 * Format spec-up (original) version for HTML display
 * @param {string|null} version - The spec-up version if found
 * @returns {string} HTML snippet with formatted version information
 */
function formatSpecUpOriginalVersion(version) {
  // Using a different color to differentiate from spec-up-t
  if (version) {
    return `
      <div class="d-flex align-items-center">
        <div class="rounded-circle bg-success text-white p-2 me-3">
          <i class="bi bi-code-square fs-3"></i>
        </div>
        <div>
          <h5 class="mb-1">Spec-Up Version (Original)</h5>
          <p class="mb-0"><code>${version}</code></p>
          <small class="text-muted">The specification was built with the original Spec-Up version ${version}.</small>
        </div>
      </div>
    `;
  } else {
    return `
      <div class="d-flex align-items-center">
        <div class="rounded-circle bg-success text-white p-2 me-3">
          <i class="bi bi-code-square fs-3"></i>
        </div>
        <div>
          <h5 class="mb-1">Spec-Up (Original)</h5>
          <p class="mb-0">Version not specified</p>
          <small class="text-muted">The specification was built with the original Spec-Up but the version is not specified.</small>
        </div>
      </div>
    `;
  }
}

module.exports = {
  generateHtmlBoilerplate,
  createCardSection,
  formatRepositoryInfo,
  formatPdfStatus,
  formatSpecUpVersion,
  formatSpecUpOriginalVersion,
  formatVersionInfo,
  formatLastModified,
  generateHtmlFooter,
  saveAndOpenReport
};