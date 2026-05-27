(() => {
  'use strict';
  if (window.GNK_SITE_SHARE_READY) return;
  window.GNK_SITE_SHARE_READY = true;
  const ROOT = '/';
  const COUNTER_START = new Date('2026-05-27T10:27:00+02:00');
  const COUNTER_BASE = 2423;
  const COUNTER_VERSION = 'v2423-20260527';
  const STATE_KEY = 'gnk_asg_indicative_visits_' + COUNTER_VERSION;
  const ZONE = 'Europe/Zagreb';
  if (!document.querySelector('link[data-gnk-share-style]')) {
    const css = document.createElement('link');
    css.rel = 'stylesheet'; css.dataset.gnkShareStyle = '1';
    css.href = ROOT + 'assets/site-share.css?v=20260527-visits2423';
    document.head.appendChild(css);
  }
  const isEn = () => document.documentElement.lang === 'en' || /\/en(?:\/|$)/.test(location.pathname);
  const copy = () => isEn() ? {
    label:'Share page', native:'Share', visits:'Indicative visits', home:'Home',
    note:'Indicative activity model; not measured traffic analytics.'
  } : {
    label:'Podijeli stranicu', native:'Podijeli', visits:'Indikativni posjeti', home:'Početna',
    note:'Indikativni model aktivnosti; nije mjerena analitika posjeta.'
  };
  const currentUrl = () => window.location.href;
  const pageTitle = () => document.title || 'GNK ASG d.o.o.';
  const encoded = value => encodeURIComponent(value);
  function localHour(date) {
    return Number(new Intl.DateTimeFormat('en-GB', { hour:'2-digit', hourCycle:'h23', timeZone:ZONE }).format(date));
  }
  function hourlyRate(hour) {
    if (hour >= 7 && hour < 9) return 48;
    if (hour >= 9 && hour < 14) return 27;
    if (hour >= 14 && hour < 17) return 19;
    if (hour >= 17 && hour < 19) return 15;
    if (hour >= 19 && hour < 23) return 31;
    return hour % 2 === 0 ? 5 : 6;
  }
  function readState() {
    try {
      const value = JSON.parse(localStorage.getItem(STATE_KEY) || 'null');
      return value && Number.isFinite(value.events) ? value : null;
    } catch (error) { return null; }
  }
  function saveState(state) {
    try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch (error) {}
  }
  function startPageVisit() {
    const previous = readState();
    if (!previous) {
      saveState({ events:0, initializedAt:Date.now(), lastAction:'initial-view' });
      return;
    }
    previous.events += 1;
    previous.lastAction = 'open-or-refresh';
    previous.updatedAt = Date.now();
    saveState(previous);
  }
  function countInteraction() {
    const state = readState() || { events:0, initializedAt:Date.now() };
    state.events += 1;
    state.lastAction = 'click';
    state.updatedAt = Date.now();
    saveState(state);
    refreshVisits();
  }
  function timedVisits(now = new Date()) {
    if (now <= COUNTER_START) return COUNTER_BASE;
    let value = COUNTER_BASE;
    let cursor = new Date(COUNTER_START.getTime());
    while (cursor < now) {
      const hourEnd = new Date(cursor.getTime() + 3600000);
      const segmentEnd = hourEnd < now ? hourEnd : now;
      value += hourlyRate(localHour(cursor)) * ((segmentEnd.getTime() - cursor.getTime()) / 3600000);
      cursor = segmentEnd;
    }
    return Math.floor(value);
  }
  function indicativeVisits(now = new Date()) {
    const state = readState();
    return timedVisits(now) + (state ? state.events : 0);
  }
  function visitorMarkup() {
    const t = copy();
    return `<span class="gnk-visitor-pill" title="${t.note}"><small>${t.visits}</small><b data-gnk-indicative-visits>${new Intl.NumberFormat(isEn() ? 'en-GB' : 'hr-HR').format(indicativeVisits())}</b></span>`;
  }
  function homeMarkup() {
    const t = copy();
    return `<a class="gnk-home-pill" href="/" aria-label="${t.home}" title="${t.home}"><span aria-hidden="true">⌂</span><em>${t.home}</em></a>`;
  }
  function markup(className) {
    const t = copy(), url = encoded(currentUrl()), title = encoded(pageTitle());
    const native = navigator.share ? `<button type="button" class="native" data-gnk-native-share>${t.native}</button>` : '';
    const dockExtras = className === 'gnk-share-dock' ? homeMarkup() + visitorMarkup() : homeMarkup();
    return `<div class="${className}"><strong>${t.label}</strong>${dockExtras}<a target="_blank" rel="noopener" href="https://www.linkedin.com/sharing/share-offsite/?url=${url}">LinkedIn</a><a target="_blank" rel="noopener" href="https://wa.me/?text=${title}%20${url}">WhatsApp</a><a href="mailto:?subject=${title}&body=${title}%0A${url}">E-mail</a>${native}</div>`;
  }
  function create(markupText) { const host = document.createElement('div'); host.innerHTML = markupText; return host.firstElementChild; }
  function bindNative(root) {
    root.querySelectorAll('[data-gnk-native-share]').forEach(button => button.addEventListener('click', () => {
      navigator.share({title:pageTitle(), url:currentUrl()}).catch(() => {});
    }));
  }
  function refreshVisits() {
    const value = new Intl.NumberFormat(isEn() ? 'en-GB' : 'hr-HR').format(indicativeVisits());
    document.querySelectorAll('[data-gnk-indicative-visits]').forEach(node => { node.textContent = value; });
  }
  function mount() {
    startPageVisit();
    if (!document.querySelector('.gnk-share-dock')) { const dock = create(markup('gnk-share-dock')); document.body.appendChild(dock); bindNative(dock); }
    const footer = document.querySelector('footer');
    if (footer && !document.querySelector('.gnk-share-inline')) { const panel = create(markup('gnk-share-inline')); footer.parentNode.insertBefore(panel, footer); bindNative(panel); }
    refreshVisits();
    document.addEventListener('click', event => {
      if (event.target.closest('.gnk-visitor-pill')) return;
      countInteraction();
    }, { passive:true });
    window.setInterval(refreshVisits, 60000);
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', mount) : mount();
})();