(() => {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const english = () => window.GNK_LANG && window.GNK_LANG.get && window.GNK_LANG.get() === 'en';
  const COINS = {bitcoin:'BTC',ethereum:'ETH',solana:'SOL',ripple:'XRP',binancecoin:'BNB',cardano:'ADA',chainlink:'LINK','avalanche-2':'AVAX',tether:'USDT','usd-coin':'USDC',dai:'DAI','euro-coin':'EURC'};
  const FIATS = ['eur','usd','gbp','chf','jpy'];
  let dataset = {coins: []};
  let currency = 'eur';
  let live = false;

  const gridNode = () => $('#coinGrid') || $('#marketGrid');
  const statusNode = () => $('#marketStatus') || $('#marketUpdated');

  function money(value, code) {
    const number = Number(value || 0);
    const digits = code === 'jpy' ? 0 : (number < 1 ? 5 : 2);
    return new Intl.NumberFormat(english() ? 'en-GB' : 'hr-HR', {style:'currency', currency:code.toUpperCase(), maximumFractionDigits:digits}).format(number);
  }

  function coin(id) {
    return (dataset.coins || []).find((item) => item.id === id);
  }

  function sourceLabel() {
    if (live) return english() ? 'LIVE' : 'LIVE';
    if (dataset && dataset.status === 'ok') return english() ? 'SNAPSHOT' : 'SNAPSHOT';
    return english() ? 'FALLBACK' : 'FALLBACK';
  }

  function dateLabel(value) {
    if (!value) return english() ? 'not available' : 'nije dostupno';
    return new Date(value).toLocaleString(english() ? 'en-GB' : 'hr-HR');
  }

  function ensureControls() {
    const grid = gridNode();
    if (!grid) return;
    if (!$('#currency')) {
      const toolbar = document.createElement('div');
      toolbar.className = 'market-toolbar';
      toolbar.innerHTML = '<label>' + (english() ? 'Display currency ' : 'Prikaz valute ') + '<select id="currency"><option value="eur">EUR</option><option value="usd">USD</option><option value="gbp">GBP</option><option value="chf">CHF</option><option value="jpy">JPY</option></select></label><span id="marketUpdated" class="ticker-note"></span>';
      grid.insertAdjacentElement('beforebegin', toolbar);
    }
    const selector = $('#currency');
    if (selector && !selector.dataset.gnkMarketBound) {
      selector.dataset.gnkMarketBound = '1';
      selector.value = currency;
      selector.addEventListener('change', (event) => { currency = event.target.value || 'eur'; render(); });
    }
  }

  function notify() {
    window.dispatchEvent(new CustomEvent('gnk-live-market-refresh', {detail:{ok: live || (dataset && dataset.status === 'ok'), updated_at: dataset.updated_at || null}}));
  }

  function convert() {
    const output = $('#convertResult');
    const selected = coin($('#convertCoin')?.value);
    if (!output || !selected) return;
    output.textContent = money(Number($('#convertAmount')?.value || 0) * Number((selected.prices || {})[currency] || 0), currency);
  }

  function render() {
    ensureControls();
    const en = english();
    const grid = gridNode();
    if (!grid) return;
    const coins = Array.isArray(dataset.coins) ? dataset.coins : [];
    if (!coins.length) {
      grid.innerHTML = '<article class="coin"><strong>' + (en ? 'Market snapshot is temporarily unavailable.' : 'Tržišni snapshot privremeno nije dostupan.') + '</strong><p>' + (en ? 'The module will retry automatically.' : 'Modul će automatski ponoviti provjeru.') + '</p></article>';
      const status = statusNode();
      if (status) status.textContent = en ? 'Digital Assets: fallback · data delayed' : 'Digitalna imovina: fallback · podaci kasne';
      notify();
      return;
    }
    grid.innerHTML = coins.map((item) => {
      const prices = item.prices || {};
      const changes = item.changes_24h || {};
      const change = Number(changes[currency] || 0);
      return `<article class="coin"><div class="coin-top"><strong>${item.symbol || ''}</strong><small>${item.id || ''}</small></div><div class="price">${money(prices[currency], currency)}</div><div class="change ${change >= 0 ? 'positive' : 'negative'}">${change >= 0 ? '+' : ''}${change.toFixed(2)}% / 24 h</div></article>`;
    }).join('');

    const updated = $('#marketUpdated') || $('#marketStatus');
    if (updated) updated.textContent = (en ? 'Digital Assets: ' : 'Digitalna imovina: ') + coins.length + (en ? ' assets · ' : ' stavki · ') + sourceLabel() + (dataset.updated_at ? (en ? ' · Updated: ' : ' · Ažurirano: ') + dateLabel(dataset.updated_at) : '');

    const ticker = $('#ticker');
    if (ticker) {
      const tape = coins.slice(0, 5).map((item) => {
        const prices = item.prices || {};
        const changes = item.changes_24h || {};
        const change = Number(changes[currency] || 0);
        return `<span><b>${item.symbol || ''}</b> ${money(prices[currency], currency)} ${change >= 0 ? '+' : ''}${change.toFixed(2)}%</span>`;
      }).join('');
      ticker.innerHTML = tape + '<span><b>GNK ASG</b> DIGITAL ASSETS MONITOR · ' + sourceLabel() + '</span>' + tape;
    }
    convert();
    notify();
  }

  async function stored() {
    try {
      const response = await fetch('/data/market.json?v=' + Date.now(), {cache:'no-store'});
      if (response.ok) dataset = await response.json();
    } catch (_) {}
  }

  async function directLive() {
    const controller = 'AbortController' in window ? new AbortController() : null;
    const timer = controller ? window.setTimeout(() => controller.abort(), 3500) : null;
    try {
      const params = new URLSearchParams({ids:Object.keys(COINS).join(','), vs_currencies:FIATS.join(','), include_24hr_change:'true', include_last_updated_at:'true'});
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?' + params.toString(), {cache:'no-store', signal: controller ? controller.signal : undefined});
      if (!response.ok) throw new Error('source unavailable');
      const raw = await response.json();
      const coins = Object.entries(COINS).filter(([id]) => raw[id]).map(([id, symbol]) => ({id, symbol, prices:Object.fromEntries(FIATS.map((c) => [c, raw[id][c]])), changes_24h:Object.fromEntries(FIATS.map((c) => [c, raw[id][c + '_24h_change']]))}));
      if (!coins.length) throw new Error('empty feed');
      dataset = {updated_at:new Date().toISOString(), source:'CoinGecko public market data', status:'ok', coins};
      live = true;
    } catch (_) {
      live = false;
    } finally {
      if (timer) window.clearTimeout(timer);
    }
  }

  async function refresh() {
    await stored();
    render();
    directLive().then(() => render());
  }

  function init() {
    ensureControls();
    $('#convertAmount')?.addEventListener('input', convert);
    $('#convertCoin')?.addEventListener('change', convert);
    window.addEventListener('gnk-language-change', render);
    refresh();
    window.setInterval(refresh, 300000);
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
