(function(){
'use strict';
if(window.GNK_PUBLIC_TOOLS_READY){return;}
window.GNK_PUBLIC_TOOLS_READY=true;
var version='20260526-public01';
function addCss(path){if(document.querySelector('link[href^="'+path+'"]')){return;}var el=document.createElement('link');el.rel='stylesheet';el.href=path+'?v='+version;document.head.appendChild(el);}
function addScript(path){if(document.querySelector('script[src^="'+path+'"]')){return;}var el=document.createElement('script');el.src=path+'?v='+version;el.defer=true;document.body.appendChild(el);}
function start(){addCss('/assets/site-share.css');addCss('/assets/floating-intelligence.css');addScript('/assets/site-share.js');addScript('/assets/floating-intelligence.js');}
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',start);}else{start();}
}());
