(() => {
  'use strict';
  if (window.GNK_BPP_CARD_READY) return;
  window.GNK_BPP_CARD_READY = true;
  const BPP_URL = 'https://bpp.is/';
  const SHARE_URL = '/podijeli/bpp/';
  const english = () => document.documentElement.lang === 'en' || /\/en(?:\/|$)/.test(location.pathname) || (window.GNK_LANG && window.GNK_LANG.get && window.GNK_LANG.get() === 'en');
  const copy = () => english() ? {
    overline:'SOFTWARE SOLUTION · BPP.IS', title:'Bitcoin Payment Processor',
    body:'Public presentation of a digital asset payment infrastructure solution developed for the GNK DINAMO Ltd. group framework.',
    tags:['Bitcoin','Real-time processing','Merchant dashboard','API integration'],
    note:'Bitcoin Payment Processor was developed by GNK ASG d.o.o. for the GNK DINAMO Ltd. group framework. GNK ASG d.o.o. does not operate the system and does not provide payment processor services through it.',
    open:'Open bpp.is', share:'Share BPP overview', copy:'Copy link', copied:'Link copied'
  } : {
    overline:'PROGRAMSKO RJEŠENJE · BPP.IS', title:'Bitcoin Payment Processor',
    body:'Javni prikaz infrastrukture plaćanja digitalnom imovinom razvijene za poslovni okvir GNK DINAMO Ltd. grupe.',
    tags:['Bitcoin','Obrada u stvarnom vremenu','Merchant dashboard','API integracija'],
    note:'Programsko rješenje Bitcoin Payment Processor razvio je GNK ASG d.o.o. za poslovni okvir GNK DINAMO Ltd. grupe. GNK ASG d.o.o. ne upravlja tim sustavom niti putem njega pruža uslugu payment procesora.',
    open:'Otvori bpp.is', share:'Podijeli BPP prikaz', copy:'Kopiraj poveznicu', copied:'Poveznica kopirana'
  };
  const absolute = path => new URL(path, location.origin).href;
  function host() {
    return document.querySelector('#digital-assets .container, #digitalna-imovina .container');
  }
  function render() {
    const root = host();
    if (!root) return false;
    let panel = document.getElementById('bppPublicCard');
    if (!panel) {
      panel = document.createElement('article');
      panel.className = 'bpp-public-card'; panel.id = 'bppPublicCard';
      root.appendChild(panel);
    }
    const t = copy();
    panel.innerHTML = '<div class="bpp-public-copy"><span class="bpp-public-icon" aria-hidden="true">₿</span><div><small>' + t.overline + '</small><h3>' + t.title + '</h3><p>' + t.body + '</p></div></div><div class="bpp-public-meta"><div class="bpp-public-tags">' + t.tags.map(tag => '<span>' + tag + '</span>').join('') + '</div><p class="bpp-public-legal">' + t.note + '</p><div class="bpp-public-actions"><a class="bpp-public-source" href="' + BPP_URL + '" target="_blank" rel="noopener">' + t.open + ' ↗</a><button class="bpp-share-btn" type="button">' + t.share + '</button><button class="bpp-copy-btn" type="button">' + t.copy + '</button></div></div>';
    panel.querySelector('.bpp-share-btn').onclick = async () => {
      const url = absolute(SHARE_URL);
      if (navigator.share) { try { await navigator.share({title:t.title, text:t.note, url}); return; } catch (_) {} }
      window.open('https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url), '_blank', 'noopener');
    };
    panel.querySelector('.bpp-copy-btn').onclick = async event => {
      const button = event.currentTarget;
      try { await navigator.clipboard.writeText(absolute(SHARE_URL)); button.textContent = t.copied; setTimeout(() => { button.textContent = t.copy; }, 1600); }
      catch (_) { window.prompt(t.copy, absolute(SHARE_URL)); }
    };
    return true;
  }
  function init() {
    let attempts = 0;
    const timer = setInterval(() => { if (render() || ++attempts > 80) clearInterval(timer); }, 100);
    window.addEventListener('gnk-language-change', render);
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
