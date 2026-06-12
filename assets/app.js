document.addEventListener('DOMContentLoaded', function () {
  'use strict';
  var VERSION = '20260613-front-same-globe-full-02';
  function script(path){ if(document.querySelector('script[src^="'+path+'"]')) return; var e=document.createElement('script'); e.src=path+'?v='+VERSION; e.async=false; document.body.appendChild(e); }
  function style(path){ if(document.querySelector('link[href^="'+path+'"]')) return; var e=document.createElement('link'); e.rel='stylesheet'; e.href=path+'?v='+VERSION; document.head.appendChild(e); }
  var b=document.getElementById('menuToggle'),m=document.getElementById('navLinks'); if(b&&m&&!b.dataset.ok){b.dataset.ok='1';b.onclick=function(){m.classList.toggle('open')}}
  var css=document.createElement('style'); css.textContent='.nav-links.open{display:flex}'; document.head.appendChild(css);
  Array.prototype.forEach.call(document.querySelectorAll('a[href="#news"]'),function(a){a.href='/news/'});
  Array.prototype.forEach.call(document.querySelectorAll('a[href="#assistant"]'),function(a){a.href='/assistant/'});
  var form=document.getElementById('chatForm'); if(form)form.onsubmit=function(e){e.preventDefault();location.href='/assistant/'};
  style('/assets/group-network.css'); style('/assets/network-motion.css'); style('/assets/group-globe-3d.css'); style('/assets/group-location-insights.css'); style('/assets/group-map-2d-geo.css'); style('/assets/group-google-map.css'); style('/assets/group-location-weather.css'); style('/assets/group-overview-panel.css'); style('/assets/group-market-coverage.css'); style('/assets/group-mobile-accessible.css');
  script('/assets/market.js'); script('/assets/globe-features-loader.js');
  if('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js?v='+VERSION).catch(function(){});
});
