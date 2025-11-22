/**
 * Drizzle Kit Configuration
 *
 * Configuration for database migrations and introspection.
 * Strict mode enabled to catch schema inconsistencies early.
 */

import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  strict: true,
  verbose: true,
  dbCredentials: {
    url: process.env.POSTGRES_URL || process.env.DATABASE_URL || '',
  },
} satisfies Config;
