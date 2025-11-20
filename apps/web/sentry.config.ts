/**
 * Shared Sentry Configuration
 * Used by both client and server-side Sentry initialization
 */
export const sentryConfig = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,

  // Environment configuration
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV || 'development',

  // Tracing configuration
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Debug mode (disabled in production)
  debug: process.env.NODE_ENV !== 'production',

  // Enable automatic instrumentation
  enableTracing: true,
};
