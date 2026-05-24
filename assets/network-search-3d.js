(() => {
  'use strict';
  function reveal(id) {
    const all = document.querySelector('#global-network [data-filter="all"]');
    if (all && !all.classList.contains('active')) all.click();
    const in3d = !!document.querySelector('[data-globe-mode="3d"].active');
    if (!in3d && window.GNK_GEO_MAP && typeof window.GNK_GEO_MAP.selectLocation === 'function') {
      window.GNK_GEO_MAP.selectLocation(id);
    } else {
      document.dispatchEvent(new CustomEvent('gnk-location-selected', { detail: { id, source: 'search' } }));
    }
    const canvas = document.querySelector('#global-network .network-canvas');
    const globe = document.querySelector('#global-network .globe-panel');
    const target = in3d ? globe : canvas;
    if (target) { target.classList.add('located'); setTimeout(() => target.classList.remove('located'), 1700); }
  }
  function bind() {
    const go = document.getElementById('networkEntityGo');
    const select = document.getElementById('networkEntitySelect');
    const boulder = document.querySelector('#networkCommandDeck [data-net-shortcut="boulder"]');
    if (!go || !select || go.dataset.geoSearchReady) return false;
    go.dataset.geoSearchReady = '1';
    go.addEventListener('click', event => { event.preventDefault(); event.stopImmediatePropagation(); reveal(select.value); }, true);
    select.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); reveal(select.value); } });
    if (boulder && !boulder.dataset.geoSearchReady) {
      boulder.dataset.geoSearchReady = '1';
      boulder.addEventListener('click', event => { event.preventDefault(); event.stopImmediatePropagation(); reveal('boulder'); }, true);
    }
    return true;
  }
  function init() {
    let count = 0;
    const timer = setInterval(() => { if (bind() || ++count > 150) clearInterval(timer); }, 70);
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
