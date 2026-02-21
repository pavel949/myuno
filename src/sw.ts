/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { clientsClaim } from 'workbox-core';

declare let self: ServiceWorkerGlobalScope;

// AGGRESSIVE: Take control immediately — no waiting for old tabs
self.skipWaiting();
clientsClaim();

// Clean up ALL old caches from previous SW versions
cleanupOutdatedCaches();

// Precache ONLY hashed static assets (injected by vite-plugin-pwa)
// index.html is explicitly EXCLUDED via globPatterns in vite config
precacheAndRoute(self.__WB_MANIFEST);

// ─── NAVIGATION: ALWAYS NetworkFirst (NEVER cache HTML) ───
// This ensures index.html is ALWAYS fetched from network first
const navigationStrategy = new NetworkFirst({
  cacheName: 'navigation-v4',
  networkTimeoutSeconds: 5, // Increased timeout
  plugins: [
    new CacheableResponsePlugin({ statuses: [200] }), // Only cache 200, not 0
    new ExpirationPlugin({
      maxEntries: 1,
      maxAgeSeconds: 60, // 1 minute max
    }),
  ],
});

registerRoute(new NavigationRoute(navigationStrategy, {
  denylist: [/^\/api/, /^\/supabase/, /^\/__/],
}));

// ─── IMAGES: CacheFirst (they rarely change) ───
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images-v3',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 7 * 24 * 60 * 60,
      }),
    ],
  })
);

// ─── FONTS: CacheFirst (immutable) ───
registerRoute(
  ({ request }) => request.destination === 'font',
  new CacheFirst({
    cacheName: 'fonts-v3',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
    ],
  })
);

// ─── SUPABASE API: NetworkFirst ───
registerRoute(
  ({ url }) => url.hostname.endsWith('.supabase.co'),
  new NetworkFirst({
    cacheName: 'supabase-v3',
    networkTimeoutSeconds: 5,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60,
      }),
    ],
  })
);

// ─── GOOGLE FONTS: CacheFirst ───
registerRoute(
  ({ url }) => url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts-v3',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 365 * 24 * 60 * 60,
      }),
    ],
  })
);

// ─── MESSAGE: Handle SKIP_WAITING + CACHE_SOS ───
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data?.type === 'CACHE_SOS') {
    event.waitUntil(
      caches.open('uno-sos-cache-v1').then((cache) => {
        console.log('[SW] Caching /sos page for offline use');
        return cache.add('/sos');
      }).catch((err) => {
        console.error('[SW] CACHE_SOS failed:', err);
      })
    );
  }
});

// ─── ACTIVATE: Delete ALL old caches + notify clients ───
self.addEventListener('activate', (event) => {
  console.log('[SW v3.35.6] Activated — cleaning ALL old caches');
  const CURRENT_CACHES = ['navigation-v4', 'images-v3', 'fonts-v3', 'supabase-v3', 'google-fonts-v3', 'uno-sos-cache-v1'];
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => !CURRENT_CACHES.includes(key) && !key.startsWith('workbox-precache'))
          .map((key) => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      );
    }).then(() => {
      // Notify ALL clients to hard-reload with fresh assets
      return self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((client) => {
          console.log('[SW] Sending SW_UPDATED to client:', client.id);
          client.postMessage({ type: 'SW_UPDATED' });
        });
      });
    })
  );
});

self.addEventListener('install', () => {
  console.log('[SW v3.35.6] Installing new service worker...');
});
