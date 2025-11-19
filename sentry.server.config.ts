import * as Sentry from '@sentry/nextjs';
import { sentryConfig } from './sentry.config';

/**
 * Sentry Server Configuration
 * Tracks server-side performance with Redis, Postgres, and HTTP spans
 */
Sentry.init({
  ...sentryConfig,

  // Server-specific integrations
  integrations: [
    // HTTP server instrumentation
    Sentry.httpIntegration(),

    // Database instrumentation (Postgres via Prisma/Drizzle)
    Sentry.prismaIntegration(),

    // Redis instrumentation (ioredis support)
    Sentry.redisIntegration(),

    // Console logging (errors only)
    Sentry.captureConsoleIntegration({ levels: ['error'] }),
  ],
});

/**
 * Export request error handler for Next.js instrumentation
 * Used in instrumentation.ts for automatic error capture
 */
export const onRequestError = Sentry.captureRequestError;
