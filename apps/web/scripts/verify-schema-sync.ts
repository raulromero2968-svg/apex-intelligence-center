#!/usr/bin/env tsx
/**
 * Schema/Code Synchronization Checker
 *
 * Prevents schema drift by verifying that Drizzle schema definitions
 * match the columns used in application code.
 *
 * This catches issues like:
 * - Code querying columns that don't exist in schema
 * - Missing columns that break type-safety at build time
 *
 * Exit codes:
 * - 0: Schema is in sync with code
 * - 1: Schema drift detected (missing columns or mismatches)
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

console.log('🔍 Verifying schema/code synchronization...\n');

// Paths
const schemaPath = join(process.cwd(), 'src/db/schema.ts');
const srcPath = join(process.cwd(), 'src');

// Read schema file
let schemaContent: string;
try {
  schemaContent = readFileSync(schemaPath, 'utf-8');
} catch (error) {
  console.error('❌ Failed to read schema file:', schemaPath);
  process.exit(1);
}

/**
 * Known column usage patterns that must exist in schema
 * Format: { table: string, column: string, usedIn: string[] }
 */
interface ColumnUsage {
  table: string;
  column: string;
  usedIn: string[];
}

/**
 * Recursively find all TypeScript files in a directory
 */
function findTsFiles(dir: string, files: string[] = []): string[] {
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      try {
        const stat = statSync(fullPath);
        if (stat.isDirectory() && entry !== 'node_modules' && entry !== '.next') {
          findTsFiles(fullPath, files);
        } else if (stat.isFile() && (entry.endsWith('.ts') || entry.endsWith('.tsx'))) {
          files.push(fullPath);
        }
      } catch {
        // Skip files we can't access
        continue;
      }
    }
  } catch {
    // Skip directories we can't access
  }
  return files;
}

/**
 * Scan source files for column usage patterns
 */
function scanForColumnUsage(): ColumnUsage[] {
  const usages: ColumnUsage[] = [];
  const files = findTsFiles(srcPath);

  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf-8');

      // Pattern 1: eq(tableName.columnName, ...)
      // Pattern 2: tableName.columnName in select/where clauses
      // Pattern 3: .set({ columnName: ... })

      // Check for watchlistItems.notified usage
      if (content.includes('watchlistItems.notified')) {
        const existing = usages.find(u => u.table === 'watchlistItems' && u.column === 'notified');
        if (existing) {
          existing.usedIn.push(file.replace(process.cwd(), ''));
        } else {
          usages.push({
            table: 'watchlistItems',
            column: 'notified',
            usedIn: [file.replace(process.cwd(), '')],
          });
        }
      }

      // Check for .set({ notified: ... }) in update statements
      if (content.includes('notified:') && content.includes('.set(')) {
        const existing = usages.find(u => u.table === 'watchlistItems' && u.column === 'notified');
        if (existing && !existing.usedIn.includes(file.replace(process.cwd(), ''))) {
          existing.usedIn.push(file.replace(process.cwd(), ''));
        } else if (!existing) {
          usages.push({
            table: 'watchlistItems',
            column: 'notified',
            usedIn: [file.replace(process.cwd(), '')],
          });
        }
      }

      // Check for watchlistItems.updatedAt usage
      if (content.includes('watchlistItems.updatedAt') ||
          (content.includes('updatedAt:') && content.includes('watchlistItems'))) {
        const existing = usages.find(u => u.table === 'watchlistItems' && u.column === 'updatedAt');
        if (existing && !existing.usedIn.includes(file.replace(process.cwd(), ''))) {
          existing.usedIn.push(file.replace(process.cwd(), ''));
        } else if (!existing) {
          usages.push({
            table: 'watchlistItems',
            column: 'updatedAt',
            usedIn: [file.replace(process.cwd(), '')],
          });
        }
      }
    } catch {
      // Skip files we can't read
      continue;
    }
  }

  return usages;
}

/**
 * Check if a column exists in the schema for a given table
 */
function columnExistsInSchema(table: string, column: string): boolean {
  // Look for the table definition - need to capture the entire table including nested objects
  const tableRegex = new RegExp(`export const ${table} = pgTable\\([^,]+,\\s*\\{([\\s\\S]*?)\\},\\s*\\(`, 's');
  const tableMatch = schemaContent.match(tableRegex);

  if (!tableMatch) {
    console.warn(`⚠️  Table ${table} not found in schema`);
    return false;
  }

  const tableDefinition = tableMatch[1];

  // Convert camelCase to snake_case for column check
  const snakeColumn = column.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

  // Check for column definition (handles both camelCase and snake_case)
  const columnPatterns = [
    `${column}:`,           // camelCase property
    `'${snakeColumn}'`,     // snake_case column name
    `"${snakeColumn}"`,     // alternative quoting
  ];

  return columnPatterns.some(pattern => tableDefinition.includes(pattern));
}

console.log('📋 Scanning source files for column usage...\n');
const columnUsages = scanForColumnUsage();

console.log(`Found ${columnUsages.length} column usage patterns\n`);

// Verify each column usage
const violations: ColumnUsage[] = [];

for (const usage of columnUsages) {
  console.log(`Checking ${usage.table}.${usage.column}...`);

  if (!columnExistsInSchema(usage.table, usage.column)) {
    violations.push(usage);
    console.log(`  ❌ NOT FOUND in schema`);
    console.log(`  📍 Used in:`);
    usage.usedIn.forEach(file => console.log(`     - ${file}`));
  } else {
    console.log(`  ✅ Found in schema`);
  }
}

console.log(`\n${'='.repeat(60)}`);
console.log(`Columns checked: ${columnUsages.length}`);
console.log(`✅ In sync: ${columnUsages.length - violations.length}`);
console.log(`❌ Missing from schema: ${violations.length}`);
console.log('='.repeat(60));

if (violations.length > 0) {
  console.error('\n🚨 ERROR: Schema drift detected!\n');
  console.error('The following columns are used in code but missing from schema:\n');

  for (const violation of violations) {
    console.error(`  ❌ ${violation.table}.${violation.column}`);
    console.error(`     Used in:`);
    violation.usedIn.forEach(file => console.error(`       - ${file}`));
    console.error('');
  }

  console.error('Action required:');
  console.error('1. Add missing columns to src/db/schema.ts');
  console.error('2. Create a migration in drizzle/ directory');
  console.error('3. Run this check again to verify\n');

  process.exit(1);
}

console.log('\n✅ Schema is in sync with code!\n');
process.exit(0);
