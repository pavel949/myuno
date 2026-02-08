/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { clientsClaim } from 'workbox-core';

declare let self: ServiceWorkerGlobalScope;

// Take control immediately — no waiting for old tabs to close
self.skipWaiting();
clientsClaim();

// Clean up old caches from previous SW versions
cleanupOutdatedCaches();

// Precache ONLY hashed static assets (injected by vite-plugin-pwa)
// index.html is explicitly EXCLUDED via globPatterns in vite config
precacheAndRoute(self.__WB_MANIFEST);

// ─── NAVIGATION: Always NetworkFirst ───
// This ensures index.html is NEVER served from cache without checking network first
const navigationStrategy = new NetworkFirst({
  cacheName: 'navigation-v1',
  networkTimeoutSeconds: 3,
  plugins: [
    new CacheableResponsePlugin({ statuses: [0, 200] }),
    new ExpirationPlugin({
      maxEntries: 5,
      maxAgeSeconds: 60, // 1 minute — very short for HTML
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
    cacheName: 'images-v1',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
      }),
    ],
  })
);

// ─── FONTS: CacheFirst (immutable) ───
registerRoute(
  ({ request }) => request.destination === 'font',
  new CacheFirst({
    cacheName: 'fonts-v1',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// ─── SUPABASE API: NetworkFirst ───
registerRoute(
  ({ url }) => url.hostname.endsWith('.supabase.co'),
  new NetworkFirst({
    cacheName: 'supabase-v1',
    networkTimeoutSeconds: 3,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60, // 1 hour
      }),
    ],
  })
);

// ─── GOOGLE FONTS CSS/WOFF2: CacheFirst ───
registerRoute(
  ({ url }) => url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts-v1',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
      }),
    ],
  })
);

// Log SW lifecycle
self.addEventListener('install', (event) => {
  console.log('[SW] Installing new service worker...');
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activated — now controlling all clients');
});
