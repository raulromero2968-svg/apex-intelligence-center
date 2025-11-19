import * as Sentry from '@sentry/nextjs';

/**
 * Shared Sentry configuration for Edge, Server, and Client
 * Based on production patterns from Vercel, Linear, and Resend
 */
export const sentryConfig: Sentry.NodeOptions = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENV || process.env.NODE_ENV || 'development',
  release: process.env.VERCEL_GIT_COMMIT_SHA || 'local',

  // Performance monitoring (100% in prod - reduce to 0.2 for high-traffic)
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 1.0 : 1.0,
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 1.0 : 1.0,

  // Cross-domain tracing
  tracePropagationTargets: [
    /^https:\/\/apex-intelligence\.com/,
    /^https:\/\/.*\.vercel\.app/,
    'localhost',
  ],

  // Filter known harmless errors
  beforeSend(event) {
    // ResizeObserver loop limit exceeded (harmless browser quirk)
    if (event.exception?.values?.[0]?.value?.includes('ResizeObserver loop')) {
      return null;
    }

    // Hydration mismatches in development
    if (
      process.env.NODE_ENV === 'development' &&
      event.exception?.values?.[0]?.value?.includes('Hydration')
    ) {
      return null;
    }

    return event;
  },

  // Ignore common errors that don't require action
  ignoreErrors: [
    'AbortError',
    'ResizeObserver loop',
    'Non-Error promise rejection',
    // Network errors that are expected
    'NetworkError',
    'Failed to fetch',
  ],
};
