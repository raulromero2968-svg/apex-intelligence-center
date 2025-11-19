/**
 * E2E Tests for Push Notifications
 * Tests all push notification states: foreground, background, killed
 */

import { device, expect, element, by, waitFor } from 'detox';

describe('Push Notifications E2E', () => {
  beforeAll(async () => {
    await device.launchApp({
      delete: true,
      permissions: { notifications: 'YES' },
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('Push Notification Permissions', () => {
    it('should request push notification permissions on first launch', async () => {
      await expect(element(by.text('Enable Notifications'))).toBeVisible();
      await element(by.text('Enable Notifications')).tap();
      // Permission dialog should appear (handled by OS)
    });

    it('should display permission status', async () => {
      await expect(element(by.id('push-permission-status'))).toBeVisible();
    });
  });

  describe('Foreground Push Notifications', () => {
    it('should receive push notification in foreground', async () => {
      await device.sendUserNotification({
        trigger: {
          type: 'push',
        },
        title: 'Price Alert',
        subtitle: 'Charizard Base Set',
        body: 'Charizard hit $500! Your target price was reached',
        badge: 1,
        payload: {
          cardId: 'charizard-base-set-4',
          type: 'price_alert',
        },
      });

      // Should display in-app notification
      await waitFor(element(by.text('Charizard hit $500!')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should play sound for foreground notification', async () => {
      await device.sendUserNotification({
        trigger: { type: 'push' },
        title: 'New Listing',
        body: 'Pikachu listed at $200',
        sound: 'default',
      });

      // Verify notification appears
      await waitFor(element(by.text('Pikachu listed at $200')))
        .toBeVisible()
        .withTimeout(5000);
    });
  });

  describe('Background Push Notifications', () => {
    it('should receive push when app is backgrounded', async () => {
      // Background the app
      await device.sendToHome();
      await device.launchApp({ newInstance: false });

      // Send notification while backgrounded
      await device.sendUserNotification({
        trigger: { type: 'push' },
        title: 'Background Test',
        body: 'This notification was sent while backgrounded',
      });

      // Wait a bit for notification to be received
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Resume app
      await device.launchApp({ newInstance: false });

      // Check notification was received
      await waitFor(element(by.text('Background Test')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should update badge count when backgrounded', async () => {
      await device.sendToHome();

      await device.sendUserNotification({
        trigger: { type: 'push' },
        title: 'Badge Test',
        body: 'Badge should update',
        badge: 3,
      });

      await device.launchApp({ newInstance: false });

      // Badge should be updated (check in UI if displayed)
      await expect(element(by.id('notification-badge'))).toHaveText('3');
    });
  });

  describe('Killed State Push Notifications', () => {
    it('should open app from notification when killed', async () => {
      // Terminate app
      await device.terminateApp();

      // Send notification
      await device.sendUserNotification({
        trigger: { type: 'push' },
        title: 'Killed State Test',
        body: 'Tap to open',
        payload: {
          cardId: 'charizard-base-set-4',
          type: 'price_alert',
        },
      });

      // Launch app by tapping notification
      await device.launchApp({
        newInstance: true,
        userNotification: {
          trigger: { type: 'push' },
          title: 'Killed State Test',
          body: 'Tap to open',
          payload: {
            cardId: 'charizard-base-set-4',
            type: 'price_alert',
          },
        },
      });

      // Should navigate to card detail
      await waitFor(element(by.id('card-detail-charizard-base-set-4')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should handle deep link from push notification', async () => {
      await device.terminateApp();

      await device.launchApp({
        newInstance: true,
        userNotification: {
          trigger: { type: 'push' },
          title: 'Deep Link Test',
          body: 'Open arbitrage opportunity',
          payload: {
            type: 'arbitrage',
            cardId: 'pikachu-vmax',
            screen: 'ArbitrageDetail',
          },
        },
      });

      // Should navigate to arbitrage detail screen
      await waitFor(element(by.id('arbitrage-detail-screen')))
        .toBeVisible()
        .withTimeout(5000);
    });
  });

  describe('Push Notification Interactions', () => {
    it('should dismiss notification on tap', async () => {
      await device.sendUserNotification({
        trigger: { type: 'push' },
        title: 'Dismiss Test',
        body: 'Tap to dismiss',
      });

      await waitFor(element(by.text('Tap to dismiss')))
        .toBeVisible()
        .withTimeout(5000);

      await element(by.text('Tap to dismiss')).tap();

      // Notification should be dismissed
      await waitFor(element(by.text('Tap to dismiss')))
        .not.toBeVisible()
        .withTimeout(2000);
    });

    it('should handle multiple notifications', async () => {
      // Send multiple notifications
      await device.sendUserNotification({
        trigger: { type: 'push' },
        title: 'Notification 1',
        body: 'First notification',
      });

      await device.sendUserNotification({
        trigger: { type: 'push' },
        title: 'Notification 2',
        body: 'Second notification',
      });

      await device.sendUserNotification({
        trigger: { type: 'push' },
        title: 'Notification 3',
        body: 'Third notification',
      });

      // All should be visible in notification list
      await expect(element(by.text('Notification 1'))).toBeVisible();
      await expect(element(by.text('Notification 2'))).toBeVisible();
      await expect(element(by.text('Notification 3'))).toBeVisible();
    });
  });

  describe('Token Management', () => {
    it('should register push token on app launch', async () => {
      await waitFor(element(by.id('push-token-registered')))
        .toBeVisible()
        .withTimeout(10000);
    });

    it('should handle token refresh', async () => {
      // Simulate token refresh (this would be done by the OS in real scenario)
      await element(by.id('refresh-push-token-button')).tap();

      await waitFor(element(by.text('Token refreshed')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should unregister token on logout', async () => {
      await element(by.id('logout-button')).tap();

      await waitFor(element(by.text('Token unregistered')))
        .toBeVisible()
        .withTimeout(5000);
    });
  });
});
