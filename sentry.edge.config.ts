import * as Sentry from '@sentry/nextjs';
import { sentryConfig } from './sentry.config';

/**
 * Sentry Edge Runtime Configuration
 * Minimal instrumentation for Vercel Edge Functions
 *
 * Note: Edge runtime has limited API access (no Node.js APIs like fs, crypto, etc.)
 * Use only Edge-compatible integrations
 */
Sentry.init({
  ...sentryConfig,

  // Edge-compatible integrations only
  integrations: [
    // HTTP client tracking for fetch() calls
    Sentry.httpClientIntegration(),
  ],
});
