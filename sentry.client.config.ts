import * as Sentry from '@sentry/nextjs';
import { sentryConfig } from './sentry.config';

/**
 * Sentry Client Configuration
 * Tracks browser performance, errors, and user sessions with replay
 */
Sentry.init({
  ...sentryConfig,

  // Client-specific integrations
  integrations: [
    // Browser performance tracking (Web Vitals: LCP, FID, CLS)
    Sentry.browserTracingIntegration(),

    // Session replay with error recording
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),

    // HTTP client instrumentation
    Sentry.httpClientIntegration(),
  ],

  // Session replay settings
  replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
  replaysSessionSampleRate: 0.1, // 10% of normal sessions
});
