#!/usr/bin/env tsx
/**
 * Drizzle Migration Wrapper for Apex Intelligence
 *
 * Provides a unified interface for database migrations:
 * - dev: Generate and apply migrations locally (auto-generate SQL)
 * - prod: Apply migrations without prompts (deploy mode)
 *
 * Uses Drizzle ORM (not Prisma) per codebase architecture.
 *
 * @see knowledge-09-database-architecture.md for migration strategies
 *
 * Usage:
 *   tsx scripts/migrate-drizzle.ts dev add-utopia-columns
 *   tsx scripts/migrate-drizzle.ts prod
 *   tsx scripts/migrate-drizzle.ts generate add-corrigibility-flags
 *   tsx scripts/migrate-drizzle.ts push
 */

import { execSync, ExecSyncOptions } from 'child_process';
import { z } from 'zod';
import path from 'path';
import fs from 'fs';

// ANSI colors for terminal output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

function log(message: string, color?: keyof typeof colors) {
  const c = color ? colors[color] : '';
  console.log(`${c}${message}${colors.reset}`);
}

/**
 * Command schema with Zod validation
 */
const CommandSchema = z.object({
  env: z.enum(['dev', 'prod', 'generate', 'push', 'studio', 'check']),
  name: z.string().optional(),
});

/**
 * Execute shell command with error handling
 */
function exec(command: string, options?: ExecSyncOptions): void {
  log(`\n> ${command}`, 'cyan');
  try {
    execSync(command, {
      stdio: 'inherit',
      cwd: process.cwd(),
      ...options,
    });
  } catch (error) {
    throw new Error(`Command failed: ${command}`);
  }
}

/**
 * Verify drizzle.config.ts exists
 */
function verifyDrizzleConfig(): void {
  const configPaths = [
    path.join(process.cwd(), 'drizzle.config.ts'),
    path.join(process.cwd(), 'apps/web/drizzle.config.ts'),
  ];

  const configExists = configPaths.some((p) => fs.existsSync(p));

  if (!configExists) {
    throw new Error(
      'drizzle.config.ts not found. Ensure Drizzle is configured in the project.'
    );
  }
}

/**
 * Generate migration SQL files
 *
 * @param name - Migration name (e.g., 'add-utopia-columns')
 */
function generateMigration(name?: string): void {
  log('\n' + '='.repeat(60), 'bold');
  log('DRIZZLE MIGRATION: Generate', 'cyan');
  log('='.repeat(60) + '\n', 'bold');

  verifyDrizzleConfig();

  const migrationName = name || `migration-${Date.now()}`;
  log(`Generating migration: ${migrationName}`, 'yellow');

  // Use pnpm drizzle-kit generate
  exec(`pnpm drizzle-kit generate --name ${migrationName}`);

  log('\nMigration generated successfully!', 'green');
  log('Review the generated SQL in drizzle/ directory before applying.', 'yellow');
}

/**
 * Apply migrations in development mode
 * Auto-generates and applies migrations with interactive prompts
 *
 * @param name - Migration name for tracking
 */
function devMigration(name?: string): void {
  log('\n' + '='.repeat(60), 'bold');
  log('DRIZZLE MIGRATION: Development', 'cyan');
  log('='.repeat(60) + '\n', 'bold');

  verifyDrizzleConfig();

  const migrationName = name || `dev-${Date.now()}`;
  log(`Running dev migration: ${migrationName}`, 'yellow');

  // Step 1: Generate migration
  log('\nStep 1: Generating migration...', 'cyan');
  exec(`pnpm drizzle-kit generate --name ${migrationName}`);

  // Step 2: Apply migration
  log('\nStep 2: Applying migration...', 'cyan');
  exec('pnpm drizzle-kit migrate');

  log('\nDev migration complete!', 'green');
}

/**
 * Apply migrations in production mode
 * Applies existing migrations without prompts (CI/CD safe)
 */
function prodMigration(): void {
  log('\n' + '='.repeat(60), 'bold');
  log('DRIZZLE MIGRATION: Production', 'cyan');
  log('='.repeat(60) + '\n', 'bold');

  verifyDrizzleConfig();

  log('Applying production migrations...', 'yellow');
  log('WARNING: This will modify the production database!', 'red');

  // Apply migrations without generation (deploy mode)
  exec('pnpm drizzle-kit migrate');

  log('\nProduction migration complete!', 'green');
}

/**
 * Push schema directly to database (dev only, no migrations)
 * Useful for rapid prototyping
 */
function pushSchema(): void {
  log('\n' + '='.repeat(60), 'bold');
  log('DRIZZLE: Push Schema', 'cyan');
  log('='.repeat(60) + '\n', 'bold');

  verifyDrizzleConfig();

  log('Pushing schema directly to database...', 'yellow');
  log('WARNING: This bypasses migrations. Use for dev only!', 'red');

  exec('pnpm drizzle-kit push');

  log('\nSchema push complete!', 'green');
}

/**
 * Open Drizzle Studio for database inspection
 */
function openStudio(): void {
  log('\n' + '='.repeat(60), 'bold');
  log('DRIZZLE: Studio', 'cyan');
  log('='.repeat(60) + '\n', 'bold');

  log('Opening Drizzle Studio...', 'yellow');
  exec('pnpm drizzle-kit studio');
}

/**
 * Check schema consistency
 */
function checkSchema(): void {
  log('\n' + '='.repeat(60), 'bold');
  log('DRIZZLE: Check Schema', 'cyan');
  log('='.repeat(60) + '\n', 'bold');

  verifyDrizzleConfig();

  log('Checking schema consistency...', 'yellow');
  exec('pnpm drizzle-kit check');

  log('\nSchema check complete!', 'green');
}

/**
 * Print usage help
 */
function printHelp(): void {
  log('\nDrizzle Migration Wrapper for Apex Intelligence\n', 'bold');
  log('Usage:', 'cyan');
  log('  tsx scripts/migrate-drizzle.ts <command> [name]\n');
  log('Commands:', 'cyan');
  log('  dev <name>      Generate and apply migration (local/testing)');
  log('  prod            Apply existing migrations (production)');
  log('  generate <name> Generate migration SQL files only');
  log('  push            Push schema directly (bypasses migrations)');
  log('  studio          Open Drizzle Studio');
  log('  check           Check schema consistency\n');
  log('Examples:', 'cyan');
  log('  tsx scripts/migrate-drizzle.ts dev add-utopia-columns');
  log('  tsx scripts/migrate-drizzle.ts generate add-corrigibility-flags');
  log('  tsx scripts/migrate-drizzle.ts prod');
  log('  tsx scripts/migrate-drizzle.ts push\n');
  log('Notes:', 'yellow');
  log('  - Track migrations with git');
  log('  - Test in staging before production');
  log('  - Use pgvector HNSW for TCG embeddings');
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    printHelp();
    process.exit(0);
  }

  // Parse and validate arguments
  const parseResult = CommandSchema.safeParse({
    env: args[0],
    name: args[1],
  });

  if (!parseResult.success) {
    log(`Invalid arguments: ${parseResult.error.message}`, 'red');
    printHelp();
    process.exit(1);
  }

  const { env, name } = parseResult.data;

  try {
    switch (env) {
      case 'dev':
        devMigration(name);
        break;
      case 'prod':
        prodMigration();
        break;
      case 'generate':
        generateMigration(name);
        break;
      case 'push':
        pushSchema();
        break;
      case 'studio':
        openStudio();
        break;
      case 'check':
        checkSchema();
        break;
      default:
        log(`Unknown command: ${env}`, 'red');
        printHelp();
        process.exit(1);
    }

    log('\nMigration task completed successfully!', 'green');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log(`\nMigration failed: ${message}`, 'red');
    process.exit(1);
  }
}

// Run
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
