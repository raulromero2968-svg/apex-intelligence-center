#!/usr/bin/env node

/**
 * MDX Frontmatter Validator
 * 
 * Validates that all MDX files have required frontmatter fields:
 * - title: string (required)
 * - slug: string (required)
 * - publishedAt: ISO 8601 date string (required)
 * - category: one of {blog, research, intel} (required)
 * 
 * Exits with non-zero code if any violations are found.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARTICLES_DIR = path.join(__dirname, '..', 'src', 'content', 'articles');
const VALID_CATEGORIES = new Set(['blog', 'research', 'intel']);

// ISO 8601 date regex (supports various formats)
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;

/**
 * Validate ISO 8601 date format
 */
function isValidISODate(dateString) {
  if (!dateString || typeof dateString !== 'string') {
    return false;
  }
  
  // Check regex pattern
  if (!ISO_DATE_REGEX.test(dateString)) {
    return false;
  }
  
  // Try to parse as Date
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Validate a single MDX file
 */
async function validateMdxFile(filePath) {
  const errors = [];
  const warnings = [];
  
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const { data: frontmatter } = matter(content);
    
    const filename = path.basename(filePath);
    const relativePath = path.relative(ARTICLES_DIR, filePath);
    
    // Check required fields
    if (!frontmatter.title || typeof frontmatter.title !== 'string' || frontmatter.title.trim() === '') {
      errors.push(`${relativePath}: Missing or empty 'title' field`);
    }
    
    if (!frontmatter.slug || typeof frontmatter.slug !== 'string' || frontmatter.slug.trim() === '') {
      errors.push(`${relativePath}: Missing or empty 'slug' field`);
    }
    
    if (!frontmatter.publishedAt) {
      errors.push(`${relativePath}: Missing 'publishedAt' field`);
    } else if (!isValidISODate(frontmatter.publishedAt)) {
      errors.push(`${relativePath}: 'publishedAt' must be a valid ISO 8601 date (e.g., "2025-01-16T10:00:00Z")`);
    }
    
    if (!frontmatter.category) {
      errors.push(`${relativePath}: Missing 'category' field`);
    } else if (!VALID_CATEGORIES.has(frontmatter.category.toLowerCase())) {
      errors.push(
        `${relativePath}: 'category' must be one of {blog, research, intel}, got "${frontmatter.category}"`
      );
    }
    
    // Warn if slug doesn't match filename (common pattern)
    if (frontmatter.slug) {
      const expectedSlug = filename.replace(/\.mdx$/, '');
      if (frontmatter.slug !== expectedSlug) {
        warnings.push(
          `${relativePath}: 'slug' ("${frontmatter.slug}") doesn't match filename ("${expectedSlug}")`
        );
      }
    }
    
  } catch (error) {
    errors.push(`${filePath}: Error reading/parsing file: ${error.message}`);
  }
  
  return { errors, warnings };
}

/**
 * Find all MDX files recursively
 */
async function findMdxFiles(dir) {
  const files = [];
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        files.push(...await findMdxFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.mdx')) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // Directory might not exist, skip it
    if (error.code !== 'ENOENT') {
      console.error(`Error reading directory ${dir}:`, error.message);
    }
  }
  
  return files;
}

/**
 * Main validation function
 */
async function main() {
  console.log('🔍 Validating MDX frontmatter...\n');
  
  if (!await fs.access(ARTICLES_DIR).then(() => true).catch(() => false)) {
    console.error(`❌ Articles directory not found: ${ARTICLES_DIR}`);
    process.exit(1);
  }
  
  const mdxFiles = await findMdxFiles(ARTICLES_DIR);
  
  if (mdxFiles.length === 0) {
    console.log('ℹ️  No MDX files found to validate.');
    process.exit(0);
  }
  
  console.log(`Found ${mdxFiles.length} MDX file(s) to validate.\n`);
  
  const allErrors = [];
  const allWarnings = [];
  
  for (const file of mdxFiles) {
    const { errors, warnings } = await validateMdxFile(file);
    allErrors.push(...errors);
    allWarnings.push(...warnings);
  }
  
  // Print warnings first
  if (allWarnings.length > 0) {
    console.log('⚠️  Warnings:');
    allWarnings.forEach(w => console.log(`   ${w}`));
    console.log('');
  }
  
  // Print errors
  if (allErrors.length > 0) {
    console.log('❌ Validation errors:');
    allErrors.forEach(e => console.log(`   ${e}`));
    console.log('');
    console.log(`❌ Found ${allErrors.length} error(s) in ${mdxFiles.length} file(s).`);
    process.exit(1);
  }
  
  console.log(`✅ All ${mdxFiles.length} MDX file(s) passed validation.`);
  process.exit(0);
}

// Run main function
main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

