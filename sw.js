const CACHE_NAME = 'gnk-asg-live-v8';
const STATIC_ASSETS = [
  './',
  './index.html',
  './en/',
  './en/index.html',
  './sadrzaj/',
  './tehnologija/',
  './intelligence-desk/',
  './instalacija/',
  './financije/',
  './assets/style.css',
  './assets/advanced.css',
  './assets/header-premium.css',
  './assets/group-contrast.css',
  './assets/group-network.css',
  './assets/bitcoin-chart.css',
  './assets/language.css',
  './assets/intelligence-desk.css',
  './assets/mobile-app.css',
  './assets/desk-search.css',
  './assets/floating-intelligence.css',
  './assets/public-sources.css',
  './assets/mobile-stability.css',
  './assets/logo-gnk-asg.svg',
  './assets/favicon.svg',
  './assets/app-icon-192.svg',
  './assets/app-icon-512.svg',
  './assets/app.js',
  './assets/i18n.js',
  './assets/language-routing.js',
  './assets/status.js',
  './assets/market.js',
  './assets/live-market-pulse.js',
  './assets/bitcoin-chart.js',
  './assets/news-live.js',
  './assets/assistant.js',
  './assets/inline-assistant.js',
  './assets/intelligence-desk.js',
  './assets/desk-search.js',
  './assets/mobile-app.js',
  './assets/mobile-navigation.js',
  './assets/floating-intelligence.js',
  './assets/group-network.js',
  './assets/public-sources.js',
  './data/group_network.json',
  './data/public_sources.json',
  './data/open_data.json',
  './manifest.webmanifest',
  './robots.txt',
  './sitemap.xml'
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
  const liveData = url.pathname.includes('/data/') || url.pathname.endsWith('.html') || url.pathname.endsWith('/') || url.pathname.endsWith('sitemap.xml') || url.pathname.endsWith('robots.txt');
  if (liveData) {
    event.respondWith(fetch(event.request, {cache:'no-store'}).catch(() => caches.match(event.request)));
    return;
  }
  event.respondWith(fetch(event.request, {cache:'no-cache'}).then((response) => {
    const copy = response.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match(event.request)));
});
