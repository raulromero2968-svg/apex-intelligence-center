/**
 * Production-Grade PWA Service Worker
 * 
 * Features:
 * - Pre-caches core shell routes for offline access
 * - Network-first strategy for dynamic data
 * - Cache-first strategy for static assets
 * - Offline fallback for navigation requests
 */

const CACHE_NAME = 'apex-intelligence-v1';
const RUNTIME_CACHE = 'apex-runtime-v1';

// Core shell routes to precache
const PRECACHE_ROUTES = [
  '/',
  '/scan',
  '/forensics',
  '/simulations',
  '/agent-chat',
  '/research',
  '/project-o',
  '/pwa-debug',
];

// Static assets to precache
const PRECACHE_ASSETS = [
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Install event - precache core shell
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Precaching core shell...');
      
      // Precache routes
      const routePromises = PRECACHE_ROUTES.map((route) => {
        return fetch(route)
          .then((response) => {
            if (response.ok) {
              return cache.put(route, response);
            }
            console.warn(`[Service Worker] Failed to precache route: ${route}`);
          })
          .catch((error) => {
            console.warn(`[Service Worker] Error precaching route ${route}:`, error);
          });
      });
      
      // Precache static assets
      const assetPromises = PRECACHE_ASSETS.map((asset) => {
        return fetch(asset)
          .then((response) => {
            if (response.ok) {
              return cache.put(asset, response);
            }
            console.warn(`[Service Worker] Failed to precache asset: ${asset}`);
          })
          .catch((error) => {
            console.warn(`[Service Worker] Error precaching asset ${asset}:`, error);
          });
      });
      
      return Promise.all([...routePromises, ...assetPromises]);
    })
  );
  
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  event.waitUntil(clients.claim());
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }
  
  // Handle navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Offline fallback - try cache first
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Fallback to home page or offline page
            return caches.match('/').then((homePage) => {
              return homePage || new Response('Offline - Please check your connection', {
                status: 503,
                headers: { 'Content-Type': 'text/plain' },
              });
            });
          });
        })
    );
    return;
  }
  
  // Handle static assets (JS, CSS, images, fonts) - Cache First
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image' ||
    request.destination === 'font' ||
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.endsWith('.webmanifest')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(request).then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }
  
  // Handle API/data requests - Network First
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful GET responses
          if (response.ok && request.method === 'GET') {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Try cache as fallback
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            return new Response(JSON.stringify({ error: 'Offline - Please check your connection' }), {
              status: 503,
              headers: { 'Content-Type': 'application/json' },
            });
          });
        })
    );
    return;
  }
  
  // Default: Network First with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request).then((cachedResponse) => {
          return cachedResponse || new Response('Offline', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' },
          });
        });
      })
  );
});

/**
 * Handle push events (existing push notification support)
 */
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received:', event);

  let data = {
    title: 'Price Alert',
    body: 'A card in your watchlist has changed price',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
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
    icon: data.icon || '/icons/icon-192.png',
    badge: data.badge || '/icons/icon-192.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
      ...data.data,
    },
    actions: [
      {
        action: 'view',
        title: 'View',
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
