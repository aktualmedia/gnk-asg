(() => {
  'use strict';
  function isEnglish() {
    return /\/en(?:\/|$)/.test(location.pathname) || (window.GNK_LANG && window.GNK_LANG.get && window.GNK_LANG.get() === 'en');
  }
  function esc(value) {
    return String(value || '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  }
  function routeMenu() {
    const nav = document.getElementById('navLinks');
    if (!nav) return;
    nav.querySelectorAll('a').forEach(link => {
      const text = (link.textContent || '').trim().toLowerCase();
      const href = link.getAttribute('href') || '';
      if (href === '#news' || text === 'business news' || text === 'vijesti' || text === 'news') {
        link.setAttribute('href', '/news/');
      }
    });
  }
  function renderNewsLink() {
    const section = document.getElementById('news');
    if (!section || section.dataset.newsOffsite === '1') return;
    section.dataset.newsOffsite = '1';
    const en = isEnglish();
    const head = section.querySelector('.section-head');
    const grid = document.getElementById('newsGrid');
    if (head) {
      const eyebrow = head.querySelector('.eyebrow');
      const title = head.querySelector('h2');
      const p = head.querySelector('p:not(.eyebrow)');
      if (eyebrow) eyebrow.textContent = en ? 'News moved to a separate layer' : 'Vijesti su izdvojene u poseban sloj';
      if (title) title.textContent = en ? 'Business News' : 'Poslovne vijesti';
      if (p) p.textContent = en ? 'For faster loading, news are now separated from the main front page.' : 'Radi bržeg učitavanja, vijesti su izdvojene s početne stranice.';
    }
    if (grid) {
      grid.innerHTML = '<article class="news-card" style="min-height:0"><div class="meta">NEWS</div><h3>' + esc(en ? 'Open the separate news section' : 'Otvori zasebne vijesti') + '</h3><p>' + esc(en ? 'The main front remains focused on the visual identity, globe and core corporate presentation.' : 'Glavni front ostaje fokusiran na vizualni identitet, globus i osnovnu korporativnu prezentaciju.') + '</p><a href="/news/">' + esc(en ? 'Open News' : 'Otvori vijesti') + '</a></article>';
    }
  }
  function init() {
    routeMenu();
    renderNewsLink();
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
  window.addEventListener('gnk-language-change', init);
})();
