const CACHE = 'videoke-yt-v5';
const ASSETS = [
  '/',
  '/remote.html',
  '/host.html',
  '/manifest.json',
  '/i18n.js',
  '/config.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // HUWAG i-intercept ang cross-origin requests (Render backend)
  if (url.origin !== self.location.origin) {
    return;
  }

  // HUWAG i-intercept ang socket.io
  if (url.pathname.startsWith('/socket.io')) {
    return;
  }

  // HUWAG i-intercept ang /api/
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Cache-first para sa static assets lang
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      if (e.request.method === 'GET' && res.ok) {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    }).catch(() => caches.match('/remote.html')))
  );
});
