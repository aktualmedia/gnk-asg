(() => {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  let network = null, facts = null, activeId = 'boulder', busy = false;
  const en = () => document.documentElement.lang === 'en' || /\/en\/?$/.test(location.pathname) || (window.GNK_LANG && window.GNK_LANG.get && window.GNK_LANG.get() === 'en');
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const tr = () => en() ? {select:'Selected group position', country:'Country', continent:'Continent', city:'City / location', countryPop:'Country population', cityPop:'City population', status:'Position status', existing:'Existing group company', planned:'Planned expansion 2026', hq:'Central headquarters', finance:'Displayed financial context', source:'Demographic source basis', basis:'Figures are indicative; scope of city estimate', locate:'Selected point pulses red on the map and globe.'} : {select:'Odabrana pozicija grupe', country:'Država', continent:'Kontinent', city:'Grad / lokacija', countryPop:'Stanovnika države', cityPop:'Stanovnika grada', status:'Status pozicije', existing:'Postojeće društvo grupe', planned:'Planirano širenje 2026.', hq:'Središnje sjedište', finance:'Prikazani financijski kontekst', source:'Osnova demografskih izvora', basis:'Brojevi su orijentacijski; opseg gradskog podatka', locate:'Odabrana točka pulsira crveno na karti i globusu.'};
  const items = () => network ? [network.center].concat(network.nodes || []) : [];
  const node = id => items().find(item => item.id === id);
  const nName = item => item.id === 'boulder' ? item.name : (en() ? item.name_en : item.name_hr);
  const nPlace = item => item.id === 'boulder' ? item.place : (en() ? item.place_en : item.place_hr);
  async function get(path) { try { const r = await fetch(path + '?v=' + Date.now(), {cache:'no-store'}); return r.ok ? r.json() : null; } catch (_) { return null; } }
  function findId() {
    const title = document.querySelector('#networkDetail h4')?.textContent.trim();
    if (!title) return activeId;
    const match = items().find(item => nName(item) === title || (item.id === 'boulder' && item.name === title));
    return match ? match.id : activeId;
  }
  function state(item) { const T=tr(); return item.id === 'boulder' ? T.hq : item.status === 'planned' ? T.planned : T.existing; }
  function renderFacts(id) {
    const box = document.getElementById('networkDetail'), item = node(id), fact = facts && facts.locations && facts.locations[id];
    if (!box || !item || !fact) return;
    activeId = id;
    box.querySelector('.location-insights')?.remove();
    const T = tr();
    const country = en() ? fact.country_en : fact.country_hr;
    const continent = en() ? fact.continent_en : fact.continent_hr;
    const finance = en() ? facts.financial_context_en : facts.financial_context_hr;
    const basis = en() ? facts.population_basis_en : facts.population_basis_hr;
    const card = document.createElement('section'); card.className = 'location-insights';
    card.innerHTML = `<div class="insight-heading"><small>${esc(T.select)}</small><strong>${esc(nName(item))}</strong><span>${esc(nPlace(item))}</span></div><div class="insight-grid"><div><label>${esc(T.country)}</label><b>${esc(country)}</b></div><div><label>${esc(T.continent)}</label><b>${esc(continent)}</b></div><div><label>${esc(T.countryPop)}</label><b>${esc(fact.country_population)}</b></div><div><label>${esc(T.cityPop)}</label><b>${esc(fact.city_population)}</b></div><div class="wide"><label>${esc(T.status)}</label><b>${esc(state(item))}</b></div></div><div class="insight-finance"><label>${esc(T.finance)}</label><p>${esc(finance)}</p></div><details class="insight-source"><summary>${esc(T.source)}</summary><p>${esc(basis)}</p><p>${esc(T.basis)}: ${esc(fact.city_population_scope)}.</p>${(facts.sources || []).map(src => `<a href="${esc(src.url)}" target="_blank" rel="noopener">${esc(src.label)}</a>`).join('')}</details><p class="insight-pulse">● ${esc(T.locate)}</p>`;
    box.appendChild(card);
    pulse2d(id);
    document.dispatchEvent(new CustomEvent('gnk-location-selected', {detail:{id}}));
  }
  function mapGroups() {
    const groups = Array.from(document.querySelectorAll('#networkSvg .network-node'));
    items().forEach((item, i) => { if (groups[i]) groups[i].dataset.locationId = item.id; });
  }
  function pulse2d(id) {
    mapGroups();
    document.querySelectorAll('#networkSvg .network-node').forEach(group => group.classList.toggle('location-pulse-red', group.dataset.locationId === id));
  }
  function svgText(svg, label, x, y) { const el = document.createElementNS(NS,'text'); el.setAttribute('class','network-continent-name'); el.setAttribute('x',x); el.setAttribute('y',y); el.textContent=label; svg.insertBefore(el, svg.firstChild?.nextSibling || null); }
  function continents() {
    const svg = document.getElementById('networkSvg'); if (!svg || svg.querySelector('.network-continent-name')) return;
    const labels = en() ? [['NORTH AMERICA',88,69],['SOUTH AMERICA',135,338],['EUROPE',486,56],['AFRICA',440,333],['ASIA',734,104],['OCEANIA',855,445]] : [['SJEVERNA AMERIKA',88,69],['JUŽNA AMERIKA',135,338],['EUROPA',486,56],['AFRIKA',440,333],['AZIJA',734,104],['OCEANIJA',855,445]];
    labels.forEach(label => svgText(svg,label[0],label[1],label[2]));
  }
  function watch() {
    const detail=document.getElementById('networkDetail'), svg=document.getElementById('networkSvg');
    if (!detail || !svg || detail.dataset.locationFacts) return false;
    detail.dataset.locationFacts='1';
    const refresh=()=>{ if (busy) return; busy=true; setTimeout(()=>{ mapGroups(); continents(); renderFacts(findId()); busy=false; },15); };
    new MutationObserver(refresh).observe(detail,{childList:true,subtree:true});
    new MutationObserver(()=>{ mapGroups(); continents(); pulse2d(activeId); }).observe(svg,{childList:true,subtree:true});
    refresh(); return true;
  }
  async function init() {
    [network,facts]=await Promise.all([get('data/group_network.json'),get('data/group_location_facts.json')]);
    if (!network || !facts) return;
    let count=0; const timer=setInterval(()=>{ if(watch() || ++count > 120) clearInterval(timer); },80);
    window.addEventListener('gnk-language-change',()=>{ document.querySelectorAll('#networkSvg .network-continent-name').forEach(e=>e.remove()); continents(); renderFacts(activeId); });
  }
  document.readyState==='loading' ? document.addEventListener('DOMContentLoaded',init) : init();
})();
