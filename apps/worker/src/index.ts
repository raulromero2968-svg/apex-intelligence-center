import * as Sentry from '@sentry/nextjs';

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'production',
    tracesSampleRate: 0.1,
    integrations: [
      Sentry.httpIntegration(),
      Sentry.redisIntegration(),
      Sentry.captureConsoleIntegration({ levels: ['error'] }),
    ],
  });
}

import { varcWorker } from './workers/varcWorker';
import { lampWorker } from './workers/lampWorker';
import { contrarianWorker } from './workers/contrarianWorker';
import { blockchainFloorFeedWorker } from './workers/blockchainFloorFeedWorker';
import { projectOFeedWorker } from './workers/projectOFeedWorker';
import { arbitrageWorker } from './workers/arbitrageWorker';
import { projectOFeedWorker } from './workers/projectOFeedWorker';
import { startDigitalTwinWorker } from './workers/digitalTwinWorker';

console.log('[worker] Starting Intelligence Bus workers...');
console.log('[worker] VARC worker:', varcWorker.name);
console.log('[worker] LAMP worker:', lampWorker.name);
console.log('[worker] Contrarian worker:', contrarianWorker.name);
console.log('[worker] Blockchain floor feed worker:', blockchainFloorFeedWorker.name);
console.log('[worker] Project O feed worker:', projectOFeedWorker.name);
console.log('[worker] Arbitrage worker:', arbitrageWorker.name);
console.log('[worker] Project O feed worker:', projectOFeedWorker.name);

// Start digital twin worker
const shutdownDigitalTwinWorker = startDigitalTwinWorker();
console.log('[worker] Digital twin worker started');

const shutdown = async (signal: string) => {
  console.log(`[worker] Received ${signal}, shutting down gracefully...`);
  
  await Promise.all([
    varcWorker.close(),
    lampWorker.close(),
    contrarianWorker.close(),
    blockchainFloorFeedWorker.close(),
    arbitrageWorker.close(),
    projectOFeedWorker.close(),
  ]);

  console.log('[worker] All workers closed');
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  console.error('[worker] Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[worker] Uncaught Exception:', error);
  process.exit(1);
});

// Start arbitrage worker
arbitrageWorker.start();

// Start Project O feed worker
projectOFeedWorker.start();

console.log('[worker] All workers started successfully');

