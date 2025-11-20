/**
 * Database barrel export - Centralized DB access point
 *
 * Re-exports:
 * - Drizzle database instance and pool from @/db
 * - Schema tables and types from @/db/schema
 * - Repository methods from @/db/repositories
 * - Prisma client (legacy, for backwards compatibility)
 *
 * This provides a single import path for all database operations.
 */

// Re-export main database instance and pool
export { db, pool } from '@/db';

// Re-export all schema tables and types
export * from '@/db/schema';

// Re-export repository utilities
export { withRepositories, createCollectionsRepository, createCollectionItemsRepository } from '@/db/repositories';

// Re-export Prisma client for backwards compatibility (legacy code uses this)
export { prisma } from './prisma';
