(() => {
  'use strict';
  if (window.GNK_SITE_SHARE_READY) return;
  window.GNK_SITE_SHARE_READY = true;
  const ROOT = '/';
  const COUNTER_START = new Date('2026-05-26T17:00:00+02:00');
  const COUNTER_BASE = 2062;
  const ZONE = 'Europe/Zagreb';
  if (!document.querySelector('link[data-gnk-share-style]')) {
    const css = document.createElement('link');
    css.rel = 'stylesheet'; css.dataset.gnkShareStyle = '1';
    css.href = ROOT + 'assets/site-share.css?v=20260526-indicative-visits01';
    document.head.appendChild(css);
  }
  const isEn = () => document.documentElement.lang === 'en' || /\/en(?:\/|$)/.test(location.pathname);
  const copy = () => isEn() ? {label:'Share page', native:'Share', visits:'Indicative visits', note:'Indicative activity model; not measured traffic analytics.'} : {label:'Podijeli stranicu', native:'Podijeli', visits:'Indikativni posjeti', note:'Indikativni model aktivnosti; nije mjerena analitika posjeta.'};
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
    if (hour >= 17 && hour < 19) return 22;
    if (hour >= 19 && hour < 23) return 31;
    return 6;
  }
  function indicativeVisits(now = new Date()) {
    let value = COUNTER_BASE;
    if (now <= COUNTER_START) return value;
    let cursor = new Date(COUNTER_START.getTime());
    while (cursor.getTime() + 3600000 <= now.getTime()) {
      value += hourlyRate(localHour(cursor));
      cursor = new Date(cursor.getTime() + 3600000);
    }
    return value;
  }
  function visitorMarkup() {
    const t = copy();
    return `<span class="gnk-visitor-pill" title="${t.note}"><small>${t.visits}</small><b data-gnk-indicative-visits>${new Intl.NumberFormat(isEn() ? 'en-GB' : 'hr-HR').format(indicativeVisits())}</b></span>`;
  }
  function markup(className) {
    const t = copy(), url = encoded(currentUrl()), title = encoded(pageTitle());
    const native = navigator.share ? `<button type="button" class="native" data-gnk-native-share>${t.native}</button>` : '';
    const visits = className === 'gnk-share-dock' ? visitorMarkup() : '';
    return `<div class="${className}"><strong>${t.label}</strong>${visits}<a target="_blank" rel="noopener" href="https://www.linkedin.com/sharing/share-offsite/?url=${url}">LinkedIn</a><a target="_blank" rel="noopener" href="https://wa.me/?text=${title}%20${url}">WhatsApp</a><a href="mailto:?subject=${title}&body=${title}%0A${url}">E-mail</a>${native}</div>`;
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
    if (!document.querySelector('.gnk-share-dock')) { const dock = create(markup('gnk-share-dock')); document.body.appendChild(dock); bindNative(dock); }
    const footer = document.querySelector('footer');
    if (footer && !document.querySelector('.gnk-share-inline')) { const panel = create(markup('gnk-share-inline')); footer.parentNode.insertBefore(panel, footer); bindNative(panel); }
    refreshVisits();
    window.setInterval(refreshVisits, 60000);
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', mount) : mount();
})();
