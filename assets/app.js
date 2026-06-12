document.addEventListener('DOMContentLoaded', function () {
  var VERSION = '20260613-network-fullwidth-fix-01';

  var nativeFetch = window.fetch && window.fetch.bind(window);
  if (nativeFetch && !window.__gnkRootDataFetch) {
    window.__gnkRootDataFetch = true;
    window.fetch = function (input, init) {
      if (typeof input === 'string' && input.indexOf('data/') === 0) input = '/' + input;
      return nativeFetch(input, init);
    };
  }

  function style(path) {
    if (document.querySelector('link[href^="' + path + '"]')) return;
    var link = document.createElement('link');
    link.rel = 'stylesheet'; link.href = path + '?v=' + VERSION;
    document.head.appendChild(link);
  }
  function script(path, callback) {
    if (document.querySelector('script[src^="' + path + '"]')) { if (callback) callback(); return; }
    var el = document.createElement('script');
    el.src = path + '?v=' + VERSION; el.defer = true;
    if (callback) el.onload = callback;
    document.body.appendChild(el);
  }
  function runIdle(fn, timeout) {
    if ('requestIdleCallback' in window) window.requestIdleCallback(fn, {timeout: timeout || 2200});
    else window.setTimeout(fn, Math.min(timeout || 2200, 900));
  }

  style('/assets/fina-panel.css');
  style('/assets/advanced.css');
  style('/assets/header-premium.css');
  style('/assets/group-contrast.css');
  style('/assets/group-network.css');
  style('/assets/network-fullwidth-fix.css');
  style('/assets/network-motion.css');
  style('/assets/group-globe-3d.css');
  style('/assets/group-location-insights.css');
  style('/assets/group-map-2d-geo.css');
  style('/assets/group-google-map.css');
  style('/assets/group-location-weather.css');
  style('/assets/group-overview-panel.css');
  style('/assets/group-market-coverage.css');
  style('/assets/network-reading-layout.css');
  style('/assets/bitcoin-chart.css');
  style('/assets/market-expansion.css');
  style('/assets/bpp-public-card.css');
  style('/assets/language.css');
  style('/assets/intelligence-desk.css');
  style('/assets/desk-hybrid.css');
  style('/assets/command-centre.css');
  style('/assets/mobile-app.css');
  style('/assets/desk-search.css');
  style('/assets/floating-intelligence.css');
  style('/assets/public-sources.css');
  style('/assets/mobile-stability.css');
  style('/assets/group-mobile-accessible.css');
  style('/assets/portal-integration.css');
  style('/assets/seo-profile-link.css');
  style('/assets/menu-fix.css');
  style('/assets/quality-patch.css');

  var menuToggle = document.getElementById('menuToggle');
  var navLinks = document.getElementById('navLinks');
  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', function () { navLinks.classList.toggle('open'); });
    document.addEventListener('click', function (event) {
      if (!navLinks.contains(event.target) && event.target !== menuToggle) navLinks.classList.remove('open');
    });
  }
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (event) {
      var target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;
      event.preventDefault();
      navLinks && navLinks.classList.remove('open');
      target.scrollIntoView({behavior:'smooth', block:'start'});
    });
  });

  script('/assets/i18n.js', function () {
    script('/assets/language-routing.js');
  });
  script('/assets/portal-navigation.js');
  script('/assets/status.js');
  script('/assets/browser-data-refresh.js');
  script('/assets/market.js');
  script('/assets/live-market-pulse.js');
  script('/assets/bitcoin-chart.js');
  script('/assets/market-expansion.js');
  script('/assets/bpp-public-card.js');
  script('/assets/news-live.js');
  script('/assets/assistant.js');
  script('/assets/inline-assistant.js');
  script('/assets/intelligence-desk.js');
  script('/assets/desk-hybrid.js');
  script('/assets/desk-search.js');
  script('/assets/mobile-app.js');
  script('/assets/mobile-navigation.js');
  script('/assets/floating-intelligence.js');
  runIdle(function () {
    script('/assets/world-geography.js', function () {
      script('/assets/group-network.js', function () {
        script('/assets/network-motion.js');
        script('/assets/group-globe-3d.js', function () {
          script('/assets/group-map-2d-geo.js');
          script('/assets/group-location-insights.js');
          script('/assets/group-map-selection-bridge.js');
          script('/assets/group-google-map.js');
          script('/assets/group-location-weather.js');
          script('/assets/group-overview-panel.js');
          script('/assets/group-market-coverage.js');
          script('/assets/network-selection-sync.js');
          script('/assets/command-centre.js');
          script('/assets/network-search-3d.js');
          script('/assets/group-map-pdf.js');
          script('/assets/group-globe-pdf.js');
          script('/assets/group-mobile-accessible.js');
          script('/assets/group-clarity.js');
        });
      });
    });
  }, 1800);
  script('/assets/public-sources.js');
  script('/assets/site-share.js');
  script('/assets/hourly-data-disclosure.js');
  script('/assets/portal-layout.js');
  script('/assets/home-activity-model.js');

  var dataDisclaimer = document.getElementById('dataDisclaimer');
  if (dataDisclaimer) dataDisclaimer.textContent = 'Podaci su informativni, mogu kasniti i nisu financijski savjet.';
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js?v=' + VERSION).catch(function () {});
});