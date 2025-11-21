/**
 * Schema Synchronization Script
 * 
 * Compares applied migrations with schema definition to detect drift.
 * Exits with non-zero code if drift is detected.
 * 
 * Usage:
 *   tsx packages/db/scripts/schema-sync.ts        # Check only
 *   tsx packages/db/scripts/schema-sync.ts --fix # Auto-run migrations
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { readdir } from 'fs/promises';
import { join } from 'path';
import { Pool } from 'pg';
import { createLogger } from '@apex/shared/logger';

const logger = createLogger('schema-sync', 'info');

interface MigrationFile {
  name: string;
  path: string;
}

async function getMigrationFiles(migrationsDir: string): Promise<MigrationFile[]> {
  try {
    const files = await readdir(migrationsDir);
    return files
      .filter((file) => file.endsWith('.sql'))
      .map((file) => ({
        name: file,
        path: join(migrationsDir, file),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    logger.error('Failed to read migrations directory', {
      error: error instanceof Error ? error.message : String(error),
      migrationsDir,
    });
    throw error;
  }
}

async function getAppliedMigrations(pool: Pool): Promise<string[]> {
  try {
    // Query the drizzle migrations table
    const result = await pool.query(`
      SELECT name 
      FROM drizzle.__drizzle_migrations 
      ORDER BY created_at ASC
    `);

    return result.rows.map((row: { name: string }) => row.name);
  } catch (error) {
    // If migrations table doesn't exist, return empty array
    if (error instanceof Error && (error.message.includes('does not exist') || error.message.includes('relation') && error.message.includes('does not exist'))) {
      logger.info('Migrations table does not exist - no migrations applied yet');
      return [];
    }
    throw error;
  }
}

async function checkSchemaDrift(
  migrationFiles: MigrationFile[],
  appliedMigrations: string[]
): Promise<{ hasDrift: boolean; pendingMigrations: string[] }> {
  const migrationNames = migrationFiles.map((f) => f.name);
  const pendingMigrations = migrationNames.filter(
    (name) => !appliedMigrations.includes(name)
  );

  const hasDrift = pendingMigrations.length > 0;

  return { hasDrift, pendingMigrations };
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const shouldFix = args.includes('--fix');

  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  if (!databaseUrl) {
    logger.error('DATABASE_URL or POSTGRES_URL environment variable is required');
    process.exit(1);
  }

  // Determine migrations directory
  // This script is in packages/db/scripts/, so migrations are in apps/web/drizzle/
  // Use process.cwd() to get repo root when running via tsx
  const repoRoot = process.cwd();
  const migrationsDir = join(repoRoot, 'apps/web/drizzle');

  logger.info('Starting schema synchronization check', {
    migrationsDir,
    shouldFix,
  });

  try {
    // Get migration files
    const migrationFiles = await getMigrationFiles(migrationsDir);
    logger.info(`Found ${migrationFiles.length} migration files`);

    if (migrationFiles.length === 0) {
      logger.warn('No migration files found');
      process.exit(0);
    }

    // Connect to database
    const pool = new Pool({
      connectionString: databaseUrl,
    });

    const db = drizzle(pool);

    // Get applied migrations
    const appliedMigrations = await getAppliedMigrations(pool);
    logger.info(`Found ${appliedMigrations.length} applied migrations`);

    // Check for drift
    const { hasDrift, pendingMigrations } = await checkSchemaDrift(
      migrationFiles,
      appliedMigrations
    );

    if (hasDrift) {
      logger.error('Schema drift detected', {
        pendingMigrations,
        totalPending: pendingMigrations.length,
      });

      if (shouldFix) {
        logger.info('Running pending migrations...');
        try {
          await migrate(db, { migrationsFolder: migrationsDir });
          logger.info('Migrations applied successfully');
          await pool.end();
          process.exit(0);
        } catch (error) {
          logger.error('Failed to apply migrations', {
            error: error instanceof Error ? error.message : String(error),
          });
          await pool.end();
          process.exit(1);
        }
      } else {
        logger.error(
          'Schema drift detected. Run with --fix to auto-apply migrations.'
        );
        process.exit(1);
      }
    } else {
      logger.info('Schema is in sync - no drift detected');
      await pool.end();
      process.exit(0);
    }
  } catch (error) {
    logger.error('Schema sync check failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  }
}

main().catch((error) => {
  logger.error('Unhandled error in schema-sync', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
  process.exit(1);
});

