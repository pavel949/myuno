/// <reference lib="webworker" />

declare let self: ServiceWorkerGlobalScope;

async function cleanupAndReloadClients() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map((name) => caches.delete(name)));

  const clients = await self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  });

  await Promise.all(
    clients.map((client) => {
      const url = new URL(client.url);
      url.searchParams.set('sw-cleanup', Date.now().toString());
      return client.navigate(url.toString());
    })
  );

  await self.registration.unregister();
}

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.clients.claim().then(() => cleanupAndReloadClients())
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    event.waitUntil(self.skipWaiting());
  }
});