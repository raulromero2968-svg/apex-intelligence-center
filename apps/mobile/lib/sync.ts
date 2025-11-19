import NetInfo from '@react-native-community/netinfo';
import { syncToServer } from './db';
import * as Sentry from '@sentry/react-native';

let syncInterval: NodeJS.Timeout | null = null;

/**
 * Start automatic background sync when online
 */
export function startBackgroundSync(intervalMs: number = 60000) {
  // Stop any existing sync
  stopBackgroundSync();

  // Listen for network changes
  NetInfo.addEventListener(state => {
    if (state.isConnected) {
      console.log('Network connected, syncing...');
      performSync();
    }
  });

  // Periodic sync when online
  syncInterval = setInterval(async () => {
    const netInfo = await NetInfo.fetch();
    if (netInfo.isConnected) {
      await performSync();
    }
  }, intervalMs);
}

/**
 * Stop background sync
 */
export function stopBackgroundSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}

/**
 * Perform a sync operation
 */
async function performSync() {
  const transaction = Sentry.startTransaction({ name: 'background-sync' });

  try {
    const result = await syncToServer();

    if (result.success) {
      Sentry.addBreadcrumb({
        category: 'sync',
        message: `Synced ${result.synced} items`,
        level: 'info',
      });
    }
  } catch (error) {
    Sentry.captureException(error);
    console.error('Sync error:', error);
  } finally {
    transaction.finish();
  }
}

/**
 * Manually trigger a sync
 */
export async function manualSync() {
  const netInfo = await NetInfo.fetch();

  if (!netInfo.isConnected) {
    throw new Error('No internet connection');
  }

  return await performSync();
}
