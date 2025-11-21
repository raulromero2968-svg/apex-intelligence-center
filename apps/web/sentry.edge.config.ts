import * as Sentry from '@sentry/nextjs';
import { sentryConfig } from './sentry.config';

/**
 * Sentry Edge Configuration
 * Lightweight configuration for edge runtime (limited integrations)
 */
Sentry.init({
  ...sentryConfig,

  // Edge-specific integrations (limited support)
  integrations: [
    Sentry.httpIntegration(),
  ],
});

