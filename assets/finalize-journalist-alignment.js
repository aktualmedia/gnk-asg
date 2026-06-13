(() => {
  'use strict';

  const NEWS_REFRESH_LABEL_HR = 'Vijesti se osvježavaju u 09:00 i 16:00 po hrvatskom vremenu.';
  const NEWS_REFRESH_LABEL_EN = 'News is refreshed at 09:00 and 16:00 Europe/Zagreb.';

  function isEnglish() {
    return document.documentElement.lang === 'en' || /\/en\/?/.test(location.pathname) || (window.GNK_LANG && window.GNK_LANG.get && window.GNK_LANG.get() === 'en');
  }

  function label(hr, en) {
    return isEnglish() ? en : hr;
  }

  function ensureNavLink(href, textHr, textEn) {
    const nav = document.getElementById('navLinks');
    if (!nav) return;
    const exists = Array.from(nav.querySelectorAll('a')).some(link => (link.getAttribute('href') || '') === href);
    if (exists) return;
    const link = document.createElement('a');
    link.href = href;
    link.dataset.hr = textHr;
    link.dataset.en = textEn;
    link.textContent = label(textHr, textEn);
    const legal = Array.from(nav.querySelectorAll('a')).find(item => /legal/i.test(item.textContent || '') || /legal\.html/.test(item.getAttribute('href') || ''));
    nav.insertBefore(link, legal || null);
  }

  function alignNavigation() {
    ensureNavLink('/insights-hr/', 'Objave', 'Insights');
    ensureNavLink('/kontakt/', 'Kontakt', 'Contact');
  }

  function ensureHeroAction() {
    const actions = document.querySelector('.hero-actions');
    if (!actions || actions.querySelector('[href="/insights-hr/"]')) return;
    const link = document.createElement('a');
    link.className = 'btn ghost';
    link.href = '/insights-hr/';
    link.dataset.hr = 'Objave i analize';
    link.dataset.en = 'Insights';
    link.textContent = label('Objave i analize', 'Insights');
    actions.appendChild(link);
  }

  function alignNewsStaticText() {
    const head = document.querySelector('#news .section-head');
    if (head) {
      const eyebrow = head.querySelector('.eyebrow');
      const paragraph = head.querySelector('p:not(.eyebrow)');
      if (eyebrow) eyebrow.textContent = label(NEWS_REFRESH_LABEL_HR, NEWS_REFRESH_LABEL_EN);
      if (paragraph) paragraph.textContent = label(
        'Javni prozor prikazuje do 100 najnovijih odabranih poslovnih i tehnoloških vijesti. Podatci se objavljuju dva puta dnevno, uz zadržavanje arhive i označavanje izvora.',
        'The public window shows up to 100 selected business and technology news items. Data is published twice daily, with archive retention and source labelling.'
      );
    }

    const card = document.querySelector('#newsGrid .news-card');
    if (card && /u pripremi|in preparation/i.test(card.textContent || '')) {
      const meta = card.querySelector('.meta');
      const title = card.querySelector('h3');
      const body = card.querySelector('p');
      if (meta) meta.textContent = label('JAVNI PREGLED', 'PUBLIC MONITOR');
      if (title) title.textContent = label('Učitavanje poslovnih vijesti', 'Loading business news');
      if (body) body.textContent = label(
        'Vijesti se učitavaju iz javne podatkovne datoteke portala. Redovni ciklus objave je 09:00 i 16:00 po hrvatskom vremenu.',
        'News is loaded from the portal public data file. The regular publication cycle is 09:00 and 16:00 Europe/Zagreb.'
      );
    }
  }

  function installNewsStatusStyle() {
    if (document.getElementById('gnk-news-status-note-style')) return;
    const style = document.createElement('style');
    style.id = 'gnk-news-status-note-style';
    style.textContent = '.gnk-news-status-note{margin:0 0 18px;padding:12px 15px;border:1px solid rgba(212,175,55,.30);border-radius:16px;background:rgba(255,250,240,.72);color:#435269;font-size:.86rem;line-height:1.55}.gnk-news-status-note strong{color:#07162d}.gnk-news-status-note span{color:#7c5616;font-weight:800}';
    document.head.appendChild(style);
  }

  async function alignNewsStatusNote() {
    const tabs = document.getElementById('newsTabs');
    if (!tabs || document.getElementById('gnkNewsStatusNote')) return;
    installNewsStatusStyle();
    let news = null;
    try {
      const response = await fetch('/data/update_status.json?v=' + Date.now(), { cache: 'no-store' });
      const status = response.ok ? await response.json() : null;
      news = status && status.news ? status.news : null;
    } catch (_) {}
    const note = document.createElement('div');
    note.id = 'gnkNewsStatusNote';
    note.className = 'gnk-news-status-note';
    if (news && news.updated_at) {
      const date = new Date(news.updated_at).toLocaleString(isEnglish() ? 'en-GB' : 'hr-HR');
      note.innerHTML = label(
        '<strong>Status vijesti:</strong> ' + Number(news.public_items || 0) + ' javnih stavki · <span>2 puta dnevno</span> · zadnje ažuriranje: ' + date + '.',
        '<strong>News status:</strong> ' + Number(news.public_items || 0) + ' public items · <span>twice daily</span> · last update: ' + date + '.'
      );
    } else {
      note.textContent = label(NEWS_REFRESH_LABEL_HR, NEWS_REFRESH_LABEL_EN);
    }
    tabs.insertAdjacentElement('afterend', note);
  }

  function relabelDynamicText() {
    document.querySelectorAll('[data-hr][data-en]').forEach(node => { node.textContent = label(node.dataset.hr, node.dataset.en); });
    alignNewsStaticText();
  }

  function init() {
    alignNavigation();
    ensureHeroAction();
    alignNewsStaticText();
    alignNewsStatusNote();
    window.addEventListener('gnk-language-change', relabelDynamicText);
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
