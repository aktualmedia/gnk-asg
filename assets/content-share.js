(() => {
  'use strict';
  if (window.GNK_CONTENT_SHARE_READY) return;
  window.GNK_CONTENT_SHARE_READY = true;
  const STYLE_ID = 'gnk-content-share-style';
  const SHARE_CLASS = 'gnk-content-share';
  const isEnglish = () => document.documentElement.lang === 'en' || /\/en(?:\/|$)/.test(location.pathname) || (window.GNK_LANG && window.GNK_LANG.get && window.GNK_LANG.get() === 'en');
  const esc = (value) => String(value || '').replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const abs = (url) => new URL(url || location.href, location.origin).href;
  function installStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = '.gnk-content-share{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:12px}.gnk-content-share[data-compact="1"]{margin-top:10px}.gnk-content-share small{color:#8a9aab;font-size:.58rem;font-weight:900;letter-spacing:.12em;text-transform:uppercase;margin-right:3px}.gnk-content-share a,.gnk-content-share button{min-height:30px;display:inline-flex;align-items:center;justify-content:center;padding:0 10px;border:1px solid #dbe4ef;border-radius:999px;background:#f8fbff;color:#143b6d;text-decoration:none;font:850 .61rem/1 Arial,sans-serif;letter-spacing:.04em;text-transform:uppercase;cursor:pointer}.gnk-content-share a:hover,.gnk-content-share button:hover{border-color:#d4af37;background:#fffaf0;color:#07162d}.gnk-content-share .wa{border-color:#bfe5ca}.gnk-content-share .in{border-color:#cbdaf1}.gnk-content-share .mail{border-color:#ead9a4}.news-card .gnk-content-share,.topic-news .gnk-content-share,.news-item .gnk-content-share{border-top:1px solid #edf2f7;padding-top:10px}.news-card .gnk-content-share small,.topic-news .gnk-content-share small,.news-item .gnk-content-share small{width:100%;margin-bottom:2px}.section-head .gnk-content-share{margin-top:14px}.group-card .gnk-content-share,.doc .gnk-content-share,.topic-card .gnk-content-share{margin-top:14px}@media(max-width:680px){.gnk-content-share a,.gnk-content-share button{flex:1;min-width:76px;padding:0 7px}.gnk-content-share small{width:100%;margin-bottom:1px}}';
    document.head.appendChild(style);
  }
  function links(title, url) {
    const en = isEnglish();
    const label = en ? 'Share' : 'Podijeli';
    const cleanTitle = title || document.title || 'GNK ASG d.o.o.';
    const cleanUrl = abs(url || location.href);
    const text = encodeURIComponent(cleanTitle + ' — ' + cleanUrl);
    const encodedUrl = encodeURIComponent(cleanUrl);
    const encodedTitle = encodeURIComponent(cleanTitle);
    return '<div class="' + SHARE_CLASS + '" data-compact="1"><small>' + label + '</small>' +
      '<a class="wa" target="_blank" rel="noopener" href="https://wa.me/?text=' + text + '">WhatsApp</a>' +
      '<a class="in" target="_blank" rel="noopener" href="https://www.linkedin.com/sharing/share-offsite/?url=' + encodedUrl + '">LinkedIn</a>' +
      '<a class="mail" href="mailto:?subject=' + encodedTitle + '&body=' + text + '">E-mail</a>' +
      '</div>';
  }
  function addShare(host, title, url) {
    if (!host || host.querySelector(':scope > .' + SHARE_CLASS)) return;
    host.insertAdjacentHTML('beforeend', links(title, url));
  }
  function sectionTitle(section) {
    const head = section.querySelector('.section-head h2, h1, h2, h3');
    return head ? head.textContent.trim() : document.title;
  }
  function addSectionShares() {
    document.querySelectorAll('section[id]').forEach((section) => {
      const id = section.getAttribute('id');
      if (!id || ['top'].includes(id)) return;
      const head = section.querySelector(':scope > .container > .section-head, :scope > .container > .topic-intro, :scope > .container > .live-head');
      if (!head) return;
      addShare(head, sectionTitle(section), location.origin + location.pathname + '#' + id);
    });
  }
  function addNewsShares() {
    document.querySelectorAll('article.news-card, article.topic-news, article.news-item').forEach((card) => {
      const titleNode = card.querySelector('h1,h2,h3,h4');
      const sourceLink = card.querySelector('a[href]');
      const title = titleNode ? titleNode.textContent.trim() : document.title;
      const url = sourceLink ? sourceLink.href : location.href;
      addShare(card, title, url);
    });
  }
  function addCardShares() {
    document.querySelectorAll('.group-card, .doc, .topic-card, .publication-card').forEach((card) => {
      const titleNode = card.querySelector('h1,h2,h3,h4');
      const link = card.querySelector('a[href]');
      const title = titleNode ? titleNode.textContent.trim() : document.title;
      const section = card.closest('section[id]');
      const url = link ? link.href : (section ? location.origin + location.pathname + '#' + section.id : location.href);
      addShare(card, title, url);
    });
  }
  function run() {
    installStyle();
    addSectionShares();
    addNewsShares();
    addCardShares();
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', run) : run();
  let queued = false;
  new MutationObserver(() => {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(() => { queued = false; run(); });
  }).observe(document.documentElement, { childList:true, subtree:true });
  window.addEventListener('gnk-language-change', run);
})();
