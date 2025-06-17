/**
 * Reporter module for displaying information to the console
 */

const formatter = require('./formatter');
const repoUrl = require('./repoUrl');
const specupVersion = require('./specupVersion');
const fetcher = require('./fetcher');
const versionCheck = require('./versionCheck');

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
 * Print spec-up-t version
 * @param {string|null} version - The spec-up-t version if found
 */
function printSpecUpVersion(version) {
  const message = version 
    ? `version in package.json: ${colors.bold}${version}${colors.reset}` 
    : 'is not listed as a dependency in package.json';
  
  console.log(format.info('spec-up-t', message));
  
  // Add explanation about version ranges if a version with range symbols is detected
  if (version && (version.includes('^') || version.includes('~') || version.includes('*'))) {
    console.log(format.info('💡 TIP', `Symbols like ^ ~ * indicate version ranges, not exact versions. ${colors.bold}${version}${colors.reset} allows compatible versions within semantic versioning rules.`));
  }
}

/**
 * Print original spec-up version
 * @param {string|null} version - The original spec-up version if found
 */
function printSpecUpOriginalVersion(version) {
  const message = version 
    ? `version in package.json: ${colors.bold}${version}${colors.reset}` 
    : 'is detected but version is not listed in package.json';
  
  console.log(format.info('spec-up (original)', message));
  
  // Add explanation about version ranges if a version with range symbols is detected
  if (version && (version.includes('^') || version.includes('~') || version.includes('*'))) {
    console.log(format.info('💡 TIP', `Symbols like ^ ~ * indicate version ranges, not exact versions. ${colors.bold}${version}${colors.reset} allows compatible versions within semantic versioning rules.`));
  }
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
      const version = specupVersion.getSpecUpTVersionFromPackageJson(pkg);
      printSpecUpVersion(version);
    } else {
      // If we couldn't fetch from any URL, show the last error
      console.log(format.warning('spec-up-t', `Could not determine version: ${lastError ? lastError.message : 'Unknown error'}`));
    }
  } catch (err) {
    console.log(format.warning('spec-up-t', `Could not check version: ${err.message}`));
  }
}

// Export functions
module.exports.printReportHeader = printReportHeader;
module.exports.printPdfStatus = printPdfStatus;
module.exports.printSpecUpVersion = printSpecUpVersion;
module.exports.printSpecUpOriginalVersion = printSpecUpOriginalVersion;
module.exports.printRepositoryInfo = printRepositoryInfo;
module.exports.printFooter = printFooter;
module.exports.fetchAndPrintVersion = fetchAndPrintVersion;
module.exports.printVersionInfo = printVersionInfo;

/**
 * Print information about versions directory and version subdirectories
 * @param {Object} versionInfo - Version information object from versionCheck
 */
function printVersionInfo(versionInfo) {
  const formattedInfo = versionCheck.formatVersionInfo(versionInfo);
  console.log(format.info('Versions', formattedInfo));
}
