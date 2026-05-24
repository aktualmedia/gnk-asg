(() => {
  'use strict';
  const data = { network:null, geo:null, facts:null, selected:'boulder' };
  const $ = id => document.getElementById(id);
  const en = () => document.documentElement.lang === 'en' || /\/en\/?$/.test(location.pathname) || (window.GNK_LANG && window.GNK_LANG.get && window.GNK_LANG.get() === 'en');
  const tr = () => en() ? {
    label:'Google Maps · Selected location', open:'Open larger map', loading:'Loading selected location map', coordinates:'Geographic position'
  } : {
    label:'Google Maps · Odabrana lokacija', open:'Otvori veću kartu', loading:'Učitavanje karte odabrane lokacije', coordinates:'Geografska pozicija'
  };
  async function get(path) {
    try {
      const response = await fetch(path + '?v=' + Date.now(), { cache:'no-store' });
      return response.ok ? response.json() : null;
    } catch (_) { return null; }
  }
  function node(id) {
    if (!data.network) return null;
    return [data.network.center].concat(data.network.nodes || []).find(item => item.id === id) || null;
  }
  function coords(id) {
    if (!data.geo) return null;
    return id === 'boulder' ? data.geo.center : data.geo.nodes?.[id];
  }
  function fact(id) { return data.facts?.locations?.[id] || null; }
  function title(id) {
    const item = node(id), placeFact = fact(id);
    if (!item) return '';
    if (id === 'boulder') return item.name;
    return placeFact?.city || (en() ? item.name_en : item.name_hr);
  }
  function locationLine(id) {
    const placeFact = fact(id);
    if (!placeFact) return '';
    return `${placeFact.city}, ${en() ? placeFact.country_en : placeFact.country_hr}`;
  }
  function embedUrl(id) {
    const position = coords(id);
    if (!position) return '';
    return `https://www.google.com/maps?q=${encodeURIComponent(`${position.lat},${position.lng}`)}&z=13&output=embed`;
  }
  function externalUrl(id) {
    const position = coords(id);
    if (!position) return '#';
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${position.lat},${position.lng}`)}`;
  }
  function panel() {
    const canvas = document.querySelector('#global-network .network-canvas');
    if (!canvas) return null;
    canvas.classList.add('has-google-location-map');
    let host = $('googleLocationMap');
    if (!host) {
      host = document.createElement('section');
      host.id = 'googleLocationMap';
      host.className = 'google-location-map';
      canvas.appendChild(host);
    }
    return host;
  }
  function render(id) {
    const host = panel(), position = coords(id), placeFact = fact(id);
    if (!host || !position || !placeFact) return false;
    data.selected = id;
    const T = tr();
    host.innerHTML = `<header class="google-location-head"><div><small>${T.label}</small><strong>${title(id)}</strong><span>${locationLine(id)} · ${T.coordinates}: ${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}</span></div><a href="${externalUrl(id)}" target="_blank" rel="noopener">${T.open} ↗</a></header><iframe class="google-location-frame" title="${T.label}: ${locationLine(id)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen src="${embedUrl(id)}"></iframe>`;
    return true;
  }
  async function init() {
    [data.network, data.geo, data.facts] = await Promise.all([
      get('data/group_network.json'), get('data/group_network_geo.json'), get('data/group_location_facts.json')
    ]);
    if (!data.network || !data.geo || !data.facts) return;
    let tries = 0;
    const timer = setInterval(() => {
      if ($('networkGeoStage')) {
        const initial = window.GNK_LOCATION_INSIGHTS?.current?.() || window.GNK_GEO_MAP?.getSelected?.() || 'boulder';
        render(initial);
        clearInterval(timer);
      } else if (++tries > 180) clearInterval(timer);
    }, 60);
    document.addEventListener('gnk-location-selected', event => {
      if (event.detail?.id) render(event.detail.id);
    });
    window.addEventListener('gnk-language-change', () => render(data.selected));
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
