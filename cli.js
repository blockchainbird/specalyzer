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
    process.exit(1);
  }

  const normalizedUrl = fetcher.normalizeUrl(input);
  console.log(`Normalized URL: ${normalizedUrl}`);

  // Analyze the spec
  await analyzer.analyzeSpec(normalizedUrl);
  
  // Print footer
  reporter.printFooter();
}

// Execute the main function
main();
