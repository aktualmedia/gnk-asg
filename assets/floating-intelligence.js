(() => {
  'use strict';
  let marketData = null;
  let verified = false;
  const lang = () => (window.GNK_LANG && window.GNK_LANG.get && window.GNK_LANG.get() === 'en') || /\/en\/?$/.test(location.pathname) ? 'en' : 'hr';
  const minutesOld = value => value ? Math.max(0, (Date.now() - new Date(value).getTime()) / 60000) : Infinity;
  const labels = {
    hr: {aria:'Otvori ASG Intelligence Desk', title:'ASG Intelligence Desk', subtitle:'BRZI PRISTUP', intro:'Postavite brzo pitanje, istražite temu ili otvorite puni Intelligence Desk.', send:'PITAJ', placeholder:'Pitajte o financijama, tržištima ili AI-u…', chips:['Prihodi 2025.','Tržište danas','Što je AI Desk?','Vijesti'], full:'Puni Desk', research:'Google News', empty:'Upišite pitanje.', source:'Informativni prikaz javnih podataka portala.', verified:'ASG · JAVNI PODATCI AŽURIRANI', checking:'ASG · PROVJERA AŽURIRANJA'},
    en: {aria:'Open ASG Intelligence Desk', title:'ASG Intelligence Desk', subtitle:'QUICK ACCESS', intro:'Ask a quick question, research a topic or open the full Intelligence Desk.', send:'ASK', placeholder:'Ask about financials, markets or AI…', chips:['2025 revenue','Markets today','What is AI Desk?','News'], full:'Full Desk', research:'Google News', empty:'Enter a question.', source:'Informational display based on public portal data.', verified:'ASG · PUBLIC DATA UPDATED', checking:'ASG · UPDATE VERIFICATION'}
  };
  const t = () => labels[lang()];
  async function read(path) {
    try { const response = await fetch(path + '?v=' + Date.now(), {cache:'no-store'}); return response.ok ? await response.json() : null; }
    catch (_) { return null; }
  }
  async function refreshVerifiedState() {
    const values = await Promise.all([
      read('/data/update_status.json'), read('/data/fast_market_status.json'), read('/data/open_data.json'),
      read('/data/macro_market.json'), read('/data/asg_gold_asset.json'), read('/data/stock_exchanges.json')
    ]);
    const news = values[0] && values[0].news;
    const liveMarket = values[1];
    const references = values.slice(2);
    verified = Boolean(news && minutesOld(news.updated_at) <= 95 && liveMarket && minutesOld(liveMarket.updated_at) <= 20 && references.every(data => data && minutesOld(data.updated_at) <= 95));
    paintStatus();
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
    if (badge) { badge.classList.toggle('is-verified', verified); badge.textContent = text; }
  }
  function money(value, unit) {
    if (value == null) return '—';
    return new Intl.NumberFormat(lang() === 'en' ? 'en-US' : 'hr-HR', {maximumFractionDigits: 2}).format(Number(value)) + ' ' + unit;
  }
  function answer(question) {
    const q = String(question || '').toLowerCase();
    const en = lang() === 'en';
    if (!q.trim()) return t().empty;
    if (/prihod|revenue|504/.test(q)) return en ? 'GNK ASG d.o.o. displays total revenue of EUR 504.00 million for FY 2025.' : 'GNK ASG d.o.o. za FY 2025 prikazuje ukupne prihode od 504,00 mil. EUR.';
    if (/aktiva|kapital|obvez|asset|equity|liabil/.test(q)) return en ? 'Displayed FY 2025 indicators: total assets EUR 46.40 million; capital and reserves EUR 46.21 million; current liabilities EUR 184.50 thousand; no long-term liabilities.' : 'Prikazani pokazatelji FY 2025: aktiva 46,40 mil. EUR; kapital i rezerve 46,21 mil. EUR; kratkoročne obveze 184,50 tis. EUR; bez dugoročnih obveza.';
    if (/btc|bitcoin|zlato|gold|naft|oil|trži|market/.test(q)) {
      if (marketData && marketData.assets) {
        const a = marketData.assets;
        return en ? 'Indicative market display: Bitcoin ' + money(a.btc.current, 'USD/BTC') + ', gold ' + money(a.gold.current, 'USD/oz') + ', Brent oil ' + money(a.oil.current, 'USD/barrel') + '.' : 'Indikativni tržišni prikaz: Bitcoin ' + money(a.btc.current, 'USD/BTC') + ', zlato ' + money(a.gold.current, 'USD/unca') + ', Brent nafta ' + money(a.oil.current, 'USD/barel') + '.';
      }
      return en ? 'Open Market Monitor for Bitcoin, gold, Brent oil and USD/EUR comparison.' : 'Otvorite Market Monitor za usporedbu Bitcoina, zlata, Brent nafte i USD/EUR.';
    }
    if (/vijest|news|media|medij/.test(q)) return en ? 'Public business and technology news refresh hourly. Publications about GNK ASG, GNK DINAMO Ltd. or Nermin Sefić appear in the media section only after manual approval.' : 'Javne poslovne i tehnološke vijesti osvježavaju se svakog sata. Objave o GNK ASG, GNK DINAMO Ltd. ili Nerminu Sefiću u medijskoj rubrici prikazuju se samo nakon ručnog odobrenja.';
    if (/ai|desk|intelligence|umjet|tehnolog|software/.test(q)) return en ? 'Intelligence Desk explains public corporate indicators, market panels and technology topics, and offers public topic research links.' : 'Intelligence Desk pojašnjava javne korporativne pokazatelje, tržišne panele i tehnološke teme te nudi istraživanje javnih tema.';
    return en ? 'Open the full Intelligence Desk to explore this topic through portal data and public research tools.' : 'Otvorite puni Intelligence Desk kako biste temu istražili kroz podatke portala i javne alate pretrage.';
  }
  function setResult(query) {
    const output = document.getElementById('aiMiniResult');
    if (!output) return;
    output.textContent = answer(query) + '\n\n' + t().source;
    output.classList.add('visible');
    const search = document.getElementById('aiResearchLink');
    if (search) search.href = 'https://news.google.com/search?q=' + encodeURIComponent(query);
  }
  function render() {
    const c = t();
    const button = document.getElementById('aiFab');
    const panel = document.getElementById('aiMini');
    if (!button || !panel) return;
    button.setAttribute('aria-label', c.aria);
    button.innerHTML = '<span class="ai-fab-mark">ASG</span><span class="ai-fab-label">ASG</span><span class="ai-fab-dot"></span>';
    panel.innerHTML = '<div class="ai-mini-head"><div><small>' + c.subtitle + '</small><strong>' + c.title + '</strong></div><button type="button" class="ai-mini-close" aria-label="Close">×</button></div><div class="ai-mini-status"></div><div class="ai-mini-body"><p class="ai-mini-intro">' + c.intro + '</p><div class="ai-mini-chips">' + c.chips.map(item => '<button type="button">' + item + '</button>').join('') + '</div><div class="ai-mini-result" id="aiMiniResult"></div><form class="ai-mini-form"><input autocomplete="off" placeholder="' + c.placeholder + '"><button type="submit">' + c.send + '</button></form><div class="ai-mini-links"><a class="ai-full-link" href="#assistant">' + c.full + '</a><a class="ai-research-link" id="aiResearchLink" target="_blank" rel="noopener nofollow" href="https://news.google.com/">' + c.research + '</a></div></div>';
    panel.querySelector('.ai-mini-close').onclick = close;
    panel.querySelector('.ai-full-link').onclick = close;
    panel.querySelectorAll('.ai-mini-chips button').forEach(chip => chip.onclick = () => setResult(chip.textContent));
    panel.querySelector('form').onsubmit = event => { event.preventDefault(); const input = panel.querySelector('input'); setResult(input.value); };
    paintStatus();
  }
  function open() { document.getElementById('aiMini')?.classList.add('open'); document.getElementById('aiBackdrop')?.classList.add('open'); setTimeout(() => document.querySelector('#aiMini input')?.focus(), 80); }
  function close() { document.getElementById('aiMini')?.classList.remove('open'); document.getElementById('aiBackdrop')?.classList.remove('open'); }
  async function init() {
    if (document.getElementById('aiFab')) return;
    const backdrop = document.createElement('div'); backdrop.className = 'ai-mini-backdrop'; backdrop.id = 'aiBackdrop'; backdrop.onclick = close;
    const button = document.createElement('button'); button.type = 'button'; button.className = 'ai-fab'; button.id = 'aiFab'; button.onclick = open;
    const panel = document.createElement('aside'); panel.className = 'ai-mini'; panel.id = 'aiMini';
    document.body.append(backdrop, button, panel);
    render();
    try { const response = await fetch('/data/macro_market.json?v=' + Date.now(), {cache:'no-store'}); if (response.ok) marketData = await response.json(); } catch (_) {}
    refreshVerifiedState();
    window.setInterval(refreshVerifiedState, 300000);
    window.addEventListener('gnk-language-change', render);
    document.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
