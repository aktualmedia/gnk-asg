(() => {
  'use strict';
  const en = () => /\/en\/?$/.test(location.pathname) || (window.GNK_LANG && window.GNK_LANG.get && window.GNK_LANG.get() === 'en');
  const currency = () => document.getElementById('currency')?.value || 'eur';
  const gridNode = () => document.getElementById('coinGrid') || document.getElementById('marketGrid');

  function money(value, code) {
    const number = Number(value || 0);
    const digits = code === 'jpy' ? 0 : number < 1 ? 5 : 2;
    return new Intl.NumberFormat(en() ? 'en-GB' : 'hr-HR', {style:'currency', currency:code.toUpperCase(), maximumFractionDigits:digits}).format(number);
  }

  function formatDate(value) { return new Date(value).toLocaleString(en() ? 'en-GB' : 'hr-HR'); }

  async function pulse() {
    const grid = gridNode();
    if (!grid) return;
    const checkedAt = new Date().toISOString();
    try {
      const response = await fetch('/data/market.json?v=' + Date.now(), {cache:'no-store'});
      if (!response.ok) return;
      const data = await response.json();
      const unit = currency();
      if (!Array.isArray(data.coins) || !data.coins.length) return;
      grid.innerHTML = data.coins.map(item => {
        const prices = item.prices || {};
        const changes = item.changes_24h || {};
        const change = Number(changes[unit] || 0);
        return `<article class="coin"><div class="coin-top"><strong>${item.symbol || ''}</strong><small>${item.id || ''}</small></div><div class="price">${money(prices[unit], unit)}</div><div class="change ${change >= 0 ? 'positive' : 'negative'}">${change >= 0 ? '+' : ''}${change.toFixed(2)}% / 24 h</div></article>`;
      }).join('');
      const stamp = document.getElementById('marketUpdated') || document.getElementById('marketStatus');
      if (stamp) stamp.textContent = (en() ? 'Digital Assets: ' : 'Digitalna imovina: ') + data.coins.length + (en() ? ' assets · SNAPSHOT · Browser checked: ' : ' stavki · SNAPSHOT · Provjereno preglednikom: ') + formatDate(checkedAt) + (data.updated_at ? (en() ? ' · published data: ' : ' · objavljeni podaci: ') + formatDate(data.updated_at) : '');
      window.dispatchEvent(new CustomEvent('gnk-market-grid-refreshed', {detail:{updated_at:checkedAt, published_at:data.updated_at, currency:unit}}));
    } catch (error) {}
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', () => { pulse(); setInterval(pulse, 60000); }) : (pulse(), setInterval(pulse, 60000));
})();
