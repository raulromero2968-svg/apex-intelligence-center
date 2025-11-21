#!/usr/bin/env node

/**
 * Standalone FOMO language scanner for MDX and other text files
 * Scans files for prohibited FOMO (Fear of Missing Out) language
 *
 * Usage:
 *   node scripts/check-fomo-language.js [file-or-directory...]
 *   npm run check-fomo
 *
 * Exit codes:
 *   0 - No FOMO language detected
 *   1 - FOMO language detected (fails build)
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const FOMO_PHRASES = [
  'limited time',
  'ending soon',
  'last chance',
  'act now',
  'don\'t miss',
  'few left'
];

const DEFAULT_PATTERNS = [
  '**/*.mdx',
  '**/*.md',
  '**/*.tsx',
  '**/*.ts',
  '**/*.jsx',
  '**/*.js'
];

const IGNORE_PATTERNS = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/.next/**',
  '**/coverage/**',
  '**/.eslint/**',
  '**/scripts/check-fomo-language.js' // Ignore this file itself
];

/**
 * Checks if text contains any FOMO phrases (case-insensitive)
 * @param {string} text - The text to check
 * @returns {Array<{phrase: string, line: number, column: number}>} Matches found
 */
function findFomoLanguage(text) {
  const matches = [];
  const lines = text.split('\n');

  lines.forEach((line, lineIndex) => {
    const lowerLine = line.toLowerCase();

    FOMO_PHRASES.forEach(phrase => {
      let index = lowerLine.indexOf(phrase);
      while (index !== -1) {
        matches.push({
          phrase,
          line: lineIndex + 1,
          column: index + 1,
          context: line.trim()
        });
        index = lowerLine.indexOf(phrase, index + 1);
      }
    });
  });

  return matches;
}

/**
 * Scans a file for FOMO language
 * @param {string} filePath - Path to the file
 * @returns {Object|null} Result object or null if no violations
 */
function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const matches = findFomoLanguage(content);

    if (matches.length > 0) {
      return {
        file: filePath,
        matches
      };
    }
  } catch (error) {
    console.error(`Error reading file ${filePath}: ${error.message}`);
  }

  return null;
}

/**
 * Gets list of files to scan
 * @param {string[]} patterns - Glob patterns or file paths
 * @returns {string[]} List of files to scan
 */
function getFilesToScan(patterns) {
  const files = new Set();

  patterns.forEach(pattern => {
    // Check if it's a file or directory
    if (fs.existsSync(pattern)) {
      const stat = fs.statSync(pattern);

      if (stat.isFile()) {
        files.add(pattern);
      } else if (stat.isDirectory()) {
        // Scan directory with default patterns
        DEFAULT_PATTERNS.forEach(filePattern => {
          const matches = glob.sync(path.join(pattern, filePattern), {
            ignore: IGNORE_PATTERNS,
            nodir: true
          });
          matches.forEach(file => files.add(file));
        });
      }
    } else {
      // Treat as glob pattern
      const matches = glob.sync(pattern, {
        ignore: IGNORE_PATTERNS,
        nodir: true
      });
      matches.forEach(file => files.add(file));
    }
  });

  return Array.from(files);
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const patterns = args.length > 0 ? args : DEFAULT_PATTERNS;

  console.log('🔍 Scanning for FOMO language...\n');

  const files = getFilesToScan(patterns);

  if (files.length === 0) {
    console.log('⚠️  No files found to scan.');
    process.exit(0);
  }

  console.log(`Scanning ${files.length} files...\n`);

  const violations = [];

  files.forEach(file => {
    const result = scanFile(file);
    if (result) {
      violations.push(result);
    }
  });

  if (violations.length === 0) {
    console.log('✅ No FOMO language detected. Build can proceed.');
    process.exit(0);
  }

  // Report violations
  console.error('❌ FOMO LANGUAGE DETECTED - BUILD BLOCKED\n');
  console.error('The following files contain prohibited FOMO language:\n');

  violations.forEach(({ file, matches }) => {
    console.error(`\n${file}:`);
    matches.forEach(({ phrase, line, column, context }) => {
      console.error(`  Line ${line}:${column} - "${phrase}"`);
      console.error(`    ${context}`);
    });
  });

  console.error('\n❌ FOMO language is permanently banned from this codebase.');
  console.error('Remove all instances of the following phrases:');
  FOMO_PHRASES.forEach(phrase => {
    console.error(`  - "${phrase}"`);
  });
  console.error('\nPRs cannot merge with FOMO copy. Ever.\n');

  process.exit(1);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { findFomoLanguage, scanFile };
