# Specalyzer

[![npm version](https://img.shields.io/npm/v/specalyzer)](https://www.npmjs.com/package/specalyzer)
[![NPM Downloads](https://img.shields.io/npm/dm/specalyzer.svg?style=flat)](https://npmjs.org/package/specalyzer)

A CLI tool to analyze specifications built with Spec-Up or Spec-Up-T.

## Usage

```bash
npx specalyzer <url>
```

Where:

- `<url>` is the URL of a specification website built with Spec-Up or Spec-Up-T or a GitHub repository URL.

## Features

- Detects repository information from spec config
- Checks for PDF version of the spec
- Identifies the version of Spec-Up or Spec-Up-T used in the project
- Auto-generates HTML reports with Bootstrap styling and opens them in browser
- Analyzes version directories in the repository
- Gets last modified information for the specification

## Examples

```bash
npx specalyzer example.com/my-spec
```

```bash
npx specalyzer https://github.com/organization/repository
```

## Development

- Entry point: `cli.js`
- To test locally: `npm link` then run `specalyzer` in your terminal.
- The codebase uses promises for asynchronous operations

## Project Structure

The codebase has been modularized to reduce cognitive complexity:

```plaintext
cli.js                 - Main entry point
package.json           - Package configuration
src/
  analyzer.js          - Main analysis logic
  fetcher.js           - HTTP utilities for fetching data
  formatter.js         - Console formatting utilities
  htmlReporter.js      - HTML report generation with Bootstrap
  pdfCheck.js          - PDF checking utility
  repoUrl.js           - Repository URL handling
  reporter.js          - Console output reporting utilities
  specConfig.js        - Spec config extraction
  specupVersion.js     - Spec-Up version extraction utility
  versionCheck.js      - Version directory checking utilities
reports/               - Directory for generated HTML reports
```

### Module Responsibilities

- **analyzer.js**: Coordinates the analysis process and HTML report generation
- **fetcher.js**: Handles HTTP requests, URL normalization, and last-modified checks
- **formatter.js**: Provides console output formatting with colors
- **htmlReporter.js**: Generates HTML reports with Bootstrap styling
- **pdfCheck.js**: Checks for PDF version availability
- **reporter.js**: Handles displaying information in the console
- **repoUrl.js**: Manages repository URL formatting and conversion
- **specConfig.js**: Extracts repository info from spec configurations
- **specupVersion.js**: Detects and extracts Spec-Up/Spec-Up-T version information
- **versionCheck.js**: Checks for versions directory and version subdirectories

## Requirements

- Node.js >= 12.0.0

## Dependencies

- **chalk**: Terminal string styling with colors
- **jsdom**: Used for HTML parsing
- **open**: Used to open HTML reports in the default browser
- **Bootstrap**: Used via CDN for HTML report styling

## License

MIT
