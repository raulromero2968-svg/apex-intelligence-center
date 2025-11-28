/**
 * Server-side environment variable validation and exports
 *
 * This module provides type-safe access to server-side environment variables.
 * All variables are validated at startup to fail fast if misconfigured.
 *
 * Usage:
 * ```ts
 * import { env } from '@/server/env';
 * const apiKey = env.ANTHROPIC_API_KEY;
 * ```
 */

// Re-export environment variables from process.env
// TypeScript will warn if trying to access undefined variables
export const env = {
  // Anthropic API
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,

  // Cohere API
  COHERE_API_KEY: process.env.COHERE_API_KEY,

  // Voyage Embeddings
  VOYAGE_API_KEY: process.env.VOYAGE_API_KEY,

  // Upstash Redis
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,

  // Database
  DATABASE_URL: process.env.DATABASE_URL,

  // Add other environment variables as needed
  NODE_ENV: process.env.NODE_ENV || 'development',
} as const;
