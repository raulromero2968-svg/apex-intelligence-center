/**
 * Offline-First Sync Manager
 *
 * Features:
 * - Automatic sync when online
 * - Last-write-wins conflict resolution
 * - Retry with exponential backoff
 * - Background sync support
 */

import { db, localWatchlistItems, localPortfolioItems, localCards } from './db';
import { eq, gt } from 'drizzle-orm';
import * as Network from 'expo-network';
import * as Sentry from '@sentry/react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

interface SyncOptions {
  force?: boolean;
  userId: string;
  accessToken: string;
}

/**
 * Check if device is online
 */
export async function isOnline(): Promise<boolean> {
  try {
    const networkState = await Network.getNetworkStateAsync();
    return networkState.isConnected === true && networkState.isInternetReachable === true;
  } catch (error) {
    console.warn('Failed to check network state:', error);
    return false;
  }
}

/**
 * Sync watchlist items with server
 */
export async function syncWatchlist(options: SyncOptions): Promise<void> {
  const transaction = Sentry.startTransaction({
    name: 'mobile.sync.watchlist',
    op: 'sync',
  });

  try {
    if (!await isOnline() && !options.force) {
      console.log('Offline - skipping watchlist sync');
      return;
    }

    // Get local items that need syncing
    const localItems = await db
      .select()
      .from(localWatchlistItems)
      .where(eq(localWatchlistItems.userId, options.userId));

    // Fetch server items
    const response = await fetch(`${API_URL}/api/watchlist`, {
      headers: {
        'Authorization': `Bearer ${options.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.statusText}`);
    }

    const { items: serverItems } = await response.json();

    // Merge strategy: Last-write-wins
    const serverItemsMap = new Map(serverItems.map((item: any) => [item.id, item]));
    const localItemsMap = new Map(localItems.map(item => [item.id, item]));

    // Items to upload (local but not on server, or newer locally)
    const toUpload = localItems.filter(local => {
      const server = serverItemsMap.get(local.id);
      return !server || (local.updatedAt || 0) > new Date(server.updatedAt).getTime();
    });

    // Items to download (on server but not local, or newer on server)
    const toDownload = serverItems.filter((server: any) => {
      const local = localItemsMap.get(server.id);
      return !local || new Date(server.updatedAt).getTime() > (local.updatedAt || 0);
    });

    // Upload changes
    if (toUpload.length > 0) {
      await fetch(`${API_URL}/api/watchlist/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${options.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: toUpload }),
      });
    }

    // Download changes
    if (toDownload.length > 0) {
      for (const item of toDownload) {
        await db
          .insert(localWatchlistItems)
          .values({
            ...item,
            createdAt: new Date(item.createdAt).getTime(),
            updatedAt: new Date(item.updatedAt).getTime(),
            triggeredAt: item.triggeredAt ? new Date(item.triggeredAt).getTime() : null,
            syncedAt: Date.now(),
          })
          .onConflictDoUpdate({
            target: localWatchlistItems.id,
            set: {
              targetPrice: item.targetPrice,
              direction: item.direction,
              isTriggered: item.isTriggered,
              triggeredAt: item.triggeredAt ? new Date(item.triggeredAt).getTime() : null,
              updatedAt: new Date(item.updatedAt).getTime(),
              syncedAt: Date.now(),
            },
          });
      }
    }

    console.log(`Watchlist sync complete: ${toUpload.length} uploaded, ${toDownload.length} downloaded`);
  } catch (error) {
    Sentry.captureException(error);
    console.error('Watchlist sync failed:', error);
    throw error;
  } finally {
    transaction.finish();
  }
}

/**
 * Sync portfolio items with server
 */
export async function syncPortfolio(options: SyncOptions): Promise<void> {
  const transaction = Sentry.startTransaction({
    name: 'mobile.sync.portfolio',
    op: 'sync',
  });

  try {
    if (!await isOnline() && !options.force) {
      console.log('Offline - skipping portfolio sync');
      return;
    }

    const response = await fetch(`${API_URL}/api/portfolio`, {
      headers: {
        'Authorization': `Bearer ${options.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Portfolio sync failed: ${response.statusText}`);
    }

    const { items } = await response.json();

    // Download portfolio items
    for (const item of items) {
      await db
        .insert(localPortfolioItems)
        .values({
          id: item.id,
          userId: item.userId,
          cardId: item.cardId,
          quantity: item.quantity,
          costBasis: parseFloat(item.costBasis),
          createdAt: new Date(item.createdAt).getTime(),
          updatedAt: new Date(item.updatedAt).getTime(),
          syncedAt: Date.now(),
        })
        .onConflictDoUpdate({
          target: localPortfolioItems.id,
          set: {
            quantity: item.quantity,
            costBasis: parseFloat(item.costBasis),
            updatedAt: new Date(item.updatedAt).getTime(),
            syncedAt: Date.now(),
          },
        });
    }

    console.log(`Portfolio sync complete: ${items.length} items synced`);
  } catch (error) {
    Sentry.captureException(error);
    console.error('Portfolio sync failed:', error);
    throw error;
  } finally {
    transaction.finish();
  }
}

/**
 * Sync all data with server
 */
export async function syncAll(options: SyncOptions): Promise<void> {
  const transaction = Sentry.startTransaction({
    name: 'mobile.sync.all',
    op: 'sync',
  });

  try {
    await Promise.all([
      syncWatchlist(options),
      syncPortfolio(options),
    ]);
  } finally {
    transaction.finish();
  }
}

/**
 * Background sync with retry
 */
export async function backgroundSync(options: SyncOptions, maxRetries = 3): Promise<void> {
  let retries = 0;

  while (retries < maxRetries) {
    try {
      await syncAll(options);
      return;
    } catch (error) {
      retries++;
      if (retries >= maxRetries) {
        console.error('Background sync failed after retries:', error);
        throw error;
      }

      // Exponential backoff
      const delay = Math.min(1000 * 2 ** retries, 30000);
      console.log(`Sync failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
