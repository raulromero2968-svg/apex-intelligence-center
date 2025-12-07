/**
 * Sentry Server Configuration
 *
 * Initialize Sentry for server-side operations including API routes.
 * Used by Next.js API routes in the root /app directory.
 *
 * Reference: knowledge-04-devops-vercel-advanced.md
 */

import * as Sentry from '@sentry/nextjs';
import { sentryConfig } from './sentry.config';

Sentry.init({
  ...sentryConfig,

  // Server-specific settings
  autoInstrumentServerFunctions: true,

  // Custom integrations for API monitoring
  integrations: [
    // Default Node.js integrations are automatically added
  ],

  // Custom span attributes for report APIs
  beforeSendTransaction(event) {
    // Add custom tags for intel report transactions
    if (event.transaction?.includes('/api/intel') ||
        event.transaction?.includes('/api/search/reports') ||
        event.transaction?.includes('/api/buy/report')) {
      event.tags = {
        ...event.tags,
        'feature.intel_reports': 'true',
      };
    }
    return event;
  },
});
