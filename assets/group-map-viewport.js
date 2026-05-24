(() => {
  'use strict';
  const V = { zoom: 1, x: 0, y: 0, dragging: false, moved: false, lastX: 0, lastY: 0, ready: false };
  const $ = id => document.getElementById(id);
  const en = () => document.documentElement.lang === 'en' || /\/en\/?$/.test(location.pathname) || (window.GNK_LANG && window.GNK_LANG.get && window.GNK_LANG.get() === 'en');
  const c = () => en() ? { hint:'Drag map to pan · scroll to zoom', center:'Centre map', zoom:'Zoom' } : { hint:'Povucite kartu za pomicanje · kotačić za povećanje', center:'Centriraj kartu', zoom:'Povećanje' };
  function stage() { return $('networkGeoStage'); }
  function svg() { return $('networkGeoSvg'); }
  function apply() {
    const box = stage(); if (!box) return;
    box.style.setProperty('--geo-pan-x', `${V.x}px`);
    box.style.setProperty('--geo-pan-y', `${V.y}px`);
    box.style.setProperty('--geo-zoom', String(V.zoom));
    const display = $('geoZoomValue'); if (display) display.textContent = `${Math.round(V.zoom * 100)}%`;
  }
  function limitPan() {
    const box = stage(), map = svg(); if (!box || !map) return;
    const bounds = box.getBoundingClientRect(), mapBounds = map.getBoundingClientRect();
    const extraX = Math.max(0, (mapBounds.width - bounds.width) / 2 + 56);
    const extraY = Math.max(0, (mapBounds.height - bounds.height) / 2 + 42);
    V.x = Math.max(-extraX, Math.min(extraX, V.x));
    V.y = Math.max(-extraY, Math.min(extraY, V.y));
  }
  function reset() { V.zoom = 1; V.x = 0; V.y = 0; apply(); }
  function zoom(delta) {
    V.zoom = Math.max(1, Math.min(3, Number((V.zoom + delta).toFixed(2))));
    if (V.zoom === 1) { V.x = 0; V.y = 0; }
    limitPan(); apply();
  }
  function mountControls() {
    const canvas = document.querySelector('#global-network .network-canvas'), controls = canvas?.querySelector('.network-controls');
    if (!canvas || !controls) return;
    if (!$('geoViewportHint')) {
      const hint = document.createElement('div'); hint.id = 'geoViewportHint'; hint.className = 'geo-viewport-hint'; hint.textContent = c().hint; canvas.appendChild(hint);
    }
    let value = $('geoZoomValue');
    if (!value) { value = document.createElement('span'); value.id = 'geoZoomValue'; value.className = 'geo-zoom-value'; controls.appendChild(value); }
    if (controls.dataset.viewportReady) { apply(); return; }
    controls.dataset.viewportReady = '1';
    const plus = controls.querySelector('[data-zoom="in"]'), minus = controls.querySelector('[data-zoom="out"]'), center = controls.querySelector('[data-zoom="reset"]');
    plus?.addEventListener('click', event => { event.preventDefault(); event.stopImmediatePropagation(); zoom(.18); }, true);
    minus?.addEventListener('click', event => { event.preventDefault(); event.stopImmediatePropagation(); zoom(-.18); }, true);
    center?.setAttribute('aria-label', c().center);
    center?.addEventListener('click', event => { event.preventDefault(); event.stopImmediatePropagation(); reset(); }, true);
  }
  function wrapMap() {
    const map = svg(); if (!map) return false;
    let box = stage();
    if (!box) {
      box = document.createElement('div'); box.id = 'networkGeoStage'; box.className = 'geo-map-stage';
      map.parentNode.insertBefore(box, map); box.appendChild(map);
    }
    if (!box.dataset.viewportReady) {
      box.dataset.viewportReady = '1';
      box.addEventListener('pointerdown', event => {
        if (event.target.closest('.geo-node')) return;
        V.dragging = true; V.moved = false; V.lastX = event.clientX; V.lastY = event.clientY;
        box.classList.add('dragging'); box.setPointerCapture(event.pointerId);
      });
      box.addEventListener('pointermove', event => {
        if (!V.dragging) return;
        const dx = event.clientX - V.lastX, dy = event.clientY - V.lastY;
        if (Math.abs(dx) + Math.abs(dy) > 2) V.moved = true;
        V.x += dx; V.y += dy; V.lastX = event.clientX; V.lastY = event.clientY; limitPan(); apply();
      });
      const end = event => { if (!V.dragging) return; V.dragging = false; box.classList.remove('dragging'); try { box.releasePointerCapture(event.pointerId); } catch (_) {} };
      box.addEventListener('pointerup', end); box.addEventListener('pointercancel', end);
      box.addEventListener('wheel', event => { event.preventDefault(); zoom(event.deltaY < 0 ? .12 : -.12); }, {passive:false});
      box.addEventListener('dblclick', event => { if (!event.target.closest('.geo-node')) reset(); });
      window.addEventListener('resize', () => { limitPan(); apply(); });
    }
    mountControls(); apply(); return true;
  }
  function init() {
    let tries = 0; const timer = setInterval(() => { if (wrapMap() || ++tries > 180) clearInterval(timer); }, 60);
    window.addEventListener('gnk-language-change', () => { const hint = $('geoViewportHint'); if (hint) hint.textContent = c().hint; const resetButton = document.querySelector('#global-network [data-zoom="reset"]'); if (resetButton) resetButton.setAttribute('aria-label', c().center); });
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
