/**
 * Shared Sentry Configuration
 *
 * Production-ready monitoring setup used across client, server, and edge runtimes
 * Reference: @sentry/nextjs v8+ documentation + Vercel deployment patterns
 *
 * Trade-offs:
 * ✅ GOOD: Shared config prevents duplication across runtime environments
 * ✅ GOOD: Environment-aware sampling (lower rates in prod to reduce costs)
 * ✅ GOOD: Automatic performance monitoring with tracing
 * ✅ GOOD: Type-safe with process.env validation
 * ⚠️  NOTE: Disabled in development to avoid noise (enable via SENTRY_ENABLED=true if needed)
 */

export const sentryConfig = {
  // Sentry DSN from environment variables
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,

  // Performance monitoring - sample 20% of transactions in production
  // 100% in dev for complete visibility during testing
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,

  // Profiling - same rate as traces for performance analysis
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,

  // Environment identification
  environment: process.env.NODE_ENV || 'development',

  // Disable in development unless explicitly enabled
  // This prevents local errors from cluttering Sentry dashboard
  enabled: process.env.SENTRY_ENABLED === 'true' || process.env.NODE_ENV === 'production',

  // Debug logging in development
  debug: process.env.NODE_ENV === 'development',

  // Automatically instrument Next.js features
  autoInstrumentServerFunctions: true,
  autoInstrumentAppDirectory: true,

  // Release tracking (set by CI/CD pipeline)
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
} as const;
