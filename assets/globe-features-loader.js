(function(){
  'use strict';
  var V='20260613-globe-features-restore-01';
  function st(p){if(document.querySelector('link[href^="'+p+'"]'))return;var e=document.createElement('link');e.rel='stylesheet';e.href=p+'?v='+V;document.head.appendChild(e)}
  function js(p,i){if(document.querySelector('script[src^="'+p+'"]'))return;var e=document.createElement('script');e.src=p+'?v='+V;e.async=false;setTimeout(function(){document.body.appendChild(e)},700+(i*180))}
  [
    '/assets/group-location-insights.css','/assets/group-map-2d-geo.css','/assets/group-google-map.css','/assets/group-location-weather.css','/assets/group-overview-panel.css','/assets/group-market-coverage.css','/assets/network-reading-layout.css','/assets/group-mobile-accessible.css'
  ].forEach(st);
  [
    '/assets/group-map-2d-geo.js','/assets/group-location-insights.js','/assets/group-map-selection-bridge.js','/assets/group-google-map.js','/assets/group-location-weather.js','/assets/group-overview-panel.js','/assets/group-market-coverage.js','/assets/network-selection-sync.js','/assets/network-search-3d.js','/assets/group-map-pdf.js','/assets/group-globe-pdf.js','/assets/group-mobile-accessible.js','/assets/group-clarity.js'
  ].forEach(js);
  window.__GNK_GLOBE_FEATURES_RESTORED={version:V,features:['cities','locations','2d-map','3d-globe','selection','weather','market-coverage','2d-print','3d-print','mobile-accessibility']};
})();
