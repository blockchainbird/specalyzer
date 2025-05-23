# Specalyzer

A CLI tool to analyze specifications built with Spec-Up or Spec-Up-T.

## Usage

```bash
npx specalyzer <url>
```

Where `<url>` is the URL of a specification website built with Spec-Up or Spec-Up-T.

## Features

- Detects repository information from spec config
- Checks for PDF version of the spec
- Identifies the version of Spec-Up-T used in the project

## Example

```bash
npx specalyzer example.com/my-spec
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
  reporter.js          - Output reporting utilities
  repoUrl.js           - Repository URL handling
  specConfig.js        - Spec config extraction
```

### Module Responsibilities

- **analyzer.js**: Coordinates the analysis process
- **fetcher.js**: Handles HTTP requests and URL normalization
- **formatter.js**: Provides console output formatting with colors
- **reporter.js**: Handles displaying information to the user
- **repoUrl.js**: Manages repository URL formatting and conversion
- **specConfig.js**: Extracts repository info from spec configurations

## Requirements

- Node.js >= 12.0.0

## License

MIT
