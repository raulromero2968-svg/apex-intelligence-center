/**
 * Sentry Client Configuration
 *
 * Initialize Sentry for client-side error tracking.
 * Runs in the browser for capturing frontend errors.
 *
 * Reference: knowledge-04-devops-vercel-advanced.md
 */

import * as Sentry from '@sentry/nextjs';
import { sentryConfig } from './sentry.config';

Sentry.init({
  ...sentryConfig,

  // Client-specific settings
  replaysSessionSampleRate: 0.1, // Record 10% of sessions
  replaysOnErrorSampleRate: 1.0, // Record 100% of sessions with errors

  // Browser tracing integration
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Custom tags for intel report pages
  beforeSend(event) {
    // Add feature flags to events
    if (window.location.pathname.includes('/commons') ||
        window.location.pathname.includes('/intel') ||
        window.location.pathname.includes('/rc-market')) {
      event.tags = {
        ...event.tags,
        'feature.intel_reports': 'true',
      };
    }
    return event;
  },
});
