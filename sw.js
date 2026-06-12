const CACHE_NAME = 'gnk-asg-live-v58-minimal-no-precache';

self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: 'window', includeUncontrolled: true }))
      .then(clients => clients.forEach(client => client.postMessage({ type: 'GNK_PORTAL_CACHE_REFRESHED', version: CACHE_NAME })))
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  const path = url.pathname;
  const isCritical = path === '/' || path.endsWith('.html') || path === '/sw.js' || path.endsWith('/assets/app.js') || path.endsWith('/assets/frontend-stability-guard.js') || path.endsWith('/assets/mobile-navigation.js') || path.startsWith('/data/') || path.startsWith('/api/');
  if (isCritical) {
    event.respondWith(fetch(event.request, { cache: 'no-store' }));
    return;
  }
  event.respondWith(
    fetch(event.request, { cache: 'no-store' }).catch(() => caches.match(event.request))
  );
});
