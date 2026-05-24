(() => {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const state = {network:null, geo:null, filter:'all', selected:'boulder', scale:1};
  const en = () => document.documentElement.lang === 'en' || /\/en\/?$/.test(location.pathname) || (window.GNK_LANG && window.GNK_LANG.get && window.GNK_LANG.get() === 'en');
  const t = () => en() ? {map:'2D Geographic Network', coast:'Verified geographic coastline', hq:'Central headquarters', active:'Existing company', planned:'Planned expansion 2026', region:'Region'} : {map:'2D geografska mreža', coast:'Provjereni geografski obrisi kopna', hq:'Središnje sjedište', active:'Postojeće društvo', planned:'Planirano širenje 2026.', region:'Regija'};
  const geography = () => window.GNK_GEOGRAPHY || {state:{polygons:[]}, labels:{}, microLand:{}};
  const project = (lat,lng) => ({x:38 + ((lng + 180) / 360) * 964, y:34 + ((90 - lat) / 180) * 468});
  const n = id => state.network?.nodes.find(item => item.id === id) || (id === state.network?.center.id ? state.network.center : null);
  const point = id => {
    const node = n(id), geo = id === 'boulder' ? state.geo?.center : state.geo?.nodes[id];
    return node && geo ? {...node, ...geo, ...project(geo.lat, geo.lng)} : null;
  };
  const name = node => node.id === 'boulder' ? node.name : (en() ? node.name_en : node.name_hr);
  const place = node => node.id === 'boulder' ? node.place : (en() ? node.place_en : node.place_hr);
  const visible = node => state.filter === 'all' || (state.filter === 'active' ? node.status === 'active' || node.id === 'boulder' : state.filter === 'planned' ? node.status === 'planned' : node.region !== 'Europa');
  function el(tag, attrs={}) { const item=document.createElementNS(NS,tag); Object.entries(attrs).forEach(([k,v])=>item.setAttribute(k,v)); return item; }
  function landPath(ring) {
    return ring.map(([lng,lat], index) => { const p = project(lat,lng); return `${index ? 'L' : 'M'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`; }).join(' ') + ' Z';
  }
  function createShell() {
    const old = document.getElementById('networkSvg'), host = old?.parentElement;
    if (!old || !host) return null;
    old.classList.add('legacy-network-svg');
    let svg = document.getElementById('networkGeoSvg');
    if (!svg) { svg = el('svg', {id:'networkGeoSvg', viewBox:'0 0 1040 545', 'aria-label':t().map}); svg.classList.add('network-geo-svg'); host.insertBefore(svg, old); }
    return svg;
  }
  function drawSea(svg) {
    svg.appendChild(el('rect', {class:'geo-ocean', x:0, y:0, width:1040, height:545, rx:18}));
    const grid=el('g',{class:'geo-grid'});
    for(let lng=-150;lng<=150;lng+=30){const a=project(80,lng),b=project(-65,lng);grid.appendChild(el('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y}));}
    for(let lat=-60;lat<=60;lat+=30){const a=project(lat,-180),b=project(lat,180);grid.appendChild(el('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y}));}
    svg.appendChild(grid);
  }
  function drawLand(svg) {
    const group=el('g',{class:'geo-land'});
    (geography().state.polygons || []).forEach(poly => { const d = poly.map(landPath).join(' '); group.appendChild(el('path',{d, 'fill-rule':'evenodd'})); });
    svg.appendChild(group);
    const micro=el('g',{class:'geo-micro-land'});
    Object.values(geography().microLand || {}).forEach(dot => { const p=project(dot.lat,dot.lng); micro.appendChild(el('circle',{cx:p.x,cy:p.y,r:Math.max(2.4,dot.size)})); });
    svg.appendChild(micro);
  }
  function drawLabels(svg) {
    const T = en() ? {na:'NORTH AMERICA',sa:'SOUTH AMERICA',eu:'EUROPE',af:'AFRICA',as:'ASIA',oc:'OCEANIA'} : {na:'SJEVERNA AMERIKA',sa:'JUŽNA AMERIKA',eu:'EUROPA',af:'AFRIKA',as:'AZIJA',oc:'OCEANIJA'};
    const labels=el('g',{class:'geo-continent-labels'});
    Object.entries(geography().labels || {}).forEach(([key,[lat,lng]]) => { const p=project(lat,lng), text=el('text',{x:p.x,y:p.y,'text-anchor':'middle'}); text.textContent=T[key]; labels.appendChild(text); });
    svg.appendChild(labels);
  }
  function arc(a,b,planned,peer=false) {
    const mx=(a.x+b.x)/2, rise=Math.min(72,Math.abs(a.x-b.x)*.10+18);
    return el('path',{class:planned?'geo-route planned':peer?'geo-route peer':'geo-route direct',d:`M ${a.x} ${a.y} Q ${mx} ${Math.min(a.y,b.y)-rise} ${b.x} ${b.y}`});
  }
  function drawRoutes(svg) {
    const centre=point('boulder'), routes=el('g',{class:'geo-routes'});
    state.network.nodes.forEach(item => {const target=point(item.id); if(target && visible(target)) routes.appendChild(arc(centre,target,item.status==='planned'));});
    state.network.peer_links.forEach(([first,second]) => {const a=point(first),b=point(second); if(a&&b&&visible(a)&&visible(b)) routes.appendChild(arc(a,b,a.status==='planned'||b.status==='planned',true));});
    svg.appendChild(routes);
  }
  function updateDetail(node) {
    const box=document.getElementById('networkDetail'); if(!box) return;
    const status=node.id==='boulder'?t().hq:node.status==='planned'?t().planned:t().active;
    box.innerHTML=`<small>${t().map}</small><h4>${name(node)}</h4><p>${place(node)}</p><p><strong>${t().region}:</strong> ${node.region || '—'}</p><span class="state ${node.id==='boulder'?'hq':node.status}">${status}</span>`;
    state.selected=node.id; document.dispatchEvent(new CustomEvent('gnk-location-selected',{detail:{id:node.id}})); draw();
  }
  function drawNodes(svg) {
    const layer=el('g',{class:'geo-nodes'});
    [point('boulder'), ...state.network.nodes.map(item=>point(item.id)).filter(Boolean)].filter(visible).forEach(node => {
      const group=el('g',{class:`geo-node ${node.id==='boulder'?'hq':node.status}${node.id===state.selected?' selected':''}`,'data-location-id':node.id});
      group.appendChild(el('circle',{cx:node.x,cy:node.y,r:node.id==='boulder'?8:node.status==='planned'?5:5.4}));
      if (node.id === state.selected || node.id === 'boulder') { const label=el('text',{x:node.x+11,y:node.y-7}); label.textContent=name(node); group.appendChild(label); const sub=el('text',{class:'sub',x:node.x+11,y:node.y+8}); sub.textContent=place(node); group.appendChild(sub); }
      group.addEventListener('click',()=>updateDetail(node)); layer.appendChild(group);
    });
    svg.appendChild(layer);
  }
  function draw() {
    if(!state.network || !state.geo) return;
    const svg=createShell(); if(!svg) return;
    svg.innerHTML=''; drawSea(svg); drawLand(svg); drawLabels(svg); drawRoutes(svg); drawNodes(svg); svg.style.transform=`scale(${state.scale})`;
  }
  function controls() {
    const canvas=document.querySelector('#global-network .network-canvas'); if(!canvas || document.getElementById('geoMapBadge')) return;
    const badge=document.createElement('div'); badge.id='geoMapBadge'; badge.className='geo-map-badge'; badge.innerHTML=`<strong>${t().map}</strong><span>${t().coast}</span>`; canvas.appendChild(badge);
    canvas.querySelector('[data-zoom="in"]')?.addEventListener('click', e=>{e.stopImmediatePropagation();state.scale=Math.min(1.55,state.scale+.15);draw();},true);
    canvas.querySelector('[data-zoom="out"]')?.addEventListener('click', e=>{e.stopImmediatePropagation();state.scale=Math.max(.75,state.scale-.15);draw();},true);
    canvas.querySelector('[data-zoom="reset"]')?.addEventListener('click', e=>{e.stopImmediatePropagation();state.scale=1;draw();},true);
  }
  async function init() {
    try {
      const [net,geo]=await Promise.all([fetch('data/group_network.json?v='+Date.now(),{cache:'no-store'}),fetch('data/group_network_geo.json?v='+Date.now(),{cache:'no-store'})]);
      if(!net.ok || !geo.ok) return; state.network=await net.json(); state.geo=await geo.json(); geography().load?.().then(draw);
      let attempts=0; const timer=setInterval(()=>{if(createShell()){controls();draw();clearInterval(timer);} else if(++attempts>120)clearInterval(timer);},70);
      document.addEventListener('click',e=>{if(e.target.matches('#global-network [data-filter]')){state.filter=e.target.dataset.filter||'all';draw();}});
      document.addEventListener('gnk-location-selected',e=>{if(e.detail?.id && state.selected!==e.detail.id){state.selected=e.detail.id;draw();}});
      document.addEventListener('gnk-geography-ready',draw);
      window.addEventListener('gnk-language-change',()=>{document.getElementById('geoMapBadge')?.remove();controls();draw();});
    } catch(error) { console.warn('Geographic 2D layer unavailable; standard network remains active.', error); }
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
