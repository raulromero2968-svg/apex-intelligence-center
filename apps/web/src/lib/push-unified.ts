/**
 * Unified Push Notification System
 * Automatically sends to both FCM and Expo tokens
 */

import { sendFCMToUser } from './push-fcm';
import { sendExpoToUser } from './push-expo';

export interface PushNotification {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

export interface PushResult {
  fcm: { sent: number; failed: number };
  expo: { sent: number; failed: number };
  total: { sent: number; failed: number };
}

/**
 * Send push notification to all user's devices (FCM + Expo)
 */
export async function sendPushToUser(
  notification: PushNotification
): Promise<PushResult> {
  const { userId, title, body, data } = notification;

  // Convert data to string values for FCM (FCM only accepts string values)
  const fcmData = data
    ? Object.entries(data).reduce((acc, [key, value]) => {
        acc[key] = typeof value === 'string' ? value : JSON.stringify(value);
        return acc;
      }, {} as Record<string, string>)
    : undefined;

  // Send to both FCM and Expo in parallel
  const [fcmResult, expoResult] = await Promise.all([
    sendFCMToUser(userId, title, body, fcmData),
    sendExpoToUser(userId, title, body, data),
  ]);

  const total = {
    sent: fcmResult.sent + expoResult.sent,
    failed: fcmResult.failed + expoResult.failed,
  };

  console.log(
    `📤 Push sent to user ${userId}: ${total.sent} sent, ${total.failed} failed`
  );

  return {
    fcm: fcmResult,
    expo: expoResult,
    total,
  };
}

/**
 * Send price alert notification
 */
export async function sendPriceAlert(
  userId: string,
  cardName: string,
  currentPrice: number,
  targetPrice: number,
  cardId: string
): Promise<PushResult> {
  return sendPushToUser({
    userId,
    title: '💰 Price Alert',
    body: `${cardName} hit $${currentPrice.toFixed(2)}! Your target was $${targetPrice.toFixed(2)}`,
    data: {
      type: 'price_alert',
      cardId,
      currentPrice: currentPrice.toString(),
      targetPrice: targetPrice.toString(),
    },
  });
}

/**
 * Send new listing notification
 */
export async function sendNewListingAlert(
  userId: string,
  cardName: string,
  price: number,
  marketplace: string,
  cardId: string
): Promise<PushResult> {
  return sendPushToUser({
    userId,
    title: '🆕 New Listing',
    body: `${cardName} listed at $${price.toFixed(2)} on ${marketplace}`,
    data: {
      type: 'new_listing',
      cardId,
      price: price.toString(),
      marketplace,
    },
  });
}

/**
 * Send arbitrage opportunity notification
 */
export async function sendArbitrageAlert(
  userId: string,
  cardName: string,
  profit: number,
  profitPercent: number,
  cardId: string
): Promise<PushResult> {
  return sendPushToUser({
    userId,
    title: '💎 Arbitrage Opportunity',
    body: `${cardName}: $${profit.toFixed(2)} profit (${profitPercent.toFixed(1)}%)`,
    data: {
      type: 'arbitrage',
      cardId,
      profit: profit.toString(),
      profitPercent: profitPercent.toString(),
    },
  });
}

/**
 * Send market trend notification
 */
export async function sendMarketTrendAlert(
  userId: string,
  cardName: string,
  trend: 'up' | 'down',
  changePercent: number,
  cardId: string
): Promise<PushResult> {
  const emoji = trend === 'up' ? '📈' : '📉';
  const direction = trend === 'up' ? 'up' : 'down';

  return sendPushToUser({
    userId,
    title: `${emoji} Market Trend`,
    body: `${cardName} is trending ${direction} by ${Math.abs(changePercent).toFixed(1)}%`,
    data: {
      type: 'market_trend',
      cardId,
      trend,
      changePercent: changePercent.toString(),
    },
  });
}
