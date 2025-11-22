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

const FOMO_PHRASES = [
  'limited time',
  'ending soon',
  'last chance',
  'act now',
  'don\'t miss',
  'only X left',
  'only 1 left',
  'only 2 left',
  'only 3 left',
  'only 4 left',
  'only 5 left',
  'only 6 left',
  'only 7 left',
  'only 8 left',
  'only 9 left',
  'few remaining',
  'few left',
  'flash sale',
  'urgent'
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
  // Skip if file should be ignored
  if (shouldIgnore(filePath)) {
    return null;
  }

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
 * Checks if a path should be ignored
 * @param {string} filePath - The file path to check
 * @returns {boolean} True if the path should be ignored
 */
function shouldIgnore(filePath) {
  // Normalize the path for comparison
  const normalizedPath = filePath.replace(/\\/g, '/');

  return IGNORE_PATTERNS.some(pattern => {
    // Remove ** and * from pattern for simple matching
    const cleanPattern = pattern.replace(/\*\*/g, '').replace(/\*/g, '').replace(/^\/+/, '');
    return normalizedPath.includes(cleanPattern) || normalizedPath.endsWith(cleanPattern);
  });
}

/**
 * Recursively gets all files matching extensions in a directory
 * @param {string} dir - Directory to scan
 * @param {string[]} extensions - File extensions to match
 * @returns {string[]} List of matching files
 */
function getFilesRecursively(dir, extensions) {
  const files = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (shouldIgnore(fullPath)) {
      continue;
    }

    if (entry.isDirectory()) {
      files.push(...getFilesRecursively(fullPath, extensions));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (extensions.includes(ext)) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

/**
 * Gets list of files to scan
 * @param {string[]} patterns - File paths or directory paths
 * @returns {string[]} List of files to scan
 */
function getFilesToScan(patterns) {
  const files = new Set();
  const extensions = ['.mdx', '.md', '.tsx', '.ts', '.jsx', '.js'];

  patterns.forEach(pattern => {
    if (fs.existsSync(pattern)) {
      const stat = fs.statSync(pattern);

      if (stat.isFile()) {
        files.add(pattern);
      } else if (stat.isDirectory()) {
        const dirFiles = getFilesRecursively(pattern, extensions);
        dirFiles.forEach(file => files.add(file));
      }
    } else {
      // Try as a pattern from current directory
      const currentDir = process.cwd();
      const dirFiles = getFilesRecursively(currentDir, extensions);
      dirFiles.forEach(file => files.add(file));
    }
  });

  return Array.from(files);
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const patterns = args.length > 0 ? args : [process.cwd()];

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
