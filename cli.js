#!/usr/bin/env node
/**
 * Specalyzer CLI
 * A tool to analyze specifications built with Spec-Up
 */

const fetcher = require('./src/fetcher');
const analyzer = require('./src/analyzer');
const chalk = require('chalk');

/**
 * Parse command line arguments
 * @returns {Object} Parsed arguments
 */
function parseArguments() {
  const args = {
    url: null,
  };
  
  // Skip first two elements (node executable and script path)
  const cliArgs = process.argv.slice(2);
  
  // Parse arguments
  for (let i = 0; i < cliArgs.length; i++) {
    const arg = cliArgs[i];
    
    if (!args.url) {
      args.url = arg;
    }
  }
  
  return args;
}

/**
 * Main CLI entry point
 */
async function main() {
  // Parse arguments
  const args = parseArguments();
  
  if (!args.url) {
    console.error(chalk.red('❌ Error: Missing URL argument.'));
    console.error(chalk.yellow('📖 Usage: npx specalyzer <url>'));
    console.error(chalk.cyan('📍 where <url> is either:'));
    console.error(chalk.cyan('  🌐 A URL to a deployed Spec-Up site (e.g., https://example.com/spec)'));
    console.error(chalk.cyan('  🐙 A GitHub repository URL (e.g., https://github.com/org/repo)'));
    process.exit(1);
  }

  // Version info
  const pkgJson = require('./package.json');
  const version = pkgJson.version || '1.0.0';
  console.log(chalk.blue(`ℹ️  Specalyzer v${version}`));

  const normalizedUrl = fetcher.normalizeUrl(args.url);
  console.log(chalk.magenta(`🔍 Analyzing: ${normalizedUrl}\n`));

  try {
    console.log(chalk.yellow('⏳ Generating HTML report…'));
    const filePath = await analyzer.generateHtmlReport(normalizedUrl, version);
    console.log(chalk.green(`\n✅ HTML report generated and opened in your default browser: ${filePath}`));
    console.log(chalk.blue('💡 TIP: You can share this HTML file with others or save it for reference.'));
    
    // Explicitly exit
    process.exit(0);
  } catch (error) {
    console.error(chalk.red(`\n❌ Error: ${error.message}`));
    process.exit(1);
  }
}

// Execute the main function
main();
