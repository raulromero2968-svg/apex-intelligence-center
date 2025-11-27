/**
 * Expo Push Notifications - For development/preview
 * Used during development for easier debugging
 */

import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { db } from '@/db';
import { mobilePushTokens, pushTickets } from '@/db/schema';
import { eq } from 'drizzle-orm';

const expo = new Expo({
  accessToken: process.env.EXPO_ACCESS_TOKEN,
  useFcmV1: true, // Use FCM v1 API
});

export interface ExpoMessage {
  token: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: string;
  badge?: number;
  priority?: 'default' | 'normal' | 'high';
  channelId?: string;
}

export interface ExpoResult {
  success: boolean;
  ticketId?: string;
  error?: string;
}

/**
 * Send Expo push notification
 */
export async function sendExpoMessage(
  userId: string,
  message: ExpoMessage
): Promise<ExpoResult> {
  // Check if token is valid Expo push token
  if (!Expo.isExpoPushToken(message.token)) {
    console.error('❌ Invalid Expo push token:', message.token);
    return {
      success: false,
      error: 'Invalid Expo push token',
    };
  }

  try {
    const expoPushMessage: ExpoPushMessage = {
      to: message.token,
      sound: message.sound || 'default',
      title: message.title,
      body: message.body,
      data: message.data || {},
      badge: message.badge,
      priority: message.priority || 'high',
      channelId: message.channelId,
    };

    const chunks = expo.chunkPushNotifications([expoPushMessage]);
    const tickets: ExpoPushTicket[] = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('❌ Error sending Expo push chunk:', error);
      }
    }

    const ticket = tickets[0];

    if (ticket.status === 'ok') {
      // Create ticket record
      await db.insert(pushTickets).values({
        ticketId: ticket.id,
        userId,
        token: message.token,
        type: 'expo',
        status: 'sent',
        title: message.title,
        body: message.body,
        data: message.data || null,
      });

      return {
        success: true,
        ticketId: ticket.id,
      };
    } else {
      // Handle error ticket
      const errorMessage = ticket.message || 'Unknown error';

      await db.insert(pushTickets).values({
        userId,
        token: message.token,
        type: 'expo',
        status: 'error',
        title: message.title,
        body: message.body,
        data: message.data || null,
        errorMessage,
      });

      // If token is invalid, mark as inactive
      if (ticket.details?.error === 'DeviceNotRegistered') {
        await db
          .update(mobilePushTokens)
          .set({ active: false, updatedAt: new Date() })
          .where(eq(mobilePushTokens.token, message.token));
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  } catch (error: any) {
    console.error('❌ Expo send error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Send Expo push to all user's devices
 */
export async function sendExpoToUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<{ sent: number; failed: number }> {
  const tokens = await db.query.mobilePushTokens.findMany({
    where: eq(mobilePushTokens.userId, userId),
  });

  const expoTokens = tokens.filter(t => t.type === 'expo' && t.active);

  if (expoTokens.length === 0) {
    console.log(`ℹ️  No active Expo tokens for user ${userId}`);
    return { sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  for (const tokenRecord of expoTokens) {
    const result = await sendExpoMessage(userId, {
      token: tokenRecord.token,
      title,
      body,
      data,
    });

    if (result.success) {
      sent++;
      // Update last used timestamp
      await db
        .update(mobilePushTokens)
        .set({ lastUsedAt: new Date() })
        .where(eq(mobilePushTokens.token, tokenRecord.token));
    } else {
      failed++;
    }
  }

  console.log(`📤 Expo sent to user ${userId}: ${sent} sent, ${failed} failed`);
  return { sent, failed };
}

