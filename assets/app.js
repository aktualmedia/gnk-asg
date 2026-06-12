document.addEventListener('DOMContentLoaded', function () {
  'use strict';
  var VERSION = '20260613-performance-lite-01';
  function css(text){ if(document.getElementById('gnk-lite-css')) return; var s=document.createElement('style'); s.id='gnk-lite-css'; s.textContent=text; document.head.appendChild(s); }
  function script(path){ if(document.querySelector('script[src^="'+path+'"]')) return; var e=document.createElement('script'); e.src=path+'?v='+VERSION; e.async=false; var run=function(){document.body.appendChild(e)}; if('requestIdleCallback' in window) requestIdleCallback(run,{timeout:2500}); else setTimeout(run,1500); }
  function style(path){ if(document.querySelector('link[href^="'+path+'"]')) return; var e=document.createElement('link'); e.rel='stylesheet'; e.href=path+'?v='+VERSION; document.head.appendChild(e); }
  function menu(){ var b=document.getElementById('menuToggle'),m=document.getElementById('navLinks'); if(!b||!m||b.dataset.ok)return; b.dataset.ok='1'; b.onclick=function(){m.classList.toggle('open')}; }
  function linkNav(){ var map={'#digital-assets':'/market/','#news':'/news/','#assistant':'/assistant/'}; Object.keys(map).forEach(function(k){ Array.prototype.forEach.call(document.querySelectorAll('a[href="'+k+'"]'),function(a){a.href=map[k];}); }); }
  function ticker(){ var t=document.getElementById('ticker'); if(t)t.innerHTML='<span><b>GNK ASG</b> FRONT MODE</span><span><b>3D</b> odgođeno učitavanje</span><span><b>MARKET</b> /market/</span><span><b>NEWS</b> /news/</span>'; }
  function split(id,title,text,url){ var s=document.querySelector(id); if(!s)return; s.innerHTML='<div class="container"><div class="section-head"><div><p class="eyebrow">Odvojeni modul</p><h2>'+title+'</h2></div><p>'+text+'</p></div><div class="gnk-split-card"><h3>'+title+'</h3><p>Ovaj teški sloj više se ne učitava na naslovnici. Naslovnica ostaje brza, a puni modul je izdvojen.</p><a class="btn gold" href="'+url+'">OTVORI MODUL</a></div></div>'; }
  css('.gnk-split-card{border:1px solid rgba(212,175,55,.32);border-radius:22px;background:#fff;padding:24px;box-shadow:0 16px 44px rgba(7,22,45,.10)}.gnk-split-card h3{margin-top:0;color:#07162d}.gnk-split-card p{color:#435269}.gnk-split-card .btn{display:inline-flex;margin-top:12px}.nav-links.open{display:flex}');
  menu(); linkNav(); ticker();
  split('#digital-assets','GNK ASG Digital Exchange Monitor','Market, BTC, zlato, Brent i valutni podatci prebačeni su u samostalni sloj.','/market/');
  split('#news','Business & Technology News','Vijesti su izdvojene iz naslovnice radi bržeg učitavanja.','/news/');
  split('#assistant','GNK ASG AI Assistant','AI/intelligence sloj odvojen je od javnog fronta.','/assistant/');
  style('/assets/group-network.css'); style('/assets/network-motion.css'); style('/assets/group-globe-3d.css');
  script('/assets/world-geography.js'); script('/assets/group-network.js'); script('/assets/network-motion.js'); script('/assets/group-globe-3d.js');
  if('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js?v='+VERSION).catch(function(){});
});
