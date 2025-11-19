/**
 * Unit Tests for Push Notification System
 */

import { jest } from '@jest/globals';
import Constants from 'expo-constants';

// Mock modules
jest.mock('expo-constants');
jest.mock('expo-notifications');
jest.mock('@react-native-firebase/messaging', () => ({
  __esModule: true,
  default: () => ({
    requestPermission: jest.fn(),
    getToken: jest.fn(),
    onTokenRefresh: jest.fn(),
    hasPermission: jest.fn(),
  }),
}));

describe('Push Notification System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Hybrid Push Token Selection', () => {
    it('should use FCM in production environment', async () => {
      // Mock production environment
      (Constants.expoConfig as any) = {
        extra: { env: 'production' },
      };

      const { getPushToken } = await import('../lib/push-hybrid');

      // Mock FCM token
      const mockFCMToken =
        'fcm_token_' + 'a'.repeat(140); // FCM tokens are long

      const { default: messaging } = await import(
        '@react-native-firebase/messaging'
      );
      const mockMessaging = messaging();
      (mockMessaging.requestPermission as jest.Mock).mockResolvedValue(1); // AUTHORIZED
      (mockMessaging.getToken as jest.Mock).mockResolvedValue(mockFCMToken);

      // Mock fetch
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      }) as any;

      const result = await getPushToken();

      expect(result.type).toBe('fcm');
      expect(result.token).toBe(mockFCMToken);
      expect(result.token.length).toBeGreaterThan(100);
    });

    it('should use Expo Push in development environment', async () => {
      // Mock development environment
      (Constants.expoConfig as any) = {
        extra: {
          env: 'development',
          eas: { projectId: 'test-project-id' },
        },
      };

      const mockExpoToken = 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]';

      const Notifications = await import('expo-notifications');
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
        data: mockExpoToken,
      });

      // Mock fetch
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      }) as any;

      const { getPushToken } = await import('../lib/push-hybrid');
      const result = await getPushToken();

      expect(result.type).toBe('expo');
      expect(result.token).toBe(mockExpoToken);
      expect(result.token.startsWith('ExponentPushToken')).toBe(true);
    });

    it('should use Expo Push in preview environment', async () => {
      (Constants.expoConfig as any) = {
        extra: {
          env: 'preview',
          eas: { projectId: 'test-project-id' },
        },
      };

      const mockExpoToken = 'ExponentPushToken[yyyyyyyyyyyyyyyyyyyyyy]';

      const Notifications = await import('expo-notifications');
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
        data: mockExpoToken,
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      }) as any;

      const { getPushToken } = await import('../lib/push-hybrid');
      const result = await getPushToken();

      expect(result.type).toBe('expo');
      expect(result.token).toBe(mockExpoToken);
    });
  });

  describe('Permission Handling', () => {
    it('should throw error when permissions are denied (FCM)', async () => {
      (Constants.expoConfig as any) = {
        extra: { env: 'production' },
      };

      const { default: messaging } = await import(
        '@react-native-firebase/messaging'
      );
      const mockMessaging = messaging();
      (mockMessaging.requestPermission as jest.Mock).mockResolvedValue(0); // DENIED

      const { getPushToken } = await import('../lib/push-hybrid');

      await expect(getPushToken()).rejects.toThrow(
        'Push notifications permission denied'
      );
    });

    it('should throw error when permissions are denied (Expo)', async () => {
      (Constants.expoConfig as any) = {
        extra: { env: 'development' },
      };

      const Notifications = await import('expo-notifications');
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      const { getPushToken } = await import('../lib/push-hybrid');

      await expect(getPushToken()).rejects.toThrow(
        'Push notifications permission denied'
      );
    });
  });

  describe('Token Registration', () => {
    it('should register token with server', async () => {
      (Constants.expoConfig as any) = {
        extra: {
          env: 'development',
          apiUrl: 'http://localhost:3000',
          eas: { projectId: 'test-project-id' },
        },
      };

      const mockExpoToken = 'ExponentPushToken[test]';

      const Notifications = await import('expo-notifications');
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
        data: mockExpoToken,
      });

      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });
      global.fetch = mockFetch as any;

      const { getPushToken } = await import('../lib/push-hybrid');
      await getPushToken();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/push/register',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: mockExpoToken, type: 'expo' }),
        })
      );
    });

    it('should throw error if token registration fails', async () => {
      (Constants.expoConfig as any) = {
        extra: {
          env: 'development',
          apiUrl: 'http://localhost:3000',
          eas: { projectId: 'test-project-id' },
        },
      };

      const Notifications = await import('expo-notifications');
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
        data: 'ExponentPushToken[test]',
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        statusText: 'Internal Server Error',
      }) as any;

      const { getPushToken } = await import('../lib/push-hybrid');

      await expect(getPushToken()).rejects.toThrow(
        'Failed to register token'
      );
    });
  });

  describe('Token Refresh', () => {
    it('should handle FCM token refresh', async () => {
      (Constants.expoConfig as any) = {
        extra: { env: 'production' },
      };

      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();

      const { default: messaging } = await import(
        '@react-native-firebase/messaging'
      );
      const mockMessaging = messaging();
      (mockMessaging.onTokenRefresh as jest.Mock).mockReturnValue(
        mockUnsubscribe
      );

      const { setupTokenRefreshListener } = await import('../lib/push-hybrid');
      const unsubscribe = setupTokenRefreshListener(mockCallback);

      expect(unsubscribe).toBe(mockUnsubscribe);
      expect(mockMessaging.onTokenRefresh).toHaveBeenCalled();
    });

    it('should not set up token refresh listener in development', async () => {
      (Constants.expoConfig as any) = {
        extra: { env: 'development' },
      };

      const mockCallback = jest.fn();

      const { setupTokenRefreshListener } = await import('../lib/push-hybrid');
      const unsubscribe = setupTokenRefreshListener(mockCallback);

      expect(unsubscribe).toBeNull();
    });
  });
});
