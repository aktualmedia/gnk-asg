(() => {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const state = { network: null, geo: null, filter: 'all', selected: 'boulder' };
  const en = () => document.documentElement.lang === 'en' || /\/en\/?$/.test(location.pathname) || (window.GNK_LANG && window.GNK_LANG.get && window.GNK_LANG.get() === 'en');
  const t = () => en() ? {
    map: '2D Geographic Network', coast: 'Verified geographic coastline', hq: 'Central headquarters',
    active: 'Existing company', planned: 'Planned expansion 2026', region: 'Region',
    click: 'Click a location for details', movement: 'Drag to pan · wheel or buttons to zoom'
  } : {
    map: '2D geografska mreža', coast: 'Provjereni geografski obrisi kopna', hq: 'Središnje sjedište',
    active: 'Postojeće društvo', planned: 'Planirano širenje 2026.', region: 'Regija',
    click: 'Kliknite lokaciju za detalje', movement: 'Povucite za pomicanje · kotačić ili gumbi za povećanje'
  };
  const geography = () => window.GNK_GEOGRAPHY || { state: { polygons: [] }, labels: {}, microLand: {} };
  const project = (lat, lng) => ({ x: 38 + ((lng + 180) / 360) * 964, y: 34 + ((90 - lat) / 180) * 468 });
  const nodeById = id => state.network?.nodes.find(item => item.id === id) || (id === state.network?.center.id ? state.network.center : null);
  const point = id => {
    const node = nodeById(id), geo = id === 'boulder' ? state.geo?.center : state.geo?.nodes[id];
    return node && geo ? { ...node, ...geo, ...project(geo.lat, geo.lng) } : null;
  };
  const name = node => node.id === 'boulder' ? node.name : (en() ? node.name_en : node.name_hr);
  const place = node => node.id === 'boulder' ? node.place : (en() ? node.place_en : node.place_hr);
  const visible = node => !!node && (state.filter === 'all' || (state.filter === 'active' ? node.status === 'active' || node.id === 'boulder' : state.filter === 'planned' ? node.status === 'planned' : node.region !== 'Europa'));
  function el(tag, attrs = {}) { const item = document.createElementNS(NS, tag); Object.entries(attrs).forEach(([key, value]) => item.setAttribute(key, value)); return item; }
  function landPath(ring) { return ring.map(([lng, lat], index) => { const p = project(lat, lng); return `${index ? 'L' : 'M'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`; }).join(' ') + ' Z'; }
  function createShell() {
    const legacy = document.getElementById('networkSvg'), host = legacy?.parentElement;
    if (!legacy || !host) return null;
    legacy.classList.add('legacy-network-svg');
    let svg = document.getElementById('networkGeoSvg');
    if (!svg) {
      svg = el('svg', { id: 'networkGeoSvg', viewBox: '0 0 1040 545', preserveAspectRatio: 'xMidYMid meet', 'aria-label': t().map, role: 'img' });
      svg.classList.add('network-geo-svg');
      host.insertBefore(svg, legacy);
      svg.addEventListener('pointermove', hover);
      svg.addEventListener('pointerleave', hideTooltip);
    }
    return svg;
  }
  function drawSea(svg) {
    svg.appendChild(el('rect', { class: 'geo-ocean', x: 0, y: 0, width: 1040, height: 545, rx: 18 }));
    const grid = el('g', { class: 'geo-grid' });
    for (let lng = -150; lng <= 150; lng += 30) { const a = project(80, lng), b = project(-65, lng); grid.appendChild(el('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y })); }
    for (let lat = -60; lat <= 60; lat += 30) { const a = project(lat, -180), b = project(lat, 180); grid.appendChild(el('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y })); }
    svg.appendChild(grid);
  }
  function drawLand(svg) {
    const group = el('g', { class: 'geo-land' });
    (geography().state.polygons || []).forEach(poly => group.appendChild(el('path', { d: poly.map(landPath).join(' '), 'fill-rule': 'evenodd' })));
    svg.appendChild(group);
    const micro = el('g', { class: 'geo-micro-land' });
    Object.values(geography().microLand || {}).forEach(dot => { const p = project(dot.lat, dot.lng); micro.appendChild(el('circle', { cx: p.x, cy: p.y, r: Math.max(2.4, dot.size) })); });
    svg.appendChild(micro);
  }
  function drawLabels(svg) {
    const labelsText = en() ? { na: 'NORTH AMERICA', sa: 'SOUTH AMERICA', eu: 'EUROPE', af: 'AFRICA', as: 'ASIA', oc: 'OCEANIA' } : { na: 'SJEVERNA AMERIKA', sa: 'JUŽNA AMERIKA', eu: 'EUROPA', af: 'AFRIKA', as: 'AZIJA', oc: 'OCEANIJA' };
    const labels = el('g', { class: 'geo-continent-labels' });
    Object.entries(geography().labels || {}).forEach(([key, [lat, lng]]) => { const p = project(lat, lng), text = el('text', { x: p.x, y: p.y, 'text-anchor': 'middle' }); text.textContent = labelsText[key]; labels.appendChild(text); });
    svg.appendChild(labels);
  }
  function arc(a, b, planned, peer = false) { const mx = (a.x + b.x) / 2, rise = Math.min(72, Math.abs(a.x - b.x) * .10 + 18); return el('path', { class: planned ? 'geo-route planned' : peer ? 'geo-route peer' : 'geo-route direct', d: `M ${a.x} ${a.y} Q ${mx} ${Math.min(a.y, b.y) - rise} ${b.x} ${b.y}` }); }
  function drawRoutes(svg) {
    const centre = point('boulder'), routes = el('g', { class: 'geo-routes' });
    state.network.nodes.forEach(item => { const target = point(item.id); if (target && visible(target)) routes.appendChild(arc(centre, target, item.status === 'planned')); });
    state.network.peer_links.forEach(([first, second]) => { const a = point(first), b = point(second); if (a && b && visible(a) && visible(b)) routes.appendChild(arc(a, b, a.status === 'planned' || b.status === 'planned', true)); });
    svg.appendChild(routes);
  }
  function showDetail(node, announce = true) {
    const box = document.getElementById('networkDetail'); if (!box || !node) return;
    const status = node.id === 'boulder' ? t().hq : node.status === 'planned' ? t().planned : t().active;
    box.innerHTML = `<small>${t().map}</small><h4>${name(node)}</h4><p>${place(node)}</p><p><strong>${t().region}:</strong> ${node.region || '—'}</p><span class="state ${node.id === 'boulder' ? 'hq' : node.status}">${status}</span>`;
    state.selected = node.id; draw();
    if (announce) document.dispatchEvent(new CustomEvent('gnk-location-selected', { detail: { id: node.id, source: '2d' } }));
  }
  function drawNodes(svg) {
    const layer = el('g', { class: 'geo-nodes' });
    [point('boulder'), ...state.network.nodes.map(item => point(item.id)).filter(Boolean)].filter(visible).forEach(node => {
      const group = el('g', { class: `geo-node ${node.id === 'boulder' ? 'hq' : node.status}${node.id === state.selected ? ' selected' : ''}`, 'data-location-id': node.id, tabindex: '0', role: 'button', 'aria-label': `${name(node)}, ${place(node)}` });
      group.appendChild(el('circle', { cx: node.x, cy: node.y, r: node.id === 'boulder' ? 8 : node.status === 'planned' ? 5 : 5.4 }));
      if (node.id === state.selected || node.id === 'boulder') {
        const label = el('text', { x: node.x + 11, y: node.y - 7 }); label.textContent = name(node); group.appendChild(label);
        const sub = el('text', { class: 'sub', x: node.x + 11, y: node.y + 8 }); sub.textContent = place(node); group.appendChild(sub);
      }
      group.addEventListener('click', () => showDetail(node));
      group.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); showDetail(node); } });
      layer.appendChild(group);
    });
    svg.appendChild(layer);
  }
  function tooltip() {
    const canvas = document.querySelector('#global-network .network-canvas'); if (!canvas) return null;
    let tip = document.getElementById('geoMapTooltip');
    if (!tip) { tip = document.createElement('div'); tip.id = 'geoMapTooltip'; tip.className = 'geo-map-tooltip'; canvas.appendChild(tip); }
    return tip;
  }
  function hover(event) {
    const group = event.target.closest && event.target.closest('.geo-node'), tip = tooltip();
    if (!tip || !group) { hideTooltip(); return; }
    const node = point(group.dataset.locationId), rect = event.currentTarget.getBoundingClientRect(); if (!node) return;
    tip.innerHTML = `<strong>${name(node)}</strong><span>${place(node)}</span><small>${t().click}</small>`;
    tip.style.left = `${event.clientX - rect.left + 14}px`; tip.style.top = `${event.clientY - rect.top - 10}px`; tip.classList.add('visible');
  }
  function hideTooltip() { document.getElementById('geoMapTooltip')?.classList.remove('visible'); }
  function draw() {
    if (!state.network || !state.geo) return;
    const svg = createShell(); if (!svg) return;
    svg.innerHTML = ''; drawSea(svg); drawLand(svg); drawLabels(svg); drawRoutes(svg); drawNodes(svg);
  }
  function decorate() {
    const canvas = document.querySelector('#global-network .network-canvas'); if (!canvas) return;
    let badge = document.getElementById('geoMapBadge');
    if (!badge) { badge = document.createElement('div'); badge.id = 'geoMapBadge'; badge.className = 'geo-map-badge'; canvas.appendChild(badge); }
    badge.innerHTML = `<strong>${t().map}</strong><span>${t().coast}</span><em>${t().movement}</em>`;
    tooltip();
  }
  window.GNK_GEO_MAP = {
    selectLocation(id) { const node = point(id); if (!node) return false; showDetail(node); return true; },
    getSelected() { return state.selected; },
    getSvg() { return document.getElementById('networkGeoSvg'); },
    redraw: draw
  };
  async function init() {
    try {
      const [net, geo] = await Promise.all([fetch('data/group_network.json?v=' + Date.now(), { cache: 'no-store' }), fetch('data/group_network_geo.json?v=' + Date.now(), { cache: 'no-store' })]);
      if (!net.ok || !geo.ok) return;
      state.network = await net.json(); state.geo = await geo.json(); geography().load?.().then(draw);
      let attempts = 0; const timer = setInterval(() => { if (createShell()) { decorate(); draw(); clearInterval(timer); } else if (++attempts > 120) clearInterval(timer); }, 70);
      document.addEventListener('click', event => { if (event.target.matches('#global-network [data-filter]')) { state.filter = event.target.dataset.filter || 'all'; draw(); } });
      document.addEventListener('gnk-location-selected', event => { if (event.detail?.id && event.detail.source !== '2d' && state.selected !== event.detail.id) { state.selected = event.detail.id; draw(); } });
      document.addEventListener('gnk-geography-ready', draw);
      window.addEventListener('gnk-language-change', () => { decorate(); draw(); });
    } catch (error) { console.warn('Geographic 2D layer unavailable; standard network remains active.', error); }
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
