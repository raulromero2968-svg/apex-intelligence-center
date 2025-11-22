#!/usr/bin/env tsx
/**
 * Barrel File Completeness Checker
 *
 * Ensures every directory in src/lib has an index.ts barrel file.
 * This prevents import errors and enforces the barrel pattern.
 *
 * Exit codes:
 * - 0: All lib modules have barrels
 * - 1: Missing barrel files found
 */

import { readdirSync, statSync, existsSync } from 'fs';
import { join } from 'path';

const libPath = join(process.cwd(), 'src/lib');

console.log('🔍 Checking barrel files in src/lib/...\n');

// Check if src/lib exists
if (!existsSync(libPath)) {
  console.error('❌ src/lib directory not found');
  process.exit(1);
}

// Get all directories in src/lib
const folders = readdirSync(libPath).filter(file => {
  const fullPath = join(libPath, file);
  try {
    return statSync(fullPath).isDirectory();
  } catch {
    return false;
  }
});

console.log(`Found ${folders.length} directories in src/lib/\n`);

// Check for missing index.ts files
const missing: string[] = [];
const present: string[] = [];

for (const folder of folders) {
  const indexPath = join(libPath, folder, 'index.ts');

  if (existsSync(indexPath)) {
    present.push(folder);
    console.log(`✅ ${folder}/index.ts`);
  } else {
    missing.push(folder);
    console.log(`❌ ${folder}/index.ts - MISSING`);
  }
}

console.log(`\n${'='.repeat(60)}`);
console.log(`Total: ${folders.length} directories`);
console.log(`✅ With barrels: ${present.length}`);
console.log(`❌ Missing barrels: ${missing.length}`);
console.log('='.repeat(60));

if (missing.length > 0) {
  console.error('\n🚨 ERROR: Missing barrel files detected!\n');
  console.error('The following directories require index.ts files:');
  missing.forEach(dir => console.error(`  - src/lib/${dir}/index.ts`));
  console.error('\nEach directory in src/lib/ must have an index.ts barrel file');
  console.error('that re-exports the public API of that module.\n');
  process.exit(1);
}

console.log('\n✅ All lib modules have barrel files!\n');
process.exit(0);
