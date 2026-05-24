(() => {
  'use strict';
  let boundStage = null;
  let pressedId = null;
  let startX = 0;
  let startY = 0;
  const locateMarker = target => target && target.closest ? target.closest('#networkGeoSvg .geo-node[data-location-id]') : null;
  function select(id) {
    if (!id) return;
    if (window.GNK_GEO_MAP && typeof window.GNK_GEO_MAP.selectLocation === 'function') {
      window.GNK_GEO_MAP.selectLocation(id);
    }
    if (window.GNK_LOCATION_INSIGHTS && typeof window.GNK_LOCATION_INSIGHTS.select === 'function') {
      window.GNK_LOCATION_INSIGHTS.select(id);
    } else {
      document.dispatchEvent(new CustomEvent('gnk-location-selected', { detail: { id, source: '2d-bridge' } }));
    }
  }
  function bind() {
    const stage = document.getElementById('networkGeoStage');
    if (!stage || stage === boundStage) return !!stage;
    boundStage = stage;
    stage.addEventListener('pointerdown', event => {
      const marker = locateMarker(event.target);
      if (!marker) { pressedId = null; return; }
      pressedId = marker.dataset.locationId;
      startX = event.clientX;
      startY = event.clientY;
      event.stopPropagation();
    }, true);
    stage.addEventListener('pointerup', event => {
      const marker = locateMarker(event.target);
      if (!pressedId || !marker || marker.dataset.locationId !== pressedId) { pressedId = null; return; }
      const moved = Math.hypot(event.clientX - startX, event.clientY - startY) > 5;
      const id = pressedId;
      pressedId = null;
      if (!moved) {
        event.preventDefault();
        event.stopPropagation();
        select(id);
      }
    }, true);
    stage.addEventListener('click', event => {
      const marker = locateMarker(event.target);
      if (!marker) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      select(marker.dataset.locationId);
    }, true);
    return true;
  }
  function init() {
    let tries = 0;
    const timer = setInterval(() => {
      if (bind() || ++tries > 220) clearInterval(timer);
    }, 50);
    document.addEventListener('gnk-geography-ready', bind);
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
