/**
 * Database exports
 *
 * This module re-exports the Drizzle ORM database instance from @/db
 * for use across the application. The actual database connection and
 * configuration is managed in apps/web/src/db/index.ts.
 *
 * @see apps/web/src/db/index.ts for connection configuration
 */

// Re-export the Drizzle ORM database instance
// This is what all lib/* modules import when they use `import { db } from '@/lib/db'`
export { db, pool } from '@/db';

// Also export Prisma client for modules that specifically need it
// (e.g., modules using Prisma-specific features or migrations)
export { prisma } from './prisma';

// Type re-exports for convenience
export type { Prisma } from '@prisma/client';
