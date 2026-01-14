// Service Worker for Push Notifications and Offline SOS Page

const CACHE_NAME = 'myuno-sos-cache-v1';
const SOS_CACHE_URLS = [
  '/',
  '/sos',
  '/vip-concierge',
  '/index.html',
  '/manifest.json',
  '/icons/icon-72x72.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Install: cache SOS page and critical assets
self.addEventListener('install', function(event) {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('[SW] Caching SOS page and assets');
        return cache.addAll(SOS_CACHE_URLS);
      })
      .then(function() {
        self.skipWaiting();
      })
  );
});

// Activate: clean up old caches
self.addEventListener('activate', function(event) {
  console.log('[SW] Activated');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function(name) {
            return name !== CACHE_NAME;
          })
          .map(function(name) {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(function() {
      return clients.claim();
    })
  );
});

// Fetch: network-first for navigation, cache-first for assets
self.addEventListener('fetch', function(event) {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);
  
  // For navigation requests (HTML pages)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(function(response) {
          // Cache successful responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(function() {
          // Return cached version if offline
          return caches.match(event.request).then(function(cachedResponse) {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Fallback to SOS page if available
            return caches.match('/sos').then(function(sosResponse) {
              return sosResponse || caches.match('/');
            });
          });
        })
    );
    return;
  }

  // For other requests (assets, API calls)
  event.respondWith(
    caches.match(event.request).then(function(cachedResponse) {
      if (cachedResponse) {
        // Return cached version and update in background
        fetch(event.request).then(function(response) {
          if (response.status === 200) {
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(event.request, response);
            });
          }
        }).catch(function() {});
        return cachedResponse;
      }
      
      // If not cached, fetch from network
      return fetch(event.request).then(function(response) {
        // Cache static assets
        if (response.status === 200 && url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|woff2?)$/)) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      });
    })
  );
});

// Push notifications
self.addEventListener('push', function(event) {
  console.log('[SW] Push received:', event);
  
  let data = { title: 'myUNO', body: 'Новое уведомление' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }
  
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: data.data || {},
    actions: data.actions || []
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  console.log('[SW] Notification clicked:', event);
  
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Message handler for manual cache updates
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'CACHE_SOS') {
    event.waitUntil(
      caches.open(CACHE_NAME).then(function(cache) {
        return cache.addAll(SOS_CACHE_URLS);
      })
    );
  }
});
