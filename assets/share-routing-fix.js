(() => {
  'use strict';
  if (window.GNK_SHARE_ROUTING_READY) return;
  window.GNK_SHARE_ROUTING_READY = true;
  const REVISION = 'preview=20260527-unique04';
  const SECTIONS = {
    financials: '/podijeli/financije/',
    grupa: '/podijeli/grupa/',
    technology: '/podijeli/tehnologija/',
    'digital-assets': '/podijeli/trzista/',
    news: '/podijeli/vijesti/',
    dokumenti: '/podijeli/dokumenti/'
  };
  const versioned = path => {
    const url = new URL(path, location.origin);
    if (url.origin === location.origin && url.pathname.startsWith('/podijeli/') && !url.pathname.startsWith('/podijeli/vijest/')) {
      url.search = REVISION;
    }
    return url.href;
  };
  function apply(control, title, destination) {
    if (!control || !destination) return;
    const url = versioned(destination);
    const text = encodeURIComponent((title || document.title || 'GNK ASG d.o.o.') + ' — ' + url);
    const linkedIn = control.querySelector('a[href*="linkedin.com/sharing/share-offsite"]');
    const whatsApp = control.querySelector('a[href*="wa.me"]');
    const email = control.querySelector('a[href^="mailto:"]');
    if (linkedIn) linkedIn.href = 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url);
    if (whatsApp) whatsApp.href = 'https://wa.me/?text=' + text;
    if (email) email.href = 'mailto:?subject=' + encodeURIComponent(title || document.title) + '&body=' + text;
    control.dataset.previewUrl = url;
  }
  function repair() {
    Object.keys(SECTIONS).forEach(id => {
      const section = document.getElementById(id);
      if (!section) return;
      const head = section.querySelector('.section-head, .live-head');
      const title = section.querySelector('h1,h2,h3');
      apply(head && head.querySelector('.gnk-content-share'), title && title.textContent.trim(), SECTIONS[id]);
    });
    document.querySelectorAll('article.news-card[data-share-url],article.topic-news[data-share-url],article.news-item[data-share-url]').forEach(card => {
      const heading = card.querySelector('h1,h2,h3,h4');
      apply(card.querySelector('.gnk-content-share'), heading && heading.textContent.trim(), card.dataset.shareUrl);
    });
  }
  function init() {
    repair();
    new MutationObserver(repair).observe(document.body, { childList:true, subtree:true });
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
