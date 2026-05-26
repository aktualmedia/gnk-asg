(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const isEn = () => document.documentElement.lang === 'en' || /\/en(?:\/|$)/.test(location.pathname) || window.GNK_LANG?.get?.() === 'en';
  const copy = () => isEn() ? {
    title:'Downloads and snapshots', note:'Map, demographics and weather follow the selected point.', staticPdf:'Static PDF', mapPdf:'2D PDF', globePdf:'3D PDF', mapPng:'2D Image', globePng:'3D Image', busy:'Preparing…', missing:'Unavailable', mapLoading:'Loading Google Maps for the selected position…', weatherTitle:'Weather conditions', weatherLoading:'Loading local weather for the selected position…'
  } : {
    title:'Preuzimanja i prikazi', note:'Karta, demografija i vrijeme prate odabranu točku.', staticPdf:'Statični PDF', mapPdf:'2D PDF', globePdf:'3D PDF', mapPng:'2D slika', globePng:'3D slika', busy:'Pripremam…', missing:'Nije dostupno', mapLoading:'Učitavanje Google karte odabrane lokacije…', weatherTitle:'Vremenske prilike', weatherLoading:'Učitavanje vremenskih podataka odabrane lokacije…'
  };
  const safeId = () => String(window.GNK_LOCATION_INSIGHTS?.current?.() || window.GNK_GLOBE?.getSelected?.() || window.GNK_GEO_MAP?.getSelected?.() || 'lokacija').replace(/[^a-z0-9_-]/gi, '_');
  function save(blob, filename) { const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1200); }
  function temporary(button, value, reset = true) { const initial = button.textContent; button.disabled = true; button.textContent = value; return () => { button.disabled = false; if (reset) button.textContent = initial; }; }
  function proxy(button, id) { const target = $(id); if (target) { target.click(); return; } const done = temporary(button, copy().missing); setTimeout(done, 1500); }
  async function export2d(button) {
    const done = temporary(button, copy().busy);
    try {
      const svg = $('networkGeoSvg'); if (!svg) throw new Error();
      const clone = svg.cloneNode(true); clone.setAttribute('xmlns','http://www.w3.org/2000/svg'); clone.setAttribute('width','1600'); clone.setAttribute('height','838');
      clone.querySelector('#networkGeoLayer')?.removeAttribute('transform');
      const raw = new XMLSerializer().serializeToString(clone), url = URL.createObjectURL(new Blob([raw], {type:'image/svg+xml'})), image = new Image();
      await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; image.src = url; });
      const canvas = document.createElement('canvas'); canvas.width = 1600; canvas.height = 838; canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height); URL.revokeObjectURL(url);
      canvas.toBlob(blob => blob && save(blob, `GNK_DINAMO_2D_Network_${safeId()}.png`), 'image/png');
    } catch (_) { button.textContent = copy().missing; setTimeout(done, 1600); return; }
    done();
  }
  function export3d(button) {
    const done = temporary(button, copy().busy), globe = window.GNK_GLOBE;
    if (!globe) { button.textContent = copy().missing; setTimeout(done, 1600); return; }
    if (!globe.isActive()) globe.activate();
    setTimeout(() => {
      const canvas = globe.getCanvas();
      if (!canvas) { button.textContent = copy().missing; setTimeout(done, 1600); return; }
      canvas.toBlob(blob => blob && save(blob, `GNK_DINAMO_3D_Globe_${safeId()}.png`), 'image/png'); done();
    }, 220);
  }
  function mountToolbar(shell) {
    const T = copy(); let bar = $('networkExportToolbar');
    if (!bar) { bar = document.createElement('nav'); bar.id = 'networkExportToolbar'; bar.className = 'network-export-toolbar'; shell.insertBefore(bar, shell.querySelector('.globe-toolbar') || shell.firstChild); }
    bar.innerHTML = `<div class="toolbar-copy"><strong>${T.title}</strong><span>${T.note}</span></div><div class="toolbar-actions"><button data-file="static">↓ ${T.staticPdf}</button><button data-file="2dpdf">↓ ${T.mapPdf}</button><button data-file="3dpdf">↓ ${T.globePdf}</button><button data-file="2dpng">↓ ${T.mapPng}</button><button data-file="3dpng">↓ ${T.globePng}</button></div>`;
    bar.querySelector('[data-file="static"]').onclick = e => proxy(e.currentTarget, 'networkOverviewPdf');
    bar.querySelector('[data-file="2dpdf"]').onclick = e => proxy(e.currentTarget, 'networkPdfButton');
    bar.querySelector('[data-file="3dpdf"]').onclick = e => proxy(e.currentTarget, 'globePdfButton');
    bar.querySelector('[data-file="2dpng"]').onclick = e => export2d(e.currentTarget);
    bar.querySelector('[data-file="3dpng"]').onclick = e => export3d(e.currentTarget);
  }
  function ensureDock(layout) {
    let dock = $('networkLocationContext');
    if (!dock) { dock = document.createElement('section'); dock.id = 'networkLocationContext'; dock.className = 'location-context-dock'; layout.appendChild(dock); }
    dock.classList.add('portal-context-grid');
    return dock;
  }
  function ensureMapSlot(dock) {
    let map = $('googleLocationMap');
    if (!map) {
      map = document.createElement('section'); map.id = 'googleLocationMap'; map.className = 'google-location-map';
      map.innerHTML = `<header class="google-location-head"><div><small>Google Maps</small><strong>${isEn() ? 'Selected location' : 'Odabrana lokacija'}</strong></div></header><div class="portal-panel-loading">${copy().mapLoading}</div>`;
      dock.appendChild(map);
    }
    return map;
  }
  function ensureWeatherSlot(dock) {
    let weather = $('locationWeatherPanel');
    if (!weather) {
      weather = document.createElement('section'); weather.id = 'locationWeatherPanel'; weather.className = 'location-weather-panel';
      weather.innerHTML = `<header class="weather-head"><div><small>${isEn() ? 'Live forecast · selected location' : 'Aktualna prognoza · odabrana lokacija'}</small><strong>${copy().weatherTitle}</strong></div></header><div class="portal-panel-loading">${copy().weatherLoading}</div>`;
      dock.appendChild(weather);
    }
    return weather;
  }
  function arrange() {
    const section = $('global-network'), shell = section?.querySelector('.network-shell'), layout = shell?.querySelector('.network-layout');
    if (!section || !shell || !layout) return false;
    layout.classList.add('has-location-context');
    const dock = ensureDock(layout), facts = shell.querySelector('.network-sidebar'), map = ensureMapSlot(dock), weather = ensureWeatherSlot(dock), overview = $('networkOverviewVisual');
    if (facts && facts.parentElement !== dock) dock.appendChild(facts);
    if (facts && dock.firstElementChild !== facts) dock.prepend(facts);
    if (map && map.previousElementSibling !== facts) (facts || dock.firstElementChild)?.after(map);
    if (weather && weather.previousElementSibling !== map) map.after(weather);
    if (overview && (overview.parentElement !== shell || overview !== shell.lastElementChild)) shell.appendChild(overview);
    mountToolbar(shell);
    const market = $('digital-assets');
    if (market && section.nextElementSibling !== market) section.after(market);
    market?.classList.add('portal-market-adjacent');
    return !!facts;
  }
  function init() {
    let attempts = 0, stable = 0;
    const timer = setInterval(() => { attempts += 1; stable = arrange() ? stable + 1 : 0; if (stable >= 60 || attempts >= 240) clearInterval(timer); }, 100);
    const refresh = () => setTimeout(arrange, 20);
    window.addEventListener('gnk-language-change', refresh);
    document.addEventListener('gnk-location-selected', refresh);
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
