(() => {
  'use strict';
  if (window.GNK_BPP_CARD_READY) return;
  window.GNK_BPP_CARD_READY = true;
  const BPP_URL = 'https://bpp.is/';
  const SHARE_URL = '/podijeli/bpp/';
  const english = () => document.documentElement.lang === 'en' || /\/en(?:\/|$)/.test(location.pathname) || (window.GNK_LANG && window.GNK_LANG.get && window.GNK_LANG.get() === 'en');
  const copy = () => english() ? {
    overline:'SOFTWARE SOLUTION · BPP.IS', title:'Bitcoin Payment Processor',
    heading:'Advanced Crypto Payment Infrastructure',
    body:'Accept crypto payments easily and securely with comprehensive API integration.',
    features:[['Multiple Cryptocurrency Support','Expandable digital-asset acceptance infrastructure.'],['Real-time Payment Notifications','Immediate transaction status information.'],['Automated Payment Forwarding','Configurable forwarding through platform settings.'],['Comprehensive Merchant Dashboard','Payment tracking and operational overview.']],
    flow:['Create account','Complete verification','Integrate API','Accept payments'],
    note:'Bitcoin Payment Processor was developed by GNK ASG d.o.o. for the GNK DINAMO Ltd. group framework. GNK ASG d.o.o. does not operate the system and does not provide payment processor services through it.',
    open:'Open bpp.is', share:'Share BPP overview', link:'Copy link', copied:'Link copied', source:'Public product information sourced from bpp.is'
  } : {
    overline:'PROGRAMSKO RJEŠENJE · BPP.IS', title:'Bitcoin Payment Processor',
    heading:'Napredna infrastruktura kripto plaćanja',
    body:'Jednostavno i sigurno prihvaćanje kripto plaćanja putem sveobuhvatne API integracije.',
    features:[['Podrška za više kriptovaluta','Proširiva infrastruktura prihvata digitalne imovine.'],['Obavijesti u stvarnom vremenu','Trenutačna informacija o statusu transakcije.'],['Automatizirano prosljeđivanje','Prilagodiva pravila prosljeđivanja kroz sustav.'],['Merchant dashboard','Praćenje plaćanja i operativni pregled.']],
    flow:['Izrada računa','Dovršetak verifikacije','API integracija','Prihvat plaćanja'],
    note:'Programsko rješenje Bitcoin Payment Processor razvio je GNK ASG d.o.o. za poslovni okvir GNK DINAMO Ltd. grupe. GNK ASG d.o.o. ne upravlja tim sustavom niti putem njega pruža uslugu payment procesora.',
    open:'Otvori bpp.is', share:'Podijeli BPP prikaz', link:'Kopiraj poveznicu', copied:'Poveznica kopirana', source:'Javne informacije o proizvodu preuzete s bpp.is'
  };
  const absolute = path => new URL(path, location.origin).href;
  function host() { return document.querySelector('#digital-assets .container, #digitalna-imovina .container'); }
  function render() {
    const root = host();
    if (!root) return false;
    let panel = document.getElementById('bppPublicCard');
    if (!panel) { panel = document.createElement('article'); panel.className = 'bpp-public-card'; panel.id = 'bppPublicCard'; root.appendChild(panel); }
    const t = copy();
    panel.innerHTML = '<div class="bpp-public-lead"><div class="bpp-public-copy"><span class="bpp-public-icon" aria-hidden="true">₿</span><div><small>' + t.overline + '</small><h3>' + t.title + '</h3><h4>' + t.heading + '</h4><p>' + t.body + '</p></div></div><ol class="bpp-flow" aria-label="BPP integration steps">' + t.flow.map((item, index) => '<li><b>0' + (index + 1) + '</b><span>' + item + '</span></li>').join('') + '</ol></div><div class="bpp-public-meta"><div class="bpp-feature-cards">' + t.features.map(item => '<section><strong>' + item[0] + '</strong><p>' + item[1] + '</p></section>').join('') + '</div><p class="bpp-public-legal">' + t.note + '</p><small class="bpp-source-note">' + t.source + '</small><div class="bpp-public-actions"><a class="bpp-public-source" href="' + BPP_URL + '" target="_blank" rel="noopener">' + t.open + ' ↗</a><button class="bpp-share-btn" type="button">' + t.share + '</button><button class="bpp-copy-btn" type="button">' + t.link + '</button></div></div>';
    panel.querySelector('.bpp-share-btn').onclick = async () => {
      const url = absolute(SHARE_URL);
      if (navigator.share) { try { await navigator.share({ title:t.title, text:t.note, url }); return; } catch (_) {} }
      window.open('https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url), '_blank', 'noopener');
    };
    panel.querySelector('.bpp-copy-btn').onclick = async event => {
      const button = event.currentTarget;
      try { await navigator.clipboard.writeText(absolute(SHARE_URL)); button.textContent = t.copied; setTimeout(() => { button.textContent = t.link; }, 1600); }
      catch (_) { window.prompt(t.link, absolute(SHARE_URL)); }
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
