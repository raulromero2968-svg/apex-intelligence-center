/**
 * Database connection for root app
 *
 * Connects to the Power Network schema for the Luminous visualization
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as powerNetworkSchema from '@apex/db/src/schema/powerNetwork';

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Initialize Drizzle with power network schema
export const db = drizzle(pool, {
  schema: powerNetworkSchema,
});

// Re-export the tables for convenience
export const { powerEntities, powerRelationships } = powerNetworkSchema;

// Export pool for raw queries if needed
export { pool };
