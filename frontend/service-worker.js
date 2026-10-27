// =====================================================
// VIDEOKE SERVICE WORKER
// Cleans stale caches on activate, stays registered.
// Network-only — no caching (avoids stale-version hell).
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

self.addEventListener('fetch', () => {
  // Network-only. Do NOT return a cached response.
});
