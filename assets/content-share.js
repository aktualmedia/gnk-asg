(() => {
  'use strict';
  if (window.GNK_CONTENT_SHARE_READY) return;
  window.GNK_CONTENT_SHARE_READY = true;
  const SHARE = 'gnk-content-share';
  const isEnglish = () => document.documentElement.lang === 'en' || /\/en(?:\/|$)/.test(location.pathname) || (window.GNK_LANG && window.GNK_LANG.get && window.GNK_LANG.get() === 'en');
  const absolute = (value) => new URL(value || location.href, location.origin).href;

  function installStyle() {
    if (document.getElementById('gnk-content-share-style')) return;
    const style = document.createElement('style');
    style.id = 'gnk-content-share-style';
    style.textContent = [
      '.gnk-content-share{position:relative;display:flex;justify-content:flex-end;align-items:center;margin-top:9px}',
      '.gnk-share-toggle{display:inline-flex;align-items:center;gap:5px;min-height:24px;padding:0 8px;border:0;border-radius:999px;background:transparent;color:#8291a4;font:700 .55rem/1 Arial,sans-serif;letter-spacing:.09em;text-transform:uppercase;cursor:pointer;transition:color .16s ease,background .16s ease}',
      '.gnk-share-toggle:before{content:"↗";color:#aa7c22;font-size:.65rem}',
      '.gnk-share-toggle:hover,.gnk-content-share.open .gnk-share-toggle{color:#143b6d;background:#f4f7fb}',
      '.gnk-share-options{position:absolute;right:0;bottom:29px;z-index:80;display:none;gap:4px;padding:5px;border:1px solid #e0e7f0;border-radius:999px;background:#fff;box-shadow:0 8px 20px rgba(7,22,45,.09);white-space:nowrap}',
      '.gnk-content-share.open .gnk-share-options{display:flex}',
      '.gnk-share-options a{display:inline-flex;align-items:center;min-height:25px;padding:0 8px;border-radius:999px;color:#536b85;text-decoration:none;font:700 .54rem/1 Arial,sans-serif;letter-spacing:.04em;text-transform:uppercase;transition:background .16s ease,color .16s ease}',
      '.gnk-share-options a:hover{background:#f4f7fb;color:#143b6d}',
      '.news-card .gnk-content-share,.topic-news .gnk-content-share,.news-item .gnk-content-share{margin-top:7px;padding-top:6px;border-top:1px solid #f0f3f7}',
      '.section-head .gnk-content-share{justify-content:flex-start;margin-top:8px}',
      '.group-card .gnk-content-share,.doc .gnk-content-share,.topic-card .gnk-content-share,.publication-card .gnk-content-share{margin-top:7px}',
      '@media(max-width:680px){.gnk-share-options{right:0;bottom:28px}.gnk-share-toggle{min-height:27px}}'
    ].join('');
    document.head.appendChild(style);
  }

  function shareMarkup(title, url) {
    const label = isEnglish() ? 'Share' : 'Podijeli';
    const itemTitle = title || document.title || 'GNK ASG d.o.o.';
    const itemUrl = absolute(url || location.href);
    const message = encodeURIComponent(itemTitle + ' — ' + itemUrl);
    return '<div class="' + SHARE + '">' +
      '<button class="gnk-share-toggle" type="button" aria-expanded="false">' + label + '</button>' +
      '<div class="gnk-share-options" aria-label="' + label + '">' +
        '<a class="wa" target="_blank" rel="noopener" href="https://wa.me/?text=' + message + '">WhatsApp</a>' +
        '<a class="in" target="_blank" rel="noopener" href="https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(itemUrl) + '">LinkedIn</a>' +
        '<a class="mail" href="mailto:?subject=' + encodeURIComponent(itemTitle) + '&body=' + message + '">E-mail</a>' +
      '</div></div>';
  }

  function bind(control) {
    const button = control && control.querySelector('.gnk-share-toggle');
    if (!button || button.dataset.bound) return;
    button.dataset.bound = '1';
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      document.querySelectorAll('.gnk-content-share.open').forEach(other => {
        if (other !== control) {
          other.classList.remove('open');
          other.querySelector('.gnk-share-toggle')?.setAttribute('aria-expanded', 'false');
        }
      });
      const open = control.classList.toggle('open');
      button.setAttribute('aria-expanded', String(open));
    });
  }

  function add(host, title, url) {
    if (!host || host.querySelector(':scope > .' + SHARE)) return;
    host.insertAdjacentHTML('beforeend', shareMarkup(title, url));
    bind(host.querySelector(':scope > .' + SHARE));
  }

  function run() {
    installStyle();
    document.querySelectorAll('section[id]').forEach(section => {
      if (!section.id || section.id === 'top') return;
      const host = section.querySelector(':scope > .container > .section-head, :scope > .container > .live-head');
      const heading = section.querySelector('h1,h2,h3');
      if (host) add(host, heading ? heading.textContent.trim() : document.title, location.origin + location.pathname + '#' + section.id);
    });
    document.querySelectorAll('article.news-card, article.topic-news, article.news-item').forEach(card => {
      const heading = card.querySelector('h1,h2,h3,h4');
      const link = card.querySelector('a[href]:not(.wa):not(.in):not(.mail)');
      add(card, heading ? heading.textContent.trim() : document.title, link ? link.href : location.href);
    });
    document.querySelectorAll('.group-card, .doc, .topic-card, .publication-card').forEach(card => {
      const heading = card.querySelector('h1,h2,h3,h4');
      const link = card.querySelector('a[href]:not(.wa):not(.in):not(.mail)');
      const section = card.closest('section[id]');
      add(card, heading ? heading.textContent.trim() : document.title, link ? link.href : (section ? location.origin + location.pathname + '#' + section.id : location.href));
    });
  }

  document.addEventListener('click', () => {
    document.querySelectorAll('.gnk-content-share.open').forEach(control => {
      control.classList.remove('open');
      control.querySelector('.gnk-share-toggle')?.setAttribute('aria-expanded', 'false');
    });
  });
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', run) : run();
  let queued = false;
  new MutationObserver(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; run(); });
  }).observe(document.documentElement, { childList:true, subtree:true });
  window.addEventListener('gnk-language-change', run);
})();
