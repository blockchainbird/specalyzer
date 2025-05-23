#!/usr/bin/env node

// Get the argument (URL or domain)
const input = process.argv[2];

if (!input) {
  console.error('Usage: npx specalyzer <url>');
  process.exit(1);
}

// Normalize input to a valid URL
function normalizeUrl(str) {
  let url = str.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }
  // Remove trailing slash
  url = url.replace(/\/$/, '');
  return url;
}

const normalizedUrl = normalizeUrl(input);
console.log(`Normalized URL: ${normalizedUrl}`);
// Here you can add further logic to fetch or process the URL
