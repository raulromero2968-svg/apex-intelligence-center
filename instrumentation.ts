/**
 * Next.js Instrumentation Hook
 * Automatically loaded by Next.js for server-side instrumentation
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Server runtime: Import Sentry with full instrumentation
    await import('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge runtime: Import Sentry with limited instrumentation
    await import('./sentry.edge.config');
  }
}

/**
 * Request error handler for automatic error capture
 * Exports from sentry.server.config.ts
 */
export { onRequestError } from './sentry.server.config';
