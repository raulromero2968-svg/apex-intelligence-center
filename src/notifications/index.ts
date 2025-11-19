/**
 * Multi-Channel Notification System for Apex Intelligence
 *
 * Supports:
 * - Discord webhooks
 * - Telegram bot
 * - Email (SendGrid)
 * - Web Push (Web Push API)
 *
 * Respects user alert subscriptions and channel preferences.
 */

import { Webhook as DiscordWebhook } from 'discord-webhook-node';
import TelegramBot from 'node-telegram-bot-api';
import webpush from 'web-push';
import { db } from '@/db';
import { alertSubscriptions, pushSubscriptions } from '@/db/schema';
import { eq, and, or, isNull } from 'drizzle-orm';
import { PopDeltaAlert, formatPopDeltaMessage } from '@/jobs/pop-delta/detector.job';
import * as Sentry from '@sentry/nextjs';

/**
 * Discord Webhook
 */
const discordWebhook = process.env.DISCORD_WEBHOOK_URL
  ? new DiscordWebhook(process.env.DISCORD_WEBHOOK_URL)
  : null;

if (discordWebhook) {
  discordWebhook.setUsername('Apex Intelligence');
  discordWebhook.setAvatar('https://apex.tcgaisociety.com/logo.png');
}

/**
 * Telegram Bot
 */
const telegramBot = process.env.TELEGRAM_BOT_TOKEN
  ? new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false })
  : null;

/**
 * Web Push Configuration
 */
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:support@apex.tcgaisociety.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

/**
 * Send Pop Delta notifications to all subscribed users
 *
 * @param alert - Pop delta alert data
 */
export async function sendPopDeltaNotifications(alert: PopDeltaAlert): Promise<void> {
  try {
    // Get all users subscribed to this card or all pop delta alerts
    const subscriptions = await db.query.alertSubscriptions.findMany({
      where: and(
        eq(alertSubscriptions.alertType, 'pop_delta'),
        eq(alertSubscriptions.isActive, true),
        or(
          eq(alertSubscriptions.cardId, alert.cardId),
          isNull(alertSubscriptions.cardId) // Subscribed to all cards
        )
      ),
    });

    console.log(
      `[Notifications] Sending pop delta alert for ${alert.cardName} to ${subscriptions.length} subscribers`
    );

    // Send to each subscriber based on their channel preferences
    for (const sub of subscriptions) {
      // Check if alert meets user's threshold
      if (Math.abs(alert.deltaPct30d) < sub.threshold) {
        continue; // Skip if below user's threshold
      }

      const channels = sub.channels as string[];
      const message = formatPopDeltaMessage(alert);

      // Send to each preferred channel
      for (const channel of channels) {
        try {
          switch (channel) {
            case 'discord':
              await sendDiscordAlert(message);
              break;
            case 'telegram':
              await sendTelegramAlert(sub.userId, message);
              break;
            case 'email':
              await sendEmailAlert(sub.userId, 'Pop Delta Alert', message);
              break;
            case 'push':
              await sendPushNotification(sub.userId, alert.cardId, message);
              break;
          }
        } catch (channelError) {
          Sentry.captureException(channelError, {
            extra: {
              channel,
              userId: sub.userId,
              alertCardId: alert.cardId,
            },
          });
          console.error(`[Notifications] ${channel} failed for user ${sub.userId}:`, channelError);
        }
      }
    }
  } catch (error) {
    Sentry.captureException(error, {
      extra: { alert },
    });
    console.error('[Notifications] Pop delta notification failed:', error);
  }
}

/**
 * Send Discord alert
 */
export async function sendDiscordAlert(message: string): Promise<void> {
  if (!discordWebhook) {
    console.warn('[Discord] Webhook not configured');
    return;
  }

  try {
    await discordWebhook.send(message);
  } catch (error) {
    console.error('[Discord] Send failed:', error);
    throw error;
  }
}

/**
 * Send Telegram alert
 */
export async function sendTelegramAlert(userId: string, message: string): Promise<void> {
  if (!telegramBot || !process.env.TELEGRAM_CHAT_ID) {
    console.warn('[Telegram] Bot not configured');
    return;
  }

  try {
    // In production, userId would map to telegram chat_id
    // For now, send to configured chat
    await telegramBot.sendMessage(process.env.TELEGRAM_CHAT_ID, message);
  } catch (error) {
    console.error('[Telegram] Send failed:', error);
    throw error;
  }
}

/**
 * Send Email alert (placeholder - integrate with SendGrid/Resend)
 */
export async function sendEmailAlert(
  userId: string,
  subject: string,
  message: string
): Promise<void> {
  // TODO: Integrate with SendGrid/Resend
  console.log('[Email] Would send:', { userId, subject, message: message.slice(0, 100) });

  // Example SendGrid integration:
  // const sgMail = require('@sendgrid/mail');
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // await sgMail.send({
  //   to: userEmail,
  //   from: 'alerts@apex.tcgaisociety.com',
  //   subject,
  //   text: message,
  // });
}

/**
 * Send Web Push notification
 */
export async function sendPushNotification(
  userId: string,
  cardId: string | null,
  message: string
): Promise<void> {
  try {
    // Get user's push subscriptions
    const subs = await db.query.pushSubscriptions.findMany({
      where: and(
        eq(pushSubscriptions.userId, userId),
        cardId 
          ? or(eq(pushSubscriptions.cardId, cardId), isNull(pushSubscriptions.cardId))
          : isNull(pushSubscriptions.cardId)
      ),
    });

    for (const sub of subs) {
      try {
        const payload = JSON.stringify({
          title: 'Apex Intelligence Alert',
          body: message.slice(0, 200), // First 200 chars
          icon: '/logo-192.png',
          badge: '/badge-72.png',
          data: {
            cardId,
            url: cardId ? `/card/${cardId}` : '/dashboard/alerts',
          },
        });

        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys as { p256dh: string; auth: string },
          },
          payload
        );
      } catch (pushError) {
        // Remove invalid subscription
        if ((pushError as any).statusCode === 410) {
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
        }
        throw pushError;
      }
    }
  } catch (error) {
    console.error('[Push] Send failed:', error);
    throw error;
  }
}

/**
 * Send Arbitrage opportunity notification
 */
export async function sendArbitrageNotification(opportunity: any): Promise<void> {
  const message = `🔥 ARBITRAGE OPPORTUNITY 🔥

${opportunity.card.name} ${opportunity.card.setName}
${opportunity.buySource.toUpperCase()} Buy: $${opportunity.buyPrice.toFixed(0)}
US Sell: $${opportunity.sellPrice.toFixed(0)}
Spread: ${opportunity.spreadPct.toFixed(1)}% (risk-adjusted)
Liquidity: ${opportunity.liquidity}

🔗 View: https://apex.tcgaisociety.com/arbitrage/${opportunity.id}`;

  // Send to all arbitrage subscribers
  if (discordWebhook) {
    await sendDiscordAlert(message);
  }

  if (telegramBot && process.env.TELEGRAM_CHAT_ID) {
    await sendTelegramAlert('arbitrage', message);
  }
}

/**
 * Send Price Spike notification
 */
export async function sendPriceSpikeNotification(spike: any): Promise<void> {
  const message = `📈 PRICE SPIKE ALERT

${spike.card.name} ${spike.card.setName}
Current: $${spike.currentPrice.toFixed(0)}
24h Change: +${spike.changePercent.toFixed(1)}%
Volume: ${spike.volume24h} sales

🔗 View: https://apex.tcgaisociety.com/card/${spike.cardId}`;

  // Send to subscribers
  if (discordWebhook) {
    await sendDiscordAlert(message);
  }
}
