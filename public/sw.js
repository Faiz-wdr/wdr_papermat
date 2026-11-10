// Wandoor Paper Mart - Self-Healing Cache Cleanup Service Worker
// Automatically purges stale PWA caches and unregisters itself

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((k) => caches.delete(k)));
    }).then(() => {
      return self.registration.unregister();
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Bypass cache completely: let all network requests pass through directly
self.addEventListener('fetch', () => {
  // Do not intercept - allow standard network fetch
});
