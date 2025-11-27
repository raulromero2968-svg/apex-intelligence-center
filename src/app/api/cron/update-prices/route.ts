/**
 * Price Update Cron Worker - Real-time Alert Trigger
 *
 * This endpoint should be called by Vercel Cron (every 1-5 minutes)
 * to check for price changes and trigger alerts.
 *
 * Features:
 * - Fetch latest prices from external sources
 * - Compare with cached prices in Redis
 * - Publish price updates to Redis pub/sub
 * - Trigger web push notifications for watchlist matches
 * - Update watchlist notification status
 *
 * Vercel cron configuration (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/update-prices",
 *     "schedule": "*/5 * * * *"
 *   }]
 * }
 *
 * Production patterns from knowledge-10-api-realtime.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { watchlistItems, pushSubscriptions, cards, prices } from '@/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import {
  getCachedCardPrice,
  cacheCardPrice,
  publishPriceUpdate,
  PriceUpdatePayload,
} from '@/lib/redis';
import { WatchlistConfig } from '@/lib/edge-config';
import { sendPushNotification } from '@/lib/webpush';

/**
 * Verify cron secret to prevent unauthorized access
 */
function verifyCronSecret(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    // If no secret is set, only allow in development
    return process.env.NODE_ENV === 'development';
  }

  return authHeader === `Bearer ${cronSecret}`;
}

/**
 * GET /api/cron/update-prices - Triggered by Vercel Cron
 */
export async function GET(req: NextRequest) {
  // Verify authorization
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const startTime = Date.now();
    let pricesChecked = 0;
    let alertsTriggered = 0;
    let pushNotificationsSent = 0;

    // Get config values
    const minChangePercent = await WatchlistConfig.getMinChangePercent();
    const isPushEnabled = await WatchlistConfig.isPushEnabled();

    // Get all unique cards that are being watched
    const watchedCardIds = await db
      .selectDistinct({ cardId: watchlistItems.cardId })
      .from(watchlistItems);

    console.log(`Checking prices for ${watchedCardIds.length} watched cards`);

    for (const { cardId } of watchedCardIds) {
      try {
        // Fetch card details
        const card = await db.query.cards.findFirst({
          where: eq(cards.id, cardId),
        });

        if (!card) {
          console.warn(`Card ${cardId} not found`);
          continue;
        }

        // Fetch latest price from database (most recent price entry)
        const latestPrice = await db.query.prices.findFirst({
          where: eq(prices.cardId, cardId),
          orderBy: (prices, { desc }) => [desc(prices.date)],
        });

        if (!latestPrice) {
          console.warn(`No price data for card ${cardId}`);
          continue;
        }

        const currentPrice = latestPrice.market;
        pricesChecked++;

        // Get cached previous price
        const previousPrice = await getCachedCardPrice(cardId);

        // Calculate change percentage
        const changePercent = previousPrice
          ? ((currentPrice - previousPrice) / previousPrice) * 100
          : 0;

        // Check if change is significant enough to notify
        if (Math.abs(changePercent) >= minChangePercent) {
          console.log(
            `Significant price change for ${card.name}: ${previousPrice} -> ${currentPrice} (${changePercent.toFixed(2)}%)`
          );

          // Publish to Redis pub/sub for real-time streaming
          const payload: PriceUpdatePayload = {
            cardId,
            price: currentPrice,
            previousPrice: previousPrice ?? undefined,
            changePercent,
            timestamp: new Date().toISOString(),
            source: latestPrice.source,
          };

          await publishPriceUpdate(cardId, payload);

          // Find all watchlist items for this card that should be notified
          const itemsToNotify = await db.query.watchlistItems.findMany({
            where: and(
              eq(watchlistItems.cardId, cardId),
              eq(watchlistItems.notified, false)
            ),
            with: {
              user: true,
            },
          });

          for (const item of itemsToNotify) {
            // Check if target price condition is met (if set)
            let shouldNotify = true;

            if (item.targetPrice && item.direction) {
              if (item.direction === 'above') {
                shouldNotify = currentPrice >= item.targetPrice;
              } else if (item.direction === 'below') {
                shouldNotify = currentPrice <= item.targetPrice;
              }
            }

            if (shouldNotify) {
              alertsTriggered++;

              // Mark as notified
              await db
                .update(watchlistItems)
                .set({ notified: true, updatedAt: new Date() })
                .where(eq(watchlistItems.id, item.id));

              // Send web push notifications
              if (isPushEnabled) {
                const userPushSubs = await db.query.pushSubscriptions.findMany({
                  where: eq(pushSubscriptions.userId, item.userId),
                });

                for (const sub of userPushSubs) {
                  try {
                    await sendPushNotification(sub, {
                      title: `${card.name} Price Alert!`,
                      body: `Now at $${currentPrice.toFixed(2)} (${changePercent > 0 ? '+' : ''}${changePercent.toFixed(1)}%)`,
                      url: `/cards/${card.id}`,
                      icon: '/icons/price-alert.png',
                      badge: '/icons/badge.png',
                      data: {
                        cardId,
                        price: currentPrice,
                        changePercent,
                      },
                    });
                    pushNotificationsSent++;
                  } catch (error) {
                    console.error(
                      `Failed to send push notification to user ${item.userId}:`,
                      error
                    );
                  }
                }
              }
            }
          }
        }

        // Update cached price
        await cacheCardPrice(cardId, currentPrice);
      } catch (error) {
        console.error(`Error processing card ${cardId}:`, error);
        // Continue with next card
      }
    }

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      stats: {
        pricesChecked,
        alertsTriggered,
        pushNotificationsSent,
        durationMs: duration,
      },
    });
  } catch (error) {
    console.error('Error in price update cron:', error);
    return NextResponse.json(
      {
        error: 'Failed to update prices',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
