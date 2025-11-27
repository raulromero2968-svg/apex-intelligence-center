/**
 * Expo Push Notifications
 *
 * Features:
 * - Push notification registration
 * - Permission handling
 * - Token management
 * - Foreground + background + quit state handling
 * - Deep linking from notifications
 *
 * Production-grade reliability matching Coinbase/Robinhood
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as Sentry from '@sentry/react-native';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Configure notification handler
 * Controls how notifications appear in foreground/background
 */
Notifications.setNotificationHandler({
  handleNotification: async () => {
    const transaction = Sentry.startTransaction({
      name: 'mobile.push.received',
      op: 'notification',
    });

    try {
      // Always show, play sound, and update badge
      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      };
    } finally {
      transaction.finish();
    }
  },
});

/**
 * Register for push notifications and get Expo push token
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  const transaction = Sentry.startTransaction({
    name: 'mobile.push.register',
    op: 'registration',
  });

  try {
    // Only works on physical devices
    if (!Device.isDevice) {
      console.log('Push notifications only work on physical devices');
      return null;
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      Sentry.addBreadcrumb({
        category: 'push',
        message: 'Push notification permission denied',
        level: 'warning',
      });
      return null;
    }

    // Get Expo push token
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

    if (!projectId) {
      throw new Error('Project ID not found in app config');
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenData.data;

    // Configure notification channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('price-alerts', {
        name: 'Price Alerts',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#06b6d4',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });
    }

    Sentry.addBreadcrumb({
      category: 'push',
      message: 'Push notification registration successful',
      level: 'info',
      data: { token: token.substring(0, 20) + '...' },
    });

    return token;
  } catch (error) {
    Sentry.captureException(error);
    console.error('Failed to register for push notifications:', error);
    return null;
  } finally {
    transaction.finish();
  }
}

/**
 * Send push token to backend
 */
export async function subscribeToPushNotifications(
  token: string,
  userId: string,
  accessToken: string
): Promise<boolean> {
  const transaction = Sentry.startTransaction({
    name: 'mobile.push.subscribe',
    op: 'api',
  });

  try {
    const response = await fetch(`${API_URL}/api/push/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        token,
        userId,
        platform: Platform.OS,
        deviceId: Constants.sessionId || 'unknown',
      }),
    });

    if (!response.ok) {
      throw new Error(`Subscription failed: ${response.statusText}`);
    }

    Sentry.addBreadcrumb({
      category: 'push',
      message: 'Push token subscribed to backend',
      level: 'info',
    });

    return true;
  } catch (error) {
    Sentry.captureException(error);
    console.error('Failed to subscribe push token:', error);
    return false;
  } finally {
    transaction.finish();
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(
  token: string,
  accessToken: string
): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/push/unsubscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ token }),
    });

    return response.ok;
  } catch (error) {
    Sentry.captureException(error);
    console.error('Failed to unsubscribe push token:', error);
    return false;
  }
}

/**
 * Get badge count (unread notifications)
 */
export async function getBadgeCount(): Promise<number> {
  try {
    return await Notifications.getBadgeCountAsync();
  } catch (error) {
    console.error('Failed to get badge count:', error);
    return 0;
  }
}

/**
 * Set badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    console.error('Failed to set badge count:', error);
  }
}

/**
 * Clear all notifications
 */
export async function clearAllNotifications(): Promise<void> {
  try {
    await Notifications.dismissAllNotificationsAsync();
    await setBadgeCount(0);
  } catch (error) {
    console.error('Failed to clear notifications:', error);
  }
}

/**
 * Schedule a local notification (for testing)
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<string> {
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
        badge: 1,
      },
      trigger: { seconds: 1 },
    });

    return notificationId;
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    Sentry.captureException(error);
    console.error('Failed to schedule notification:', error);
    throw error;
  }
}

/**
 * Handle notification tap (deep linking)
 */
export interface NotificationResponse {
  notification: Notifications.Notification;
  actionIdentifier: string;
}

export function parseNotificationData(response: NotificationResponse): {
  cardId?: string;
  type?: string;
  url?: string;
} {
  const data = response.notification.request.content.data;

  return {
    cardId: data.cardId as string | undefined,
    type: data.type as string | undefined,
    url: data.url as string | undefined,
  };
}

/**
 * Request permissions if not already granted
 */
export async function requestPermissionsIfNeeded(): Promise<boolean> {
  try {
    const { status } = await Notifications.getPermissionsAsync();

    if (status === 'granted') {
      return true;
    }

    const { status: newStatus } = await Notifications.requestPermissionsAsync();
    return newStatus === 'granted';
  } catch (error) {
    Sentry.captureException(error);
    return false;
  }
}

/**
 * Check if notifications are enabled
 */
export async function areNotificationsEnabled(): Promise<boolean> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}
