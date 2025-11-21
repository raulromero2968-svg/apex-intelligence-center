/**
 * Database connection with Sentry integration
 *
 * Drizzle ORM configured for PostgreSQL with pgvector support
 */

import * as Sentry from '@sentry/nextjs';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { withRepositories } from './repositories';

// Create PostgreSQL connection pool
// In production, set POSTGRES_URL environment variable
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  // Connection pool settings for serverless environments
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Initialize Drizzle with schema and Sentry logging
const baseDb = drizzle(pool, {
  schema,
  logger: {
    logQuery(query, params) {
      // Only log in development or if explicitly enabled
      if (process.env.NODE_ENV === 'development' || process.env.LOG_DB_QUERIES === 'true') {
        Sentry.addBreadcrumb({
          category: 'db.query',
          level: 'debug',
          data: {
            queryLength: query.length,
            paramsCount: params?.length ?? 0,
            // Don't log full query in production to avoid exposing sensitive data
            query: process.env.NODE_ENV === 'development' ? query.slice(0, 200) : '[redacted]'
          }
        });
      }
    },
  },
});

// Extend db with repository methods
export const db = withRepositories(baseDb);

// Export pool for raw queries if needed (e.g., for pgvector operations)
export { pool };

// Log database initialization
Sentry.addBreadcrumb({
  category: 'db',
  level: 'info',
  message: 'Database connection initialized with Drizzle ORM',
  data: {
    hasConnection: !!pool,
    environment: process.env.NODE_ENV,
  }
});

// Graceful shutdown
if (typeof process !== 'undefined') {
  process.on('SIGTERM', async () => {
    await pool.end();
    Sentry.addBreadcrumb({
      category: 'db',
      level: 'info',
      message: 'Database pool closed on SIGTERM',
    });
  });
}

