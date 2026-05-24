const CACHE_NAME = 'gnk-asg-live-v32-mobile-accessible-network';
const STATIC_ASSETS = [
  './', './index.html', './en/', './en/index.html', './sadrzaj/', './tehnologija/',
  './intelligence-desk/', './instalacija/', './financije/', './registri/', './admin/',
  './trzista/', './trzista/index.html', './en/markets/', './en/markets/index.html',
  './en/finance/', './en/finance/index.html', './en/technology/', './en/technology/index.html',
  './en/intelligence-desk/', './en/intelligence-desk/index.html', './en/registries/', './en/registries/index.html',
  './assets/style.css', './assets/advanced.css', './assets/header-premium.css',
  './assets/group-contrast.css', './assets/group-network.css', './assets/network-motion.css', './assets/group-globe-3d.css',
  './assets/group-location-insights.css', './assets/group-map-2d-geo.css', './assets/group-google-map.css', './assets/group-location-weather.css', './assets/command-centre.css',
  './assets/bitcoin-chart.css', './assets/market-expansion.css', './assets/language.css',
  './assets/intelligence-desk.css', './assets/desk-hybrid.css', './assets/mobile-app.css', './assets/desk-search.css',
  './assets/floating-intelligence.css', './assets/public-sources.css', './assets/mobile-stability.css', './assets/group-mobile-accessible.css',
  './assets/market-centre.css', './assets/market-centre-panels.css', './assets/admin-console.css',
  './assets/logo-gnk-asg.svg', './assets/asg-gold-coin.svg', './assets/gnk-asg-social-card.svg',
  './assets/favicon.svg', './assets/app-icon-192.svg', './assets/app-icon-512.svg',
  './assets/app.js', './assets/i18n.js', './assets/language-routing.js', './assets/portal-navigation.js',
  './assets/status.js', './assets/market.js', './assets/live-market-pulse.js', './assets/bitcoin-chart.js',
  './assets/market-expansion.js', './assets/news-live.js', './assets/assistant.js', './assets/inline-assistant.js',
  './assets/intelligence-desk.js', './assets/desk-hybrid.js', './assets/desk-search.js', './assets/mobile-app.js',
  './assets/mobile-navigation.js', './assets/floating-intelligence.js', './assets/world-geography.js',
  './assets/group-network.js', './assets/network-motion.js', './assets/group-globe-3d.js', './assets/group-map-2d-geo.js',
  './assets/group-location-insights.js', './assets/group-map-selection-bridge.js', './assets/group-google-map.js', './assets/group-location-weather.js', './assets/network-selection-sync.js', './assets/command-centre.js',
  './assets/network-search-3d.js', './assets/group-map-pdf.js', './assets/group-globe-pdf.js', './assets/group-mobile-accessible.js',
  './assets/group-clarity.js', './assets/public-sources.js', './assets/hourly-data-disclosure.js', './assets/admin-status-only.js',
  './assets/market-centre-data.js', './assets/market-constellation.js', './data/desk_public_config.json',
  './data/group_network.json', './data/group_network_geo.json', './data/group_location_facts.json',
  './data/public_sources.json', './data/open_data.json', './data/stock_exchanges.json', './data/asg_gold_asset.json',
  './data/media_approved.json', './data/media_monitor_status.json', './data/market.json', './data/btc_chart.json',
  './data/stablecoins.json', './data/exchange_compare.json', './data/market_indices.json', './data/fast_market_status.json',
  './data/daily_market_brief.json', './manifest.webmanifest', './robots.txt', './sitemap.xml'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  const liveData = url.pathname.includes('/data/') || url.pathname.endsWith('.html') || url.pathname.endsWith('/') || url.pathname.endsWith('sitemap.xml') || url.pathname.endsWith('robots.txt');
  if (liveData) {
    event.respondWith(fetch(event.request, {cache:'no-store'}).catch(() => caches.match(event.request)));
    return;
  }
  event.respondWith(fetch(event.request, {cache:'no-cache'}).then(response => {
    const copy = response.clone();
    caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match(event.request)));
});
