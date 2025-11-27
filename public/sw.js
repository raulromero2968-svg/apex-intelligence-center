/**
 * Service Worker for Web Push Notifications
 *
 * Handles push notification events and displays notifications to the user
 *
 * Installation:
 * In your app, register this service worker:
 * navigator.serviceWorker.register('/sw.js');
 */

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(clients.claim());
});

/**
 * Handle push events
 */
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received:', event);

  let data = {
    title: 'Price Alert',
    body: 'A card in your watchlist has changed price',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    url: '/',
  };

  // Parse payload if available
  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (error) {
      console.error('[Service Worker] Failed to parse push data:', error);
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
      ...data.data,
    },
    actions: [
      {
        action: 'view',
        title: 'View Card',
      },
      {
        action: 'close',
        title: 'Dismiss',
      },
    ],
    requireInteraction: false,
    tag: data.data?.cardId || 'watchlist-alert',
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

/**
 * Handle notification clicks
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event);

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Get URL from notification data
  const url = event.notification.data?.url || '/';
  const fullUrl = new URL(url, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url === fullUrl && 'focus' in client) {
          return client.focus();
        }
      }

      // Open new window if no matching window found
      if (clients.openWindow) {
        return clients.openWindow(fullUrl);
      }
    })
  );
});

/**
 * Handle notification close
 */
self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] Notification closed:', event);
});
