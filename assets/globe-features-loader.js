(function(){
  'use strict';
  var V='20260613-globe-complete-restore-02';
  function st(p){if(document.querySelector('link[href^="'+p+'"]'))return;var e=document.createElement('link');e.rel='stylesheet';e.href=p+'?v='+V;document.head.appendChild(e)}
  function js(p,cb){if(document.querySelector('script[src^="'+p+'"]')){cb&&setTimeout(cb,80);return;}var e=document.createElement('script');e.src=p+'?v='+V;e.async=false;e.onload=function(){cb&&cb()};document.body.appendChild(e)}
  function seq(list,done){var i=0;(function next(){if(i>=list.length){done&&done();return;}js(list[i++],next)})()}
  function wait(sel,cb){var n=0,t=setInterval(function(){var el=document.querySelector(sel);if(el){clearInterval(t);cb(el)}else if(++n>220){clearInterval(t)}},80)}
  ['group-contrast','group-network','network-motion','group-globe-3d','group-location-insights','group-map-2d-geo','group-google-map','group-location-weather','group-overview-panel','group-market-coverage','network-reading-layout','group-mobile-accessible'].forEach(function(n){st('/assets/'+n+'.css')});
  seq(['/assets/world-geography.js','/assets/group-network.js','/assets/network-motion.js','/assets/group-globe-3d.js'],function(){
    wait('#global-network .network-layout',function(){
      seq(['/assets/group-map-2d-geo.js','/assets/group-location-insights.js','/assets/group-map-selection-bridge.js','/assets/group-google-map.js','/assets/group-location-weather.js','/assets/group-overview-panel.js','/assets/group-market-coverage.js','/assets/network-selection-sync.js','/assets/network-search-3d.js','/assets/group-map-pdf.js','/assets/group-globe-pdf.js','/assets/group-mobile-accessible.js','/assets/group-clarity.js'],function(){
        window.__GNK_GLOBE_FEATURES_RESTORED={version:V,ok:true,features:['cities','locations','2d-map','3d-globe','location-selection','weather','market-coverage','2d-print','3d-print','mobile-accessibility']};
        document.dispatchEvent(new CustomEvent('gnk-globe-features-restored',{detail:window.__GNK_GLOBE_FEATURES_RESTORED}));
      });
    });
  });
})();
