// =====================================================
// VIDEOKE SERVICE WORKER  (v3.2)
// Safe no-op SW that flushes stale caches on activate.
// Network-only — no caching. Prevents the reload loop
// from the old self-destructing SW.
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