import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  profilesSampleRate: 0.1,
  instrumenter: 'sentry',
  // Keep noise low; adjust later
  integrations: [
    Sentry.captureConsoleIntegration({ levels: ['error'] }),
    Sentry.httpIntegration(),
  ],
  environment: process.env.SENTRY_ENV || process.env.NODE_ENV,
  ignoreErrors: ['AbortError'],
});
