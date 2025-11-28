#!/usr/bin/env tsx
/**
 * Database Migration Wrapper (KB-09)
 *
 * Unified migration wrapper supporting both Prisma and Drizzle ORM.
 * Provides safe migration execution with environment validation.
 *
 * Features:
 * - Environment-aware migration (dev vs prod)
 * - Input validation via Zod
 * - Safe error handling
 * - Support for migration naming (dev only)
 *
 * Usage:
 *   pnpm tsx scripts/migrate-prisma.ts dev [migration-name]
 *   pnpm tsx scripts/migrate-prisma.ts prod
 *
 * Trade-offs:
 * - GOOD: Unified interface for different ORMs
 * - BAD: Additional abstraction layer
 * - MITIGATED: Thin wrapper with minimal overhead
 *
 * Note: This project uses Drizzle ORM. For Prisma projects, ensure
 * the prisma CLI is installed and schema.prisma exists.
 */

import { execSync, ExecSyncOptions } from 'child_process';
import { existsSync } from 'fs';
import { z } from 'zod';

// Input validation schema
const ArgsSchema = z.object({
  env: z.enum(['dev', 'prod']),
  name: z.string().optional(),
});

// Detect which ORM is being used
function detectORM(): 'prisma' | 'drizzle' {
  if (existsSync('prisma/schema.prisma')) {
    return 'prisma';
  }
  if (existsSync('drizzle.config.ts') || existsSync('drizzle.config.js')) {
    return 'drizzle';
  }
  // Check for drizzle in packages (monorepo)
  if (existsSync('packages/db/drizzle.config.ts')) {
    return 'drizzle';
  }
  // Default to drizzle for this project
  return 'drizzle';
}

// Execute command with proper error handling
function execCommand(command: string, description: string): void {
  console.log(`\n[migrate] ${description}...`);
  console.log(`[migrate] Running: ${command}\n`);

  const options: ExecSyncOptions = {
    stdio: 'inherit',
    env: { ...process.env },
  };

  try {
    execSync(command, options);
    console.log(`\n[migrate] ${description} completed successfully`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Migration failed: ${message}`);
  }
}

// Prisma migration commands
function migratePrisma(env: 'dev' | 'prod', name?: string): void {
  if (env === 'dev') {
    const migrationName = name || 'update';
    execCommand(
      `npx prisma migrate dev --name ${migrationName}`,
      `Creating dev migration: ${migrationName}`
    );
  } else {
    execCommand('npx prisma migrate deploy', 'Deploying production migrations');
  }
}

// Drizzle migration commands
function migrateDrizzle(env: 'dev' | 'prod', name?: string): void {
  if (env === 'dev') {
    // Generate migration
    const migrationName = name || 'update';
    execCommand(
      `npx drizzle-kit generate --name ${migrationName}`,
      `Generating migration: ${migrationName}`
    );
    // Apply migration
    execCommand('npx drizzle-kit migrate', 'Applying dev migration');
  } else {
    // Production: only apply existing migrations
    execCommand('npx drizzle-kit migrate', 'Applying production migrations');
  }
}

// Main execution
async function main(): Promise<void> {
  console.log('='.repeat(60));
  console.log('DATABASE MIGRATION WRAPPER (KB-09)');
  console.log('='.repeat(60));

  // Parse and validate arguments
  const rawEnv = process.argv[2];
  const rawName = process.argv[3];

  if (!rawEnv) {
    console.error('\nUsage: tsx scripts/migrate-prisma.ts <env> [migration-name]');
    console.error('  env: "dev" or "prod"');
    console.error('  migration-name: Optional name for dev migrations\n');
    console.error('Examples:');
    console.error('  tsx scripts/migrate-prisma.ts dev add-user-table');
    console.error('  tsx scripts/migrate-prisma.ts prod');
    process.exit(1);
  }

  const parseResult = ArgsSchema.safeParse({ env: rawEnv, name: rawName });

  if (!parseResult.success) {
    console.error('\nInvalid arguments:');
    console.error(parseResult.error.format());
    process.exit(1);
  }

  const { env, name } = parseResult.data;

  // Detect ORM
  const orm = detectORM();
  console.log(`\n[migrate] Detected ORM: ${orm}`);
  console.log(`[migrate] Environment: ${env}`);
  if (name) {
    console.log(`[migrate] Migration name: ${name}`);
  }

  // Safety check for production
  if (env === 'prod') {
    console.log('\n[migrate] PRODUCTION MODE - migrations will be applied');
    console.log('[migrate] Ensure you have backups before proceeding');
  }

  // Execute migration
  try {
    if (orm === 'prisma') {
      migratePrisma(env, name);
    } else {
      migrateDrizzle(env, name);
    }

    console.log('\n' + '='.repeat(60));
    console.log('MIGRATION COMPLETE');
    console.log('='.repeat(60) + '\n');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('\n' + '='.repeat(60));
    console.error('MIGRATION FAILED');
    console.error('='.repeat(60));
    console.error(`\nError: ${message}\n`);
    process.exit(1);
  }
}

// Run
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
