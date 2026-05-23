const CACHE_NAME = 'gnk-asg-live-v2';
const STATIC_ASSETS = [
  './',
  './index.html',
  './assets/style.css',
  './assets/advanced.css',
  './assets/fina-panel.css',
  './assets/bitcoin-chart.css',
  './assets/language.css',
  './assets/intelligence-desk.css',
  './assets/logo-gnk-asg.svg',
  './assets/favicon.svg',
  './assets/app.js',
  './assets/i18n.js',
  './assets/status.js',
  './assets/market.js',
  './assets/bitcoin-chart.js',
  './assets/news-live.js',
  './assets/assistant.js',
  './assets/inline-assistant.js',
  './assets/intelligence-desk.js',
  './manifest.webmanifest'
];
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  const liveData = url.pathname.includes('/data/') || url.pathname.endsWith('.html') || url.pathname.endsWith('/');
  if (liveData) {
    event.respondWith(fetch(event.request, {cache:'no-store'}).catch(() => caches.match(event.request)));
    return;
  }
  event.respondWith(fetch(event.request).then((response) => {
    const copy = response.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match(event.request)));
});
