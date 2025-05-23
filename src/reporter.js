/**
 * Reporter module for displaying spec information
 */

const formatter = require('./formatter');
const repoUrl = require('./repoUrl');
const specupVersion = require('../specupVersion');
const fetcher = require('./fetcher');

// Shortcuts for formatter
const format = formatter.format;
const colors = formatter.colors;

/**
 * Print report header
 */
function printReportHeader() {
  console.log(format.header('Specalyzer Report'));
}

/**
 * Print PDF check results
 * @param {boolean} exists - Whether PDF exists
 * @param {Error} [error] - Optional error
 */
function printPdfStatus(exists, error) {
  if (error) {
    console.log(format.warning('PDF', `Error checking for index.pdf: ${error.message}`));
    return;
  }
  
  const message = exists ? 'index.pdf exists' : 'index.pdf does NOT exist';
  const formatter = exists ? format.success : format.warning;
  console.log(formatter('PDF', message));
}

/**
 * Print spec-up-t version info
 * @param {string|null} version - Version string
 */
function printSpecUpVersion(version) {
  const message = version 
    ? `version in package.json: ${colors.bold}${version}${colors.reset}` 
    : 'is not listed as a dependency in package.json';
  
  console.log(format.info('spec-up-t', message));
}

/**
 * Print repository information
 * @param {Object|string} repoUrl - Repository URL
 */
function printRepositoryInfo(repo) {
  printReportHeader();
  console.log(format.warning('Repository', ''));
  console.log('  ' + repoUrl.formatRepoUrl(repo));
}

/**
 * Print footer
 */
function printFooter() {
  console.log('\n' + colors.cyan + '==============================' + colors.reset + '\n');
}

/**
 * Fetch and print spec-up-t version
 * @param {string} repoUrlString - Repository URL string
 * @returns {Promise<void>}
 */
async function fetchAndPrintVersion(repoUrlString) {
  const pkgUrl = specupVersion.getRawPackageJsonUrl(repoUrlString);
  
  if (!pkgUrl) {
    throw new Error('Could not construct raw package.json URL from repo URL.');
  }
  
  const pkg = await fetcher.fetchPackageJson(pkgUrl);
  const version = specupVersion.getSpecUpTVersionFromPackageJson(pkg);
  printSpecUpVersion(version);
}

// Export functions
module.exports.printReportHeader = printReportHeader;
module.exports.printPdfStatus = printPdfStatus;
module.exports.printSpecUpVersion = printSpecUpVersion;
module.exports.printRepositoryInfo = printRepositoryInfo;
module.exports.printFooter = printFooter;
module.exports.fetchAndPrintVersion = fetchAndPrintVersion;
