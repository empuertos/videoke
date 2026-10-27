// =====================================================
// VIDEOKE SERVICE WORKER  (v3.2)
// FIX #1: Was causing an infinite reload loop on every
//         page load. Now: clean no-op SW that flushes
//         stale caches on activate and stays registered.
// Network-only — no caching, so config/version changes
// ship instantly.
// =====================================================

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    } catch {}
    await self.clients.claim();
  })());
});

// Network-only. Do NOT return a cached response.
self.addEventListener('fetch', () => {});
