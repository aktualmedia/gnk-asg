(() => {
  'use strict';
  if (window.GNK_SITE_SHARE_READY) return;
  window.GNK_SITE_SHARE_READY = true;
  const isEn = () => document.documentElement.lang === 'en' || /\/en(?:\/|$)/.test(location.pathname);
  const copy = () => isEn() ? {label:'Share page', native:'Share'} : {label:'Podijeli stranicu', native:'Podijeli'};
  const currentUrl = () => window.location.href;
  const pageTitle = () => document.title || 'GNK ASG d.o.o.';
  const encoded = value => encodeURIComponent(value);
  function markup(className) {
    const t = copy(), url = encoded(currentUrl()), title = encoded(pageTitle());
    const native = navigator.share ? `<button type="button" class="native" data-gnk-native-share>${t.native}</button>` : '';
    return `<div class="${className}"><strong>${t.label}</strong><a target="_blank" rel="noopener" href="https://www.linkedin.com/sharing/share-offsite/?url=${url}">LinkedIn</a><a target="_blank" rel="noopener" href="https://wa.me/?text=${title}%20${url}">WhatsApp</a><a href="mailto:?subject=${title}&body=${title}%0A${url}">E-mail</a>${native}</div>`;
  }
  function create(markupText) { const host = document.createElement('div'); host.innerHTML = markupText; return host.firstElementChild; }
  function bindNative(root) {
    root.querySelectorAll('[data-gnk-native-share]').forEach(button => button.addEventListener('click', () => {
      navigator.share({title:pageTitle(), url:currentUrl()}).catch(() => {});
    }));
  }
  function mount() {
    if (!document.querySelector('.gnk-share-dock')) { const dock = create(markup('gnk-share-dock')); document.body.appendChild(dock); bindNative(dock); }
    const footer = document.querySelector('footer');
    if (footer && !document.querySelector('.gnk-share-inline')) { const panel = create(markup('gnk-share-inline')); footer.parentNode.insertBefore(panel, footer); bindNative(panel); }
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', mount) : mount();
})();
