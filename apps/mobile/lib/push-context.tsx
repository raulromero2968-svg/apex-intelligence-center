/**
 * Push Notification Context
 * Provides push notification state and handlers throughout the app
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  getPushToken,
  setupForegroundNotificationHandler,
  setupNotificationResponseHandler,
  setupTokenRefreshListener,
  arePushNotificationsEnabled,
} from './push-hybrid';

interface PushContextValue {
  token: string | null;
  isEnabled: boolean;
  isLoading: boolean;
  error: Error | null;
  requestPermission: () => Promise<void>;
}

const PushContext = createContext<PushContextValue | undefined>(undefined);

export function PushProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const requestPermission = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { token: newToken } = await getPushToken();
      setToken(newToken);
      setIsEnabled(true);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setIsEnabled(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check if push notifications are already enabled
    arePushNotificationsEnabled().then((enabled) => {
      setIsEnabled(enabled);
      if (enabled) {
        requestPermission();
      } else {
        setIsLoading(false);
      }
    });

    // Setup foreground notification handler
    const foregroundSubscription = setupForegroundNotificationHandler((notification) => {
      console.log('📬 Foreground notification received:', notification);
      // You can add custom handling here (e.g., show in-app alert)
    });

    // Setup notification response handler (tap)
    const responseSubscription = setupNotificationResponseHandler((response) => {
      console.log('👆 Notification tapped:', response);
      const data = response.notification.request.content.data;

      // Handle navigation based on notification data
      if (data.cardId) {
        // Navigate to card detail
        console.log('Navigate to card:', data.cardId);
      } else if (data.alertId) {
        // Navigate to alert
        console.log('Navigate to alert:', data.alertId);
      }
    });

    // Setup FCM token refresh listener (production only)
    const tokenRefreshUnsubscribe = setupTokenRefreshListener((newToken) => {
      setToken(newToken);
    });

    return () => {
      foregroundSubscription.remove();
      responseSubscription.remove();
      tokenRefreshUnsubscribe?.();
    };
  }, []);

  return (
    <PushContext.Provider
      value={{
        token,
        isEnabled,
        isLoading,
        error,
        requestPermission,
      }}
    >
      {children}
    </PushContext.Provider>
  );
}

export function usePush() {
  const context = useContext(PushContext);
  if (context === undefined) {
    throw new Error('usePush must be used within a PushProvider');
  }
  return context;
}
