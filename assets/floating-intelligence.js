(() => {
  'use strict';

  let marketData = null;
  let storedStatus = null;
  let liveMarketState = null;
  let verified = false;

  const WHATSAPP = 'https://wa.me/385916104398';
  const CONTACT = '/kontakt/';
  const DESK = '#assistant';
  const NEWS = '#news';

  const lang = () => ((window.GNK_LANG && window.GNK_LANG.get && window.GNK_LANG.get() === 'en') || /\/en\/?$/.test(location.pathname)) ? 'en' : 'hr';
  const minutesOld = value => value ? Math.max(0, (Date.now() - new Date(value).getTime()) / 60000) : Infinity;

  const labels = {
    hr: {
      aria: 'Otvori AL asistenta GNK ASG',
      title: 'AL asistent',
      subtitle: 'PLUTAJUĆI POMOĆNIK',
      intro: 'Brzi pomoćnik za portal: financije, tržišta, vijesti, dokumente, kontakt i javne informacije. Za stvarnu poruku koristite WhatsApp ili kontakt stranicu.',
      send: 'PITAJ',
      placeholder: 'Upišite pitanje ili temu…',
      chips: ['Kontakt', 'Financije', 'Digitalna imovina', 'Vijesti BiH i Slovenija', 'Dokumenti', 'AI i tehnologija'],
      full: 'Puni AL',
      contact: 'Kontakt',
      whatsapp: 'WhatsApp',
      research: 'Google News',
      empty: 'Upišite pitanje ili odaberite jednu od brzih tema.',
      source: 'Informativni odgovor na temelju javnih podataka portala. Za službenu komunikaciju koristite kontakt kanal.',
      verified: 'AL · JAVNI PODATCI AŽURIRANI',
      checking: 'AL · PROVJERA AŽURIRANJA',
      action: 'Za slanje upita otvorite WhatsApp ili kontakt stranicu.'
    },
    en: {
      aria: 'Open GNK ASG AL assistant',
      title: 'AL Assistant',
      subtitle: 'FLOATING HELPER',
      intro: 'Quick portal helper for financials, markets, news, documents, contact and public information. Use WhatsApp or the contact page for an actual message.',
      send: 'ASK',
      placeholder: 'Enter a question or topic…',
      chips: ['Contact', 'Financials', 'Digital assets', 'BiH and Slovenia news', 'Documents', 'AI and technology'],
      full: 'Full AL',
      contact: 'Contact',
      whatsapp: 'WhatsApp',
      research: 'Google News',
      empty: 'Enter a question or select a quick topic.',
      source: 'Informational answer based on public portal data. Use the contact channel for official communication.',
      verified: 'AL · PUBLIC DATA UPDATED',
      checking: 'AL · UPDATE VERIFICATION',
      action: 'To send an inquiry, open WhatsApp or the contact page.'
    }
  };

  const t = () => labels[lang()];

  async function read(path) {
    try {
      const response = await fetch(path + '?v=' + Date.now(), { cache: 'no-store' });
      return response.ok ? await response.json() : null;
    } catch (_) {
      return null;
    }
  }

  function evaluate() {
    const news = storedStatus && storedStatus.news;
    const newsReady = Boolean(news && (news.status === 'ok' || news.status === 'degraded') && Number(news.public_items || 0) > 0 && minutesOld(news.checked_at || news.updated_at) <= 95);
    const publishedMarket = storedStatus && storedStatus.fast_market;
    const directMarketReady = Boolean(liveMarketState && liveMarketState.ok && minutesOld(liveMarketState.updated_at) <= 30);
    const fallbackMarketReady = Boolean(publishedMarket && minutesOld(publishedMarket.updated_at || publishedMarket.checked_at) <= 45 && publishedMarket.status !== 'failed');
    verified = newsReady && (directMarketReady || fallbackMarketReady);
    paintStatus();
  }

  async function refreshVerifiedState() {
    const values = await Promise.all([read('/data/update_status.json'), read('/data/fast_market_status.json')]);
    storedStatus = values[0] || {};
    storedStatus.fast_market = values[1] || null;
    evaluate();
  }

  function paintStatus() {
    const button = document.getElementById('aiFab');
    const badge = document.querySelector('#aiMini .ai-mini-status');
    const text = verified ? t().verified : t().checking;
    if (button) {
      button.classList.toggle('is-verified', verified);
      button.title = text;
      button.setAttribute('data-status', verified ? 'verified' : 'checking');
    }
    if (badge) {
      badge.classList.toggle('is-verified', verified);
      badge.textContent = text;
    }
  }

  function money(value, unit) {
    if (value == null) return '—';
    return new Intl.NumberFormat(lang() === 'en' ? 'en-US' : 'hr-HR', { maximumFractionDigits: 2 }).format(Number(value)) + ' ' + unit;
  }

  function setResearchLink(query) {
    const search = document.getElementById('aiResearchLink');
    if (search) search.href = 'https://news.google.com/search?q=' + encodeURIComponent(query || 'GNK ASG d.o.o.');
    const wa = document.getElementById('aiWhatsAppLink');
    if (wa) {
      const message = lang() === 'en'
        ? 'Hello, I am contacting GNK ASG d.o.o. regarding: ' + (query || 'business inquiry')
        : 'Pozdrav, kontaktiram GNK ASG d.o.o. u vezi teme: ' + (query || 'poslovni upit');
      wa.href = WHATSAPP + '?text=' + encodeURIComponent(message);
    }
  }

  function answer(question) {
    const q = String(question || '').toLowerCase();
    const en = lang() === 'en';
    if (!q.trim()) return t().empty;

    if (/kontakt|contact|whatsapp|telefon|phone|mail|email|poruk/.test(q)) {
      return en
        ? 'Use the contact page or WhatsApp for the fastest communication. The active WhatsApp number is +385 91 610 4398. Other regional and US contact numbers are listed on the contact page.'
        : 'Za najbržu komunikaciju otvorite kontakt stranicu ili WhatsApp. Aktivni WhatsApp broj je +385 91 610 4398. Ostali regionalni i američki brojevi nalaze se na kontakt stranici.';
    }
    if (/prihod|revenue|504|financ|bilanc|asset|kapital|obvez|equity|liabil/.test(q)) {
      return en
        ? 'The portal presents GNK ASG d.o.o. FY 2025 indicators, including EUR 504.00 million revenue, EUR 46.40 million assets, EUR 46.21 million capital and reserves, and no long-term liabilities.'
        : 'Portal prikazuje pokazatelje GNK ASG d.o.o. za FY 2025: 504,00 mil. EUR prihoda, 46,40 mil. EUR aktive, 46,21 mil. EUR kapitala i rezervi te bez dugoročnih obveza.';
    }
    if (/bih|bosn|sloven|slovenij|ljubljan|sarajev|vijest|news/.test(q)) {
      return en
        ? 'Business news for BiH and Slovenia is strengthened with additional public-source queries. The public news window keeps the newest 500 items and the active archive keeps up to 400 older items.'
        : 'Vijesti za BiH i Sloveniju pojačane su dodatnim javnim izvorima i upitima. Javni prozor zadržava najnovijih 500 stavki, a aktivna arhiva do 400 starijih stavki.';
    }
    if (/btc|bitcoin|kripto|crypto|zlato|gold|naft|oil|trži|market|digital/.test(q)) {
      if (marketData && marketData.assets) {
        const a = marketData.assets;
        return en
          ? 'Indicative market display: Bitcoin ' + money(a.btc && a.btc.current, 'USD/BTC') + ', gold ' + money(a.gold && a.gold.current, 'USD/oz') + ', Brent oil ' + money(a.oil && a.oil.current, 'USD/barrel') + '.'
          : 'Indikativni tržišni prikaz: Bitcoin ' + money(a.btc && a.btc.current, 'USD/BTC') + ', zlato ' + money(a.gold && a.gold.current, 'USD/unca') + ', Brent nafta ' + money(a.oil && a.oil.current, 'USD/barel') + '.';
      }
      return en ? 'Open the Market Monitor for digital assets and public market indicators.' : 'Otvorite Market Monitor za digitalnu imovinu i javne tržišne pokazatelje.';
    }
    if (/dokumen|document|registr|izvješ|izvjest|report|seo|meta/.test(q)) {
      return en
        ? 'Documents, registries, public data and SEO context are grouped on the portal so users and search engines can understand the public corporate profile.'
        : 'Dokumenti, registri, javni podatci i SEO kontekst grupirani su na portalu kako bi korisnici i tražilice razumjeli javni korporativni profil.';
    }
    if (/ai|al|desk|intelligence|umjet|tehnolog|software|portal/.test(q)) {
      return en
        ? 'AL Assistant is the portal helper for public information, technology, finance, market panels and contact routing. A later backend version can read and answer messages under defined authorization rules.'
        : 'AL asistent je pomoćnik portala za javne informacije, tehnologiju, financije, tržišne panele i usmjeravanje kontakta. Kasnija backend verzija može čitati i odgovarati na poruke prema definiranim ovlastima.';
    }
    return en
      ? 'I can route this topic to the portal sections, public research or contact channel. For an actual inquiry, use WhatsApp or the contact page.'
      : 'Ovu temu mogu usmjeriti prema sekcijama portala, javnoj pretrazi ili kontakt kanalu. Za stvarni upit koristite WhatsApp ili kontakt stranicu.';
  }

  function setResult(query) {
    const output = document.getElementById('aiMiniResult');
    if (!output) return;
    const text = answer(query);
    output.textContent = text + '\n\n' + t().source + '\n' + t().action;
    output.classList.add('visible');
    setResearchLink(query);
  }

  function render() {
    const c = t();
    const button = document.getElementById('aiFab');
    const panel = document.getElementById('aiMini');
    if (!button || !panel) return;
    button.setAttribute('aria-label', c.aria);
    button.innerHTML = '<span class="ai-fab-mark">AL</span><span class="ai-fab-label">AL</span><span class="ai-fab-dot"></span>';
    panel.innerHTML = '<div class="ai-mini-head"><div><small>' + c.subtitle + '</small><strong>' + c.title + '</strong></div><button type="button" class="ai-mini-close" aria-label="Close">×</button></div><div class="ai-mini-status"></div><div class="ai-mini-body"><p class="ai-mini-intro">' + c.intro + '</p><div class="ai-mini-chips">' + c.chips.map(item => '<button type="button">' + item + '</button>').join('') + '</div><div class="ai-mini-result" id="aiMiniResult"></div><form class="ai-mini-form"><input autocomplete="off" placeholder="' + c.placeholder + '"><button type="submit">' + c.send + '</button></form><div class="ai-mini-links"><a class="ai-full-link" href="' + DESK + '">' + c.full + '</a><a class="ai-research-link" id="aiWhatsAppLink" target="_blank" rel="noopener nofollow" href="' + WHATSAPP + '">' + c.whatsapp + '</a><a class="ai-research-link" href="' + CONTACT + '">' + c.contact + '</a><a class="ai-research-link" id="aiResearchLink" target="_blank" rel="noopener nofollow" href="https://news.google.com/">' + c.research + '</a></div></div>';
    panel.querySelector('.ai-mini-close').onclick = close;
    panel.querySelector('.ai-full-link').onclick = close;
    panel.querySelectorAll('.ai-mini-chips button').forEach(chip => chip.onclick = () => setResult(chip.textContent));
    panel.querySelector('form').onsubmit = event => {
      event.preventDefault();
      const input = panel.querySelector('input');
      setResult(input.value);
    };
    setResearchLink('GNK ASG d.o.o. GNK DINAMO Ltd.');
    paintStatus();
  }

  function open() {
    document.getElementById('aiMini')?.classList.add('open');
    document.getElementById('aiBackdrop')?.classList.add('open');
    setTimeout(() => document.querySelector('#aiMini input')?.focus(), 80);
  }

  function close() {
    document.getElementById('aiMini')?.classList.remove('open');
    document.getElementById('aiBackdrop')?.classList.remove('open');
  }

  async function init() {
    if (document.getElementById('aiFab')) return;
    const backdrop = document.createElement('div');
    backdrop.className = 'ai-mini-backdrop';
    backdrop.id = 'aiBackdrop';
    backdrop.onclick = close;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'ai-fab';
    button.id = 'aiFab';
    button.onclick = open;
    const panel = document.createElement('aside');
    panel.className = 'ai-mini';
    panel.id = 'aiMini';
    document.body.append(backdrop, button, panel);
    render();
    window.addEventListener('gnk-live-market-refresh', event => { liveMarketState = event.detail || null; evaluate(); });
    try {
      const response = await fetch('/data/macro_market.json?v=' + Date.now(), { cache: 'no-store' });
      if (response.ok) marketData = await response.json();
    } catch (_) {}
    refreshVerifiedState();
    window.setInterval(refreshVerifiedState, 300000);
    window.addEventListener('gnk-language-change', render);
    document.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
