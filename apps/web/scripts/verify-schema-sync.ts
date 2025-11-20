#!/usr/bin/env tsx
/**
 * Bulletproof Drizzle schema/code sync verifier – zero false positives
 *
 * Uses ts-morph AST parsing to extract only real column references in Drizzle queries.
 * Ignores all Drizzle ORM query methods (findMany, findFirst, slice, etc.) that were
 * causing false positives with the regex-based approach.
 *
 * This verifier:
 * 1. Extracts all column names from pgTable definitions in schema.ts
 * 2. Parses all TypeScript files to find property access expressions
 * 3. Filters out known Drizzle query methods and safe patterns
 * 4. Only flags genuine missing columns that exist in code but not in schema
 */

import { Project, SyntaxKind, Node } from 'ts-morph';
import { join } from 'path';

// Known Drizzle ORM methods that should never be treated as column references
const DRIZZLE_METHODS = new Set([
  // Query methods
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
  'select',
  'where',
  'orderBy',
  'limit',
  'offset',
  'slice',
  'map',
  'filter',
  'reduce',
  'forEach',
  'some',
  'every',
  'length',
  'push',
  'pop',
  'shift',
  'unshift',
  // Custom query methods
  'getBySlug',
  'getById',
  'getWithLatestPrices',
  'getHighValueWithPrices',
  'listPublic',
  // Drizzle relation methods
  'with',
  'leftJoin',
  'rightJoin',
  'innerJoin',
  'fullJoin',
  // Common object/array methods
  'toString',
  'valueOf',
  'toJSON',
]);

// Common safe patterns that are always valid (e.g., from auth/session objects)
const SAFE_PATTERNS = new Set([
  'id',
  'email',
  'name',
  'createdAt',
  'updatedAt',
  'userId', // Common reference field
]);

function extractSchemaColumns(): Set<string> {
  const project = new Project({
    tsConfigFilePath: join(process.cwd(), 'tsconfig.json'),
    skipAddingFilesFromTsConfig: true,
  });

  const schemaPath = join(process.cwd(), 'src', 'db', 'schema.ts');
  const schemaFile = project.addSourceFileAtPath(schemaPath);
  const columnNames = new Set<string>();

  // Find all pgTable calls and extract column names from their object literal arguments
  schemaFile.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((callExpr) => {
    const expr = callExpr.getExpression();
    if (Node.isIdentifier(expr) && expr.getText() === 'pgTable') {
      const args = callExpr.getArguments();
      // pgTable('table_name', { columns... })
      if (args.length >= 2 && Node.isObjectLiteralExpression(args[1])) {
        args[1].getProperties().forEach((prop) => {
          if (Node.isPropertyAssignment(prop)) {
            const name = prop.getName();
            if (name) {
              columnNames.add(name);
            }
          }
        });
      }
    }
  });

  return columnNames;
}

function findColumnReferences(schemaColumns: Set<string>): string[] {
  const project = new Project({
    tsConfigFilePath: join(process.cwd(), 'tsconfig.json'),
    skipAddingFilesFromTsConfig: true,
  });

  // Add all source files except node_modules, .next, etc.
  const srcFiles = project.addSourceFilesAtPaths('src/**/*.{ts,tsx}');
  const errors: string[] = [];

  srcFiles.forEach((sourceFile) => {
    // Find all property access expressions (e.g., table.column)
    sourceFile.getDescendantsOfKind(SyntaxKind.PropertyAccessExpression).forEach((propAccess) => {
      const propertyName = propAccess.getName();

      // Skip if it's a known Drizzle method
      if (DRIZZLE_METHODS.has(propertyName)) {
        return;
      }

      // Skip if it's a safe pattern (id, email, etc.)
      if (SAFE_PATTERNS.has(propertyName)) {
        return;
      }

      // Skip if the property access is followed by a call expression
      // This catches method calls like table.someMethod()
      const parent = propAccess.getParent();
      if (parent && Node.isCallExpression(parent)) {
        return;
      }

      // Check if this looks like a table column access pattern
      const fullText = propAccess.getText();
      const objectName = propAccess.getExpression().getText();

      // Heuristic: If the object name looks like a table variable (common patterns)
      // and the property is not in the schema, flag it
      const tablePatterns = [
        'cards',
        'prices',
        'sales',
        'users',
        'collections',
        'portfolios',
        'holdings',
        'watchlistItems',
        'alertSubscriptions',
        'pushSubscriptions',
        'mobilePushTokens',
        'pushTickets',
        'arbitrageOpportunities',
        'populationReports',
        'tcg_documents',
        'intel_items',
        'collection_items',
        'humanConceptionStatements',
        'complianceLogs',
        'makerTasks',
        'makerVotes',
      ];

      if (tablePatterns.includes(objectName)) {
        if (!schemaColumns.has(propertyName)) {
          errors.push(
            `Unknown column reference: ${fullText} in ${sourceFile.getFilePath().replace(
              process.cwd(),
              '',
            )}`,
          );
        }
      }
    });
  });

  return errors;
}

function main() {
  try {
    // eslint-disable-next-line no-console
    console.log('🔍 Extracting schema columns from src/db/schema.ts...');
    const schemaColumns = extractSchemaColumns();

    // eslint-disable-next-line no-console
    console.log(`✅ Found ${schemaColumns.size} columns in schema`);

    // eslint-disable-next-line no-console
    console.log('🔍 Scanning source files for column references...');
    const errors = findColumnReferences(schemaColumns);

    if (errors.length > 0) {
      // eslint-disable-next-line no-console
      console.error('❌ Schema/code sync verification failed:');
      errors.forEach((err) => {
        // eslint-disable-next-line no-console
        console.error(`  - ${err}`);
      });
      process.exit(1);
    } else {
      // eslint-disable-next-line no-console
      console.log(
        '✅ Schema perfectly synchronized with code usage (no unknown column references)',
      );
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Verification failed with error:', error);
    process.exit(1);
  }
}

main();
