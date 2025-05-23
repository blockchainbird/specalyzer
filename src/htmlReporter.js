/**
 * HTML Report Generator Module
 * Provides functions to generate formatted HTML reports for spec analysis
 */

const fs = require('fs');
const path = require('path');
const open = require('open');
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
  </style>
</head>
<body>
  <div class="container">
    <div class="report-header">
      <h1><i class="bi bi-search"></i> Specalyzer Report</h1>
      <p><strong><i class="bi bi-globe"></i> URL:</strong> <a href="${url}" target="_blank" class="text-light">${url}</a></p>
      <p><strong><i class="bi bi-calendar3"></i> Generated:</strong> ${timestamp}</p>
    </div>
    <div class="alert alert-info mb-4">
      <i class="bi bi-info-circle"></i> This report provides an analysis of the specification at the URL above.
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
 * @param {string} repo - Repository URL
 * @returns {string} HTML string for repository info
 */
function formatRepositoryInfo(repo) {
  // Check if it's a GitHub repository
  const isGitHub = repo.includes('github.com');
  
  let badgeHtml = '';
  if (isGitHub) {
    const repoPath = new URL(repo).pathname.replace(/^\//, '').replace(/\.git$/, '');
    badgeHtml = `
      <div class="mb-3">
        <img src="https://img.shields.io/github/stars/${repoPath}?style=for-the-badge&logo=github" alt="GitHub stars" class="me-2">
        <img src="https://img.shields.io/github/last-commit/${repoPath}?style=for-the-badge&logo=git" alt="Last commit">
      </div>
    `;
  }
  
  const repoHtml = `
    <div class="d-flex align-items-center mb-3">
      <i class="bi bi-github fs-3 me-2"></i>
      <h5 class="mb-0">Repository URL:</h5>
    </div>
    <p><a href="${repo}" target="_blank" class="btn btn-outline-primary">
      <i class="bi bi-box-arrow-up-right me-1"></i> ${repo}
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
    let errorHtml = '';
    if (error) {
      errorHtml = `
        <div class="alert alert-light mt-2 small">
          <i class="bi bi-exclamation-triangle-fill me-1"></i> Error: ${error.message}
        </div>
      `;
    }
    
    return `
      <div class="d-flex align-items-center">
        <div class="rounded-circle bg-warning text-white p-2 me-3">
          <i class="bi bi-file-earmark-x fs-3"></i>
        </div>
        <div>
          <h5 class="mb-1">PDF Document Not Found</h5>
          <p class="mb-0 text-warning"><i class="bi bi-exclamation-circle me-1"></i> No PDF version was found for this specification.</p>
        </div>
      </div>
      ${errorHtml}
    `;
  }
}

/**
 * Format Spec-Up version as HTML
 * @param {string|null} version - Spec-Up version
 * @returns {string} HTML string for Spec-Up version
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
          <div class="d-flex align-items-center">
            <span class="badge bg-info me-2">${version}</span>
            <span class="text-muted">This specification is built with Spec-Up-T version ${version}.</span>
          </div>
        </div>
      </div>
    `;
  } else {
    return `
      <div class="d-flex align-items-center">
        <div class="rounded-circle bg-secondary text-white p-2 me-3">
          <i class="bi bi-code-square fs-3"></i>
        </div>
        <div>
          <h5 class="mb-1">Spec-Up-T Version</h5>
          <p class="mb-0 text-muted"><i class="bi bi-question-circle me-1"></i> Could not determine the Spec-Up-T version.</p>
        </div>
      </div>
    `;
  }
}

/**
 * Format version information as HTML
 * @param {Object} versionInfo - Version information object
 * @returns {string} HTML string for version information
 */
function formatVersionInfo(versionInfo) {
  if (!versionInfo || !versionInfo.versionsExist) {
    return `
      <div class="alert alert-secondary">
        <i class="bi bi-exclamation-circle me-2"></i> No versions directory was found for this specification.
      </div>
    `;
  }
  
  let versionsList = '';
  if (versionInfo.versions && versionInfo.versions.length > 0) {
    const badges = versionInfo.versions.map(version => 
      `<span class="badge bg-info me-1 mb-1">${version}</span>`
    ).join('');
    
    versionsList = `
      <div class="mt-3">
        <h6><i class="bi bi-tag me-2"></i>Available Versions:</h6>
        <div class="d-flex flex-wrap">
          ${badges}
        </div>
      </div>
    `;
  }
  
  const html = `
    <div class="d-flex align-items-center">
      <div class="rounded-circle bg-info text-white p-2 me-3">
        <i class="bi bi-clock-history fs-3"></i>
      </div>
      <div>
        <h5 class="mb-1">Version History</h5>
        <div class="d-flex align-items-center">
          <span class="badge bg-success me-2">${versionInfo.versionCount}</span>
          <span class="text-muted">version${versionInfo.versionCount !== 1 ? 's' : ''} found in the versions directory.</span>
        </div>
      </div>
    </div>
    ${versionsList}
  `;
  
  return html;
}

/**
 * Generate HTML footer
 * @param {string} version - Specalyzer version
 * @returns {string} HTML string for footer
 */
function generateHtmlFooter(version) {
  const currentYear = new Date().getFullYear();
  
  return `
    <div class="report-footer">
      <div class="row">
        <div class="col-md-6">
          <p><i class="bi bi-tools me-1"></i> Generated by <strong>Specalyzer v${version || 'unknown'}</strong></p>
        </div>
        <div class="col-md-6 text-md-end">
          <p>
            <a href="https://github.com/blockchainbird/specalyzer" target="_blank" class="text-decoration-none">
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
  console.log(`Report saved to: ${filePath}`);
  
  // Open in default browser
  try {
    await open(filePath);
  } catch (error) {
    console.error(`Could not open report in browser: ${error.message}`);
  }
  
  return filePath;
}

module.exports = {
  generateHtmlBoilerplate,
  createCardSection,
  formatRepositoryInfo,
  formatPdfStatus,
  formatSpecUpVersion,
  formatVersionInfo,
  generateHtmlFooter,
  saveAndOpenReport
};