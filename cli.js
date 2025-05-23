#!/usr/bin/env node
/**
 * Specalyzer CLI
 * A tool to analyze specifications built with Spec-Up
 */

const fetcher = require('./src/fetcher');
const analyzer = require('./src/analyzer');
const reporter = require('./src/reporter');

/**
 * Main CLI entry point
 */
async function main() {
  // Get input from command line
  const input = process.argv[2];
  
  if (!input) {
    console.error('Usage: npx specalyzer <url>');
    console.error('  where <url> is either:');
    console.error('  - A URL to a deployed Spec-Up site (e.g., https://example.com/spec)');
    console.error('  - A GitHub repository URL (e.g., https://github.com/org/repo)');
    process.exit(1);
  }

  // Version info
  const pkgJson = require('./package.json');
  console.log(`Specalyzer v${pkgJson.version || '1.0.0'}`);

  const normalizedUrl = fetcher.normalizeUrl(input);
  console.log(`Analyzing: ${normalizedUrl}\n`);

  try {
    // Analyze the spec
    await analyzer.analyzeSpec(normalizedUrl);
  
    // Print footer
    reporter.printFooter();
    
    // Explicitly exit
    process.exit(0);
  } catch (error) {
    console.error(`\nError: ${error.message}`);
    process.exit(1);
  }
}

// Execute the main function
main();
