# Specalyzer

A CLI tool to analyze specifications built with Spec-Up or Spec-Up-T.

## Usage

```bash
npx specalyzer <url> [--html]
```

Where:
- `<url>` is the URL of a specification website built with Spec-Up or Spec-Up-T.
- `--html` or `-h` (optional) generates an HTML report and opens it in your default browser.

## Features

- Detects repository information from spec config
- Checks for PDF version of the spec
- Identifies the version of Spec-Up-T used in the project
- Generates HTML reports with Bootstrap styling and opens them in browser

## Examples

Console output:
```bash
npx specalyzer example.com/my-spec
```

HTML report:
```bash
npx specalyzer example.com/my-spec --html
```

## Development

- Entry point: `cli.js`
- To test locally: `npm link` then run `specalyzer` in your terminal.
- The codebase uses promises for asynchronous operations

## Project Structure

The codebase has been modularized to reduce cognitive complexity:

```
cli.js                 - Main entry point
package.json           - Package configuration
pdfCheck.js            - PDF checking utility
specupVersion.js       - Version extraction utility
src/
  analyzer.js          - Main analysis logic
  fetcher.js           - HTTP utilities for fetching data
  formatter.js         - Console formatting utilities
  htmlReporter.js      - HTML report generation with Bootstrap
  reporter.js          - Console output reporting utilities
  repoUrl.js           - Repository URL handling
  specConfig.js        - Spec config extraction
  versionCheck.js      - Version directory checking utilities
```

### Module Responsibilities

- **analyzer.js**: Coordinates the analysis process
- **fetcher.js**: Handles HTTP requests and URL normalization
- **formatter.js**: Provides console output formatting with colors
- **htmlReporter.js**: Generates HTML reports with Bootstrap styling
- **reporter.js**: Handles displaying information in the console
- **repoUrl.js**: Manages repository URL formatting and conversion
- **specConfig.js**: Extracts repository info from spec configurations
- **versionCheck.js**: Checks for versions directory and version subdirectories

## Requirements

- Node.js >= 12.0.0

## Dependencies

- **jsdom**: Used for HTML parsing
- **open**: Used to open HTML reports in the default browser
- **Bootstrap**: Used via CDN for HTML report styling

## License

MIT
