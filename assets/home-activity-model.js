(() => {
  'use strict';

  const BASE_COUNT = 6857;
  const BASE_TIME = Date.parse('2026-05-31T18:45:00+02:00');

  function isHome() {
    const path = location.pathname.replace(/\/+$/, '/');
    return path === '/' || path === '/index.html' || path === '/en/' || path === '/en/index.html';
  }

  function isEnglish() {
    return /\/en\/?$/.test(location.pathname) || /\/en\//.test(location.pathname) || (window.GNK_LANG && window.GNK_LANG.get && window.GNK_LANG.get() === 'en');
  }

  function zagrebHour(time) {
    return Number(new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Zagreb',
      hour: '2-digit',
      hour12: false
    }).format(new Date(time)));
  }

  function growthForHour(hour, index) {
    if (hour >= 0 && hour < 7) return index % 2 === 0 ? 6 : 5;
    if (hour >= 7 && hour < 9) return 48;
    if (hour >= 9 && hour < 14) return 27;
    if (hour >= 14 && hour < 17) return 19;
    if (hour >= 17 && hour < 19) return 22;
    if (hour >= 19 && hour < 23) return 31;
    return 6;
  }

  function activityValue() {
    const now = Date.now();
    if (!BASE_TIME || now <= BASE_TIME) return BASE_COUNT;

    const elapsed = now - BASE_TIME;
    const fullHours = Math.floor(elapsed / 3600000);
    let total = BASE_COUNT;

    for (let i = 1; i <= fullHours; i += 1) {
      total += growthForHour(zagrebHour(BASE_TIME + i * 3600000), i);
    }

    const currentGrowth = growthForHour(zagrebHour(now), fullHours + 1);
    total += Math.floor(((elapsed % 3600000) / 3600000) * currentGrowth);
    return total;
  }

  function ensureStyle() {
    if (document.getElementById('homeActivityModelStyle')) return;
    const style = document.createElement('style');
    style.id = 'homeActivityModelStyle';
    style.textContent = [
      '.reader-counter{margin-top:14px;background:rgba(255,255,255,.92);border:1px solid rgba(212,175,55,.34);border-radius:18px;padding:14px;box-shadow:0 10px 26px rgba(7,22,45,.08);display:grid;grid-template-columns:auto 1fr;gap:12px;align-items:center}',
      '.reader-counter .reader-icon{width:42px;height:42px;border-radius:14px;background:var(--navy,#07162d);color:var(--gold,#d4af37);display:grid;place-items:center;font-weight:900}',
      '.reader-counter small{display:block;color:var(--muted,#64748b);font-size:.66rem;font-weight:900;letter-spacing:.12em;text-transform:uppercase}',
      '.reader-counter strong{display:block;color:var(--navy,#07162d);font-size:1.42rem;line-height:1.1;margin:3px 0}',
      '.reader-counter span{color:var(--muted,#64748b);font-size:.78rem;line-height:1.35}',
      '@media(max-width:720px){.reader-counter{grid-template-columns:1fr}.reader-counter .reader-icon{display:none}}'
    ].join('');
    document.head.appendChild(style);
  }

  function update() {
    const node = document.getElementById('readerCounterValue');
    if (!node) return;
    node.textContent = new Intl.NumberFormat(isEnglish() ? 'en-US' : 'hr-HR').format(activityValue());
  }

  function removeDuplicates() {
    const counters = Array.from(document.querySelectorAll('.reader-counter'));
    counters.slice(1).forEach(node => node.remove());
  }

  function render() {
    if (!isHome()) return;
    ensureStyle();
    removeDuplicates();

    let box = document.getElementById('readerCounter');
    const en = isEnglish();

    if (!box) {
      const anchor = document.querySelector('.profile-board .quick-data') || document.querySelector('.hero .hero-actions') || document.querySelector('.hero .container');
      if (!anchor) return;
      box = document.createElement('div');
      box.className = 'reader-counter';
      box.id = 'readerCounter';
      anchor.insertAdjacentElement(anchor.classList && anchor.classList.contains('quick-data') ? 'afterend' : 'beforeend', box);
    }

    box.innerHTML = '<div class="reader-icon">◎</div><div><small>' + (en ? 'Public activity model' : 'Javni model aktivnosti') + '</small><strong id="readerCounterValue">—</strong><span>' + (en ? 'Indicative display; not measured analytics.' : 'Indikativni prikaz; nije mjerena analitika.') + '</span></div>';
    update();
  }

  function boot() {
    render();
    update();
    window.setInterval(update, 60000);
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', boot) : boot();
  window.addEventListener('gnk-language-change', render);
})();
