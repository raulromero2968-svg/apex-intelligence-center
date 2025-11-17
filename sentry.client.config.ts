import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.05,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  environment: process.env.SENTRY_ENV || process.env.NODE_ENV,
  integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
});
