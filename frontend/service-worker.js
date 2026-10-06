// =====================================================
// SELF-DESTRUCTING SERVICE WORKER
// Force kill ang lumang SW at reload lahat ng tabs
// =====================================================

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    self.registration.unregister().then(() => {
      return self.clients.matchAll();
    }).then(clients => {
      clients.forEach(client => client.navigate(client.url));
    })
  );
});

self.addEventListener('fetch', e => {
  return;
});
