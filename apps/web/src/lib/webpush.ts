/**
 * Web Push Notifications - VAPID Setup
 *
 * Sends push notifications to browsers using the Web Push API
 * with VAPID authentication for security.
 *
 * Setup:
 * 1. Generate VAPID keys:
 *    npx web-push generate-vapid-keys
 * 2. Set environment variables:
 *    VAPID_PUBLIC_KEY=...
 *    VAPID_PRIVATE_KEY=...
 *    VAPID_SUBJECT=mailto:alerts@apex-intelligence.com
 *
 * Client-side usage:
 * const registration = await navigator.serviceWorker.register('/sw.js');
 * const subscription = await registration.pushManager.subscribe({
 *   userVisibleOnly: true,
 *   applicationServerKey: VAPID_PUBLIC_KEY
 * });
 *
 * Reference: https://web.dev/push-notifications-overview/
 */

import webpush from 'web-push';
import { PushSubscription as DBPushSubscription } from '@/db/schema';

// Configure VAPID details
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:alerts@apex-intelligence.com';

if (!vapidPublicKey || !vapidPrivateKey) {
  console.warn(
    'VAPID keys not configured. Web push notifications will be disabled.\n' +
    'Generate keys with: npx web-push generate-vapid-keys'
  );
} else {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

/**
 * Push notification payload
 */
export interface PushNotificationPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
}

/**
 * Send push notification to a user's subscription
 *
 * @param subscription - Database push subscription record
 * @param payload - Notification payload
 * @returns Success status
 */
export async function sendPushNotification(
  subscription: DBPushSubscription,
  payload: PushNotificationPayload
): Promise<boolean> {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn('VAPID not configured, skipping push notification');
    return false;
  }

  try {
    // Construct Web Push subscription object
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: subscription.keys as { p256dh: string; auth: string },
    };

    // Send notification
    await webpush.sendNotification(
      pushSubscription,
      JSON.stringify(payload),
      {
        TTL: 3600, // 1 hour
        urgency: 'high',
      }
    );

    return true;
  } catch (error: any) {
    // Handle errors
    if (error.statusCode === 404 || error.statusCode === 410) {
      // Subscription expired or invalid - should be removed from database
      console.warn(`Push subscription expired: ${subscription.endpoint}`);
      return false;
    }

    console.error('Error sending push notification:', error);
    return false;
  }
}

/**
 * Verify a push subscription endpoint is valid
 *
 * @param subscription - Web Push subscription object from browser
 * @returns Whether the subscription is valid
 */
export function isValidPushSubscription(subscription: any): boolean {
  return (
    subscription &&
    typeof subscription.endpoint === 'string' &&
    subscription.keys &&
    typeof subscription.keys.p256dh === 'string' &&
    typeof subscription.keys.auth === 'string'
  );
}

/**
 * Get VAPID public key for client-side subscription
 *
 * @returns VAPID public key or null if not configured
 */
export function getVapidPublicKey(): string | null {
  return vapidPublicKey || null;
}
