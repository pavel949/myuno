/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { NetworkFirst, NetworkOnly, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { clientsClaim } from 'workbox-core';

declare let self: ServiceWorkerGlobalScope;
declare const __APP_VERSION__: string;

const SW_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev-local';
const CACHE_SUFFIX = SW_VERSION.replace(/[^a-zA-Z0-9_-]/g, '_');
const CACHE_NAMES = {
  images: `images-${CACHE_SUFFIX}`,
  fonts: `fonts-${CACHE_SUFFIX}`,
  supabase: `supabase-${CACHE_SUFFIX}`,
  googleFonts: `google-fonts-${CACHE_SUFFIX}`,
  sos: 'uno-sos-cache-v1',
} as const;

// AGGRESSIVE: Take control immediately — no waiting for old tabs
self.skipWaiting();
clientsClaim();

// Clean up ALL old caches from previous SW versions
cleanupOutdatedCaches();

// Precache ONLY hashed static assets (injected by vite-plugin-pwa)
// index.html is explicitly EXCLUDED via globPatterns in vite config
precacheAndRoute(self.__WB_MANIFEST);

// ─── NAVIGATION: ALWAYS NetworkOnly (NEVER serve cached HTML) ───
// This ensures index.html is ALWAYS fetched from network, never from cache
const navigationStrategy = new NetworkOnly();

registerRoute(new NavigationRoute(navigationStrategy, {
  denylist: [/^\/api/, /^\/supabase/, /^\/__/, /^\/~oauth/],
}));

// ─── IMAGES: CacheFirst (they rarely change) ───
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: CACHE_NAMES.images,
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
    cacheName: CACHE_NAMES.fonts,
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
    cacheName: CACHE_NAMES.supabase,
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
    cacheName: CACHE_NAMES.googleFonts,
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
  console.log(`[SW v${SW_VERSION}] Activated — cleaning old caches`);
  const currentCaches = Object.values(CACHE_NAMES);
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => !currentCaches.includes(key) && !key.startsWith('workbox-precache'))
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
  console.log(`[SW v${SW_VERSION}] Installing new service worker...`);
});
