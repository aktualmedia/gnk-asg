(() => {
  'use strict';
  if (window.GNK_SITE_SHARE_READY) return;
  window.GNK_SITE_SHARE_READY = true;
  const ROOT = '/';
  const COUNTER_START = new Date('2026-05-27T17:46:08+02:00');
  const COUNTER_BASE = 3056;
  const COUNTER_VERSION = 'v3056-20260527-174608';
  const STATE_KEY = 'gnk_asg_indicative_visits_' + COUNTER_VERSION;
  const ZONE = 'Europe/Zagreb';
  const CARDS = [
    { id:'portal', hr:'Portal', en:'Portal', path:'/podijeli/portal/' },
    { id:'financije', hr:'Financije', en:'Financials', path:'/podijeli/financije/' },
    { id:'grupa', hr:'Globalna mreža', en:'Global network', path:'/podijeli/grupa-kartica/' },
    { id:'trzista', hr:'Tržišta', en:'Markets', path:'/podijeli/trzista-kartica/' },
    { id:'bpp', hr:'BPP.IS', en:'BPP.IS', path:'/podijeli/bpp-kartica/' },
    { id:'tehnologija', hr:'Tehnologija', en:'Technology', path:'/podijeli/tehnologija/' },
    { id:'vijesti', hr:'Vijesti', en:'News', path:'/podijeli/vijesti/' },
    { id:'dokumenti', hr:'Dokumenti', en:'Documents', path:'/podijeli/dokumenti/' }
  ];
  if (!document.querySelector('link[data-gnk-share-style]')) {
    const css = document.createElement('link');
    css.rel = 'stylesheet'; css.dataset.gnkShareStyle = '1';
    css.href = ROOT + 'assets/site-share.css?v=20260527-share-permanent-cards01';
    document.head.appendChild(css);
  }
  const isEn = () => document.documentElement.lang === 'en' || /\/en(?:\/|$)/.test(location.pathname);
  const copy = () => isEn() ? {
    label:'Share portal', native:'Share portal', visits:'Indicative visits', home:'Home', choose:'Choose card', linkedin:'Share on LinkedIn',
    note:'Indicative activity model; not measured traffic analytics.'
  } : {
    label:'Podijeli portal', native:'Podijeli portal', visits:'Indikativni posjeti', home:'Početna', choose:'Odaberi karticu', linkedin:'Podijeli na LinkedInu',
    note:'Indikativni model aktivnosti; nije mjerena analitika posjeta.'
  };
  const encoded = value => encodeURIComponent(value);
  function localHour(date) { return Number(new Intl.DateTimeFormat('en-GB', { hour:'2-digit', hourCycle:'h23', timeZone:ZONE }).format(date)); }
  function hourlyRate(hour) {
    if (hour >= 7 && hour < 9) return 48;
    if (hour >= 9 && hour < 14) return 27;
    if (hour >= 14 && hour < 17) return 19;
    if (hour >= 17 && hour < 19) return 15;
    if (hour >= 19 && hour < 23) return 31;
    return hour % 2 === 0 ? 5 : 6;
  }
  function readState() { try { const value = JSON.parse(localStorage.getItem(STATE_KEY) || 'null'); return value && Number.isFinite(value.events) ? value : null; } catch (error) { return null; } }
  function saveState(state) { try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch (error) {} }
  function startPageVisit() { const previous = readState(); if (!previous) { saveState({ events:0, initializedAt:Date.now(), lastAction:'initial-view' }); return; } previous.events += 1; previous.lastAction = 'open-or-refresh'; previous.updatedAt = Date.now(); saveState(previous); }
  function countInteraction() { const state = readState() || { events:0, initializedAt:Date.now() }; state.events += 1; state.lastAction = 'click'; state.updatedAt = Date.now(); saveState(state); refreshVisits(); }
  function timedVisits(now = new Date()) {
    if (now <= COUNTER_START) return COUNTER_BASE;
    let value = COUNTER_BASE, cursor = new Date(COUNTER_START.getTime());
    while (cursor < now) { const hourEnd = new Date(cursor.getTime() + 3600000), segmentEnd = hourEnd < now ? hourEnd : now; value += hourlyRate(localHour(cursor)) * ((segmentEnd.getTime() - cursor.getTime()) / 3600000); cursor = segmentEnd; }
    return Math.floor(value);
  }
  function indicativeVisits(now = new Date()) { const state = readState(); return timedVisits(now) + (state ? state.events : 0); }
  function cardUrl(card) { return new URL(card.path, location.origin).href; }
  function activeCard() {
    const path = location.pathname;
    if (/\/trzista\/?$|\/en\/markets\/?$/.test(path)) return CARDS.find(card => card.id === 'trzista');
    if (/\/financije\/?$|\/en\/finance\/?$/.test(path)) return CARDS.find(card => card.id === 'financije');
    if (/\/tehnologija\/?$|\/en\/technology\/?$/.test(path)) return CARDS.find(card => card.id === 'tehnologija');
    if (/\/registri\/?$|\/en\/registries\/?$/.test(path)) return CARDS.find(card => card.id === 'dokumenti');
    return CARDS[0];
  }
  function cardLabel(card) { return isEn() ? card.en : card.hr; }
  function visitorMarkup() { const t = copy(); return `<span class="gnk-visitor-pill" title="${t.note}"><small>${t.visits}</small><b data-gnk-indicative-visits>${new Intl.NumberFormat(isEn() ? 'en-GB' : 'hr-HR').format(indicativeVisits())}</b></span>`; }
  function homeMarkup() { const t = copy(); return `<a class="gnk-home-pill" href="/" aria-label="${t.home}" title="${t.home}"><span aria-hidden="true">⌂</span><em>${t.home}</em></a>`; }
  function pickerMarkup() {
    const t = copy();
    return `<details class="gnk-share-picker"><summary>${t.choose}</summary><div class="gnk-share-picker-menu">${CARDS.map(card => `<a target="_blank" rel="noopener" href="https://www.linkedin.com/sharing/share-offsite/?url=${encoded(cardUrl(card))}" title="${t.linkedin}: ${cardLabel(card)}">${cardLabel(card)}</a>`).join('')}</div></details>`;
  }
  function markup(className) {
    const t = copy(), card = activeCard(), url = cardUrl(card), title = cardLabel(card) + ' | GNK ASG d.o.o.';
    const native = navigator.share ? `<button type="button" class="native" data-gnk-native-share data-url="${url}" data-title="${title}">${t.native}</button>` : '';
    const dockExtras = className === 'gnk-share-dock' ? homeMarkup() + visitorMarkup() : homeMarkup();
    return `<div class="${className}"><strong>${t.label}</strong>${dockExtras}<a class="gnk-share-current" target="_blank" rel="noopener" href="https://www.linkedin.com/sharing/share-offsite/?url=${encoded(url)}" title="${t.linkedin}: ${cardLabel(card)}">LinkedIn · ${cardLabel(card)}</a>${pickerMarkup()}${native}</div>`;
  }
  function create(markupText) { const host = document.createElement('div'); host.innerHTML = markupText; return host.firstElementChild; }
  function bindNative(root) { root.querySelectorAll('[data-gnk-native-share]').forEach(button => button.addEventListener('click', () => { navigator.share({ title:button.dataset.title, url:button.dataset.url }).catch(() => {}); })); }
  function refreshVisits() { const value = new Intl.NumberFormat(isEn() ? 'en-GB' : 'hr-HR').format(indicativeVisits()); document.querySelectorAll('[data-gnk-indicative-visits]').forEach(node => { node.textContent = value; }); }
  function mount() {
    startPageVisit();
    if (!document.querySelector('.gnk-share-dock')) { const dock = create(markup('gnk-share-dock')); document.body.appendChild(dock); bindNative(dock); }
    const footer = document.querySelector('footer');
    if (footer && !document.querySelector('.gnk-share-inline')) { const panel = create(markup('gnk-share-inline')); footer.parentNode.insertBefore(panel, footer); bindNative(panel); }
    refreshVisits();
    document.addEventListener('click', event => { if (!event.target.closest('.gnk-visitor-pill')) countInteraction(); }, { passive:true });
    window.setInterval(refreshVisits, 60000);
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', mount) : mount();
})();