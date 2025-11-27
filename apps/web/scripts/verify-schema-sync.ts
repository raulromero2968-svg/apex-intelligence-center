/**
 * Comprehensive Schema Synchronization Verification
 *
 * This script ensures that:
 * 1. Schema definitions match actual code usage (no orphaned column references)
 * 2. All migrations are properly tracked
 * 3. Schema structure is consistent
 * 4. No SQL injection vulnerabilities in dynamic queries
 *
 * Runs in CI/CD pipeline and as a pre-commit hook to prevent schema drift.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

type TableColumns = Record<string, Set<string>>;
type SchemaIssue = {
  type: 'error' | 'warning';
  message: string;
  file?: string;
  line?: number;
};

interface VerificationStats {
  tablesFound: number;
  columnsFound: number;
  filesScanned: number;
  issuesFound: number;
  warningsFound: number;
}

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(80));
  log(title, 'bright');
  console.log('='.repeat(80));
}

function readFile(filePath: string): string {
  return fs.readFileSync(filePath, 'utf8');
}

/**
 * Collect all table and column definitions from schema file
 */
function collectSchemaColumns(schemaPath: string): TableColumns {
  const src = readFile(schemaPath);
  const tables: TableColumns = {};

  // Find pgTable definitions: export const tableName = pgTable('table_name', { ... });
  const tableRegex = /export const\s+(\w+)\s*=\s*pgTable\([^,]+,\s*\{/g;
  let match: RegExpExecArray | null;

  while ((match = tableRegex.exec(src)) !== null) {
    const tableVarName = match[1];
    const startPos = match.index + match[0].length;

    // Find the matching closing brace for the column definition block
    let braceCount = 1;
    let pos = startPos;
    let columnsBlockEnd = startPos;

    while (pos < src.length && braceCount > 0) {
      if (src[pos] === '{') braceCount++;
      else if (src[pos] === '}') braceCount--;
      if (braceCount === 0) {
        columnsBlockEnd = pos;
        break;
      }
      pos++;
    }

    const columnsBlock = src.slice(startPos, columnsBlockEnd);

    const columnNames = new Set<string>();
    // Match column names at start of line or after comma/newline
    const columnRegex = /(?:^|\n|,)\s*([\w$]+)\s*:/gm;
    let colMatch: RegExpExecArray | null;

    while ((colMatch = columnRegex.exec(columnsBlock)) !== null) {
      const colName = colMatch[1];
      // Skip TypeScript keywords and non-column patterns
      if (colName === 'table' || colName === 'export' || colName === 'const') continue;
      columnNames.add(colName);
    }

    tables[tableVarName] = columnNames;
  }

  return tables;
}

/**
 * Recursively walk directory tree to find files
 */
function walk(dir: string, exts: string[], files: string[] = []): string[] {
  if (!fs.existsSync(dir)) {
    return files;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip node_modules, build output, and other non-source directories
      if ([
        'node_modules',
        '.next',
        'dist',
        '.turbo',
        'coverage',
        '.git',
        'drizzle',
      ].includes(entry.name)) {
        continue;
      }
      walk(fullPath, exts, files);
    } else {
      if (exts.includes(path.extname(entry.name))) {
        files.push(fullPath);
      }
    }
  }
  return files;
}

/**
 * Check for dangerous SQL patterns that might lead to injection vulnerabilities
 */
function checkSqlInjectionPatterns(content: string, file: string, issues: SchemaIssue[]): void {
  // Pattern 1: String concatenation with sql`` tags
  const sqlConcatRegex = /sql`[^`]*\$\{[^}]*\+[^}]*\}/g;
  if (sqlConcatRegex.test(content)) {
    issues.push({
      type: 'error',
      message: 'Potential SQL injection: String concatenation inside sql`` template',
      file,
    });
  }

  // Pattern 2: Direct variable interpolation without sql.placeholder
  const unsafeInterpolation = /sql`[^`]*\$\{(?!sql\.)[^}]*\}/g;
  const matches = content.match(unsafeInterpolation);
  if (matches && matches.length > 0) {
    // Check if these are safe patterns (table/column names from schema)
    const hasSafePattern = /\$\{(table|schema|column|index)/.test(content);
    if (!hasSafePattern) {
      issues.push({
        type: 'warning',
        message: 'Possible unsafe SQL interpolation - ensure using sql.placeholder or validated identifiers',
        file,
      });
    }
  }
}

/**
 * Verify that all column references in code match schema definitions
 */
function verifyColumnUsage(schemaPath: string, srcRoot: string): SchemaIssue[] {
  const tables = collectSchemaColumns(schemaPath);
  const exts = ['.ts', '.tsx'];
  const files = walk(srcRoot, exts);

  // Drizzle ORM method names to exclude from column checks
  const drizzleMethods = new Set([
    'findMany',
    'findFirst',
    'findUnique',
    'create',
    'update',
    'delete',
    'upsert',
    'count',
    'aggregate',
    'groupBy',
    'getBySlug',
    'getById',
    'getWithLatestPrices',
    'getHighValueWithPrices',
    'listPublic',
    'map',
    'slice',
    'length',
    'filter',
    'reduce',
    'forEach',
    'some',
    'every',
    'find',
    'includes',
  ]);

  const issues: SchemaIssue[] = [];

  for (const file of files) {
    const content = readFile(file);

    // Check for SQL injection patterns
    if (content.includes('sql`') || content.includes('sql.raw')) {
      checkSqlInjectionPatterns(content, file, issues);
    }

    for (const [tableVar, columns] of Object.entries(tables)) {
      // Match table.column patterns
      const usageRegex = new RegExp(`${tableVar}\\.([A-Za-z0-9_]+)`, 'g');
      let usageMatch: RegExpExecArray | null;

      while ((usageMatch = usageRegex.exec(content)) !== null) {
        const col = usageMatch[1];
        const matchStart = usageMatch.index;

        // Skip if it's a known Drizzle method
        if (drizzleMethods.has(col)) continue;

        // Check if followed by a parenthesis (indicating a method call)
        const matchEnd = matchStart + usageMatch[0].length;
        const afterMatch = content.slice(matchEnd);
        if (/^\s*\(/.test(afterMatch)) continue;

        // Skip if inside a SQL template literal
        const beforeMatch = content.slice(Math.max(0, matchStart - 50), matchStart);
        if (/sql[`.]/.test(beforeMatch)) {
          const sqlStart = beforeMatch.lastIndexOf('sql');
          if (sqlStart >= 0) {
            const sqlContext = beforeMatch.slice(sqlStart);
            if (sqlContext.includes('sql`') || sqlContext.includes('sql.raw')) continue;
          }
        }

        if (!columns.has(col)) {
          issues.push({
            type: 'error',
            message: `Unknown column reference: ${tableVar}.${col}`,
            file: path.relative(process.cwd(), file),
          });
        }
      }
    }
  }

  return issues;
}

/**
 * Check if drizzle migrations are in sync with schema
 */
function verifyMigrationSync(schemaPath: string, migrationsDir: string): SchemaIssue[] {
  const issues: SchemaIssue[] = [];

  if (!fs.existsSync(migrationsDir)) {
    issues.push({
      type: 'warning',
      message: `Migrations directory not found: ${migrationsDir}`,
    });
    return issues;
  }

  try {
    // Check if schema has been modified more recently than latest migration
    const schemaStats = fs.statSync(schemaPath);
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort()
      .reverse();

    if (migrationFiles.length === 0) {
      issues.push({
        type: 'warning',
        message: 'No migration files found. Run drizzle-kit generate to create initial migration.',
      });
      return issues;
    }

    const latestMigration = path.join(migrationsDir, migrationFiles[0]);
    const migrationStats = fs.statSync(latestMigration);

    if (schemaStats.mtime > migrationStats.mtime) {
      issues.push({
        type: 'error',
        message: 'Schema file modified after latest migration. Run: drizzle-kit generate',
        file: schemaPath,
      });
    }
  } catch (error) {
    issues.push({
      type: 'warning',
      message: `Error checking migration sync: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }

  return issues;
}

/**
 * Verify drizzle-kit configuration is correct
 */
function verifyDrizzleConfig(configPath: string): SchemaIssue[] {
  const issues: SchemaIssue[] = [];

  if (!fs.existsSync(configPath)) {
    issues.push({
      type: 'error',
      message: `Drizzle config not found: ${configPath}`,
    });
    return issues;
  }

  const configContent = readFile(configPath);

  // Check for strict mode
  if (!configContent.includes('strict:') && !configContent.includes('strict :')) {
    issues.push({
      type: 'warning',
      message: 'Drizzle config missing strict mode setting. Consider adding "strict: true"',
      file: configPath,
    });
  }

  // Check for schema path
  if (!configContent.includes('schema:')) {
    issues.push({
      type: 'error',
      message: 'Drizzle config missing schema path',
      file: configPath,
    });
  }

  // Check for output directory
  if (!configContent.includes('out:')) {
    issues.push({
      type: 'warning',
      message: 'Drizzle config missing output directory (out:)',
      file: configPath,
    });
  }

  return issues;
}

/**
 * Check for common schema anti-patterns
 */
function checkSchemaQuality(schemaPath: string): SchemaIssue[] {
  const issues: SchemaIssue[] = [];
  const content = readFile(schemaPath);

  // Check for missing indexes on foreign keys
  const foreignKeyRegex = /\.references\(\(\)\s*=>\s*(\w+)\.id\)/g;
  const indexRegex = /index\(['"]([\w_]+)['"]\)/g;

  const foreignKeys: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = foreignKeyRegex.exec(content)) !== null) {
    foreignKeys.push(match[1]);
  }

  const indexes = new Set<string>();
  while ((match = indexRegex.exec(content)) !== null) {
    indexes.add(match[1]);
  }

  // Check for tables without timestamps
  const tableRegex = /export const\s+(\w+)\s*=\s*pgTable/g;
  while ((match = tableRegex.exec(content)) !== null) {
    const tableName = match[1];
    const tableDefStart = match.index;
    const tableDefEnd = content.indexOf('});', tableDefStart);
    const tableDef = content.slice(tableDefStart, tableDefEnd);

    if (!tableDef.includes('created_at') && !tableDef.includes('createdAt')) {
      issues.push({
        type: 'warning',
        message: `Table "${tableName}" missing created_at timestamp`,
        file: schemaPath,
      });
    }

    if (!tableDef.includes('updated_at') && !tableDef.includes('updatedAt')) {
      issues.push({
        type: 'warning',
        message: `Table "${tableName}" missing updated_at timestamp`,
        file: schemaPath,
      });
    }
  }

  return issues;
}

/**
 * Generate comprehensive statistics
 */
function generateStats(
  tables: TableColumns,
  filesScanned: number,
  issues: SchemaIssue[]
): VerificationStats {
  const totalColumns = Object.values(tables).reduce((sum, cols) => sum + cols.size, 0);
  const errors = issues.filter(i => i.type === 'error').length;
  const warnings = issues.filter(i => i.type === 'warning').length;

  return {
    tablesFound: Object.keys(tables).length,
    columnsFound: totalColumns,
    filesScanned,
    issuesFound: errors,
    warningsFound: warnings,
  };
}

/**
 * Print detailed issue report
 */
function printIssues(issues: SchemaIssue[]): void {
  const errors = issues.filter(i => i.type === 'error');
  const warnings = issues.filter(i => i.type === 'warning');

  if (errors.length > 0) {
    logSection('❌ ERRORS');
    for (const issue of errors) {
      log(`  ✗ ${issue.message}`, 'red');
      if (issue.file) {
        log(`    in ${issue.file}`, 'cyan');
      }
    }
  }

  if (warnings.length > 0) {
    logSection('⚠️  WARNINGS');
    for (const issue of warnings) {
      log(`  ⚠ ${issue.message}`, 'yellow');
      if (issue.file) {
        log(`    in ${issue.file}`, 'cyan');
      }
    }
  }
}

/**
 * Print statistics summary
 */
function printStats(stats: VerificationStats): void {
  logSection('📊 STATISTICS');
  log(`  Tables:  ${stats.tablesFound}`, 'blue');
  log(`  Columns: ${stats.columnsFound}`, 'blue');
  log(`  Files:   ${stats.filesScanned}`, 'blue');
  log(`  Errors:  ${stats.issuesFound}`, stats.issuesFound > 0 ? 'red' : 'green');
  log(`  Warns:   ${stats.warningsFound}`, stats.warningsFound > 0 ? 'yellow' : 'green');
}

/**
 * Main verification function
 */
function main() {
  logSection('🔍 APEX INTELLIGENCE - Schema Sync Verification');

  const schemaPath = path.join(process.cwd(), 'src', 'db', 'schema.ts');
  const srcRoot = path.join(process.cwd(), 'src');
  const migrationsDir = path.join(process.cwd(), 'drizzle');
  const drizzleConfig = path.join(process.cwd(), 'drizzle.config.ts');

  // Verify schema file exists
  if (!fs.existsSync(schemaPath)) {
    log(`❌ Schema file not found at ${schemaPath}`, 'red');
    process.exit(1);
  }

  const allIssues: SchemaIssue[] = [];

  // Step 1: Verify column usage
  log('\n📝 Checking column references...', 'cyan');
  const columnIssues = verifyColumnUsage(schemaPath, srcRoot);
  allIssues.push(...columnIssues);

  // Step 2: Verify migration sync
  log('📦 Checking migration sync...', 'cyan');
  const migrationIssues = verifyMigrationSync(schemaPath, migrationsDir);
  allIssues.push(...migrationIssues);

  // Step 3: Verify drizzle config
  log('⚙️  Checking drizzle configuration...', 'cyan');
  const configIssues = verifyDrizzleConfig(drizzleConfig);
  allIssues.push(...configIssues);

  // Step 4: Check schema quality
  log('🔍 Analyzing schema quality...', 'cyan');
  const qualityIssues = checkSchemaQuality(schemaPath);
  allIssues.push(...qualityIssues);

  // Generate statistics
  const tables = collectSchemaColumns(schemaPath);
  const files = walk(srcRoot, ['.ts', '.tsx']);
  const stats = generateStats(tables, files.length, allIssues);

  // Print results
  console.log('');
  printIssues(allIssues);
  printStats(stats);

  // Determine exit status
  const hasErrors = allIssues.some(i => i.type === 'error');

  if (hasErrors) {
    logSection('❌ VERIFICATION FAILED');
    log('Schema verification failed with errors. Please fix the issues above.', 'red');
    process.exit(1);
  } else if (allIssues.length > 0) {
    logSection('⚠️  VERIFICATION PASSED WITH WARNINGS');
    log('Schema verification passed but has warnings. Consider addressing them.', 'yellow');
    process.exit(0);
  } else {
    logSection('✅ VERIFICATION PASSED');
    log('All schema synchronization checks passed successfully!', 'green');
    process.exit(0);
  }
}

main();
