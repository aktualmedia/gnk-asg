(() => {
  const $ = (s) => document.querySelector(s);
  const english = () => window.GNK_LANG && window.GNK_LANG.get() === 'en';
  let dataset = { coins: [] };
  let currency = 'eur';
  function money(value, code) {
    const number = Number(value || 0);
    const digits = code === 'jpy' ? 0 : (number < 1 ? 5 : 2);
    return new Intl.NumberFormat(english() ? 'en-GB' : 'hr-HR', { style:'currency', currency: code.toUpperCase(), maximumFractionDigits: digits }).format(number);
  }
  function coin(id) { return (dataset.coins || []).find((item) => item.id === id); }
  function convert() {
    const output = $('#convertResult');
    const selected = coin($('#convertCoin')?.value);
    if (!output || !selected) return;
    const amount = Number($('#convertAmount')?.value || 0);
    output.textContent = money(amount * Number(selected.prices[currency] || 0), currency);
  }
  function render() {
    const en = english();
    const grid = $('#coinGrid');
    if (!grid) return;
    if (!dataset.coins || !dataset.coins.length) {
      grid.innerHTML = '<article class="coin"><strong>' + (en ? 'Market data activate after the first automated refresh.' : 'Tržišni podatci aktiviraju se nakon prvog automatskog ažuriranja.') + '</strong><p>' + (en ? 'The five-minute market workflow prepares indicative digital-asset prices.' : 'Petominutni tržišni workflow priprema indikativne cijene digitalne imovine.') + '</p></article>';
      return;
    }
    grid.innerHTML = dataset.coins.map((item) => {
      const price = item.prices[currency];
      const change = Number(item.changes_24h[currency] || 0);
      return `<article class="coin"><div class="coin-top"><strong>${item.symbol}</strong><small>${item.id}</small></div><div class="price">${money(price, currency)}</div><div class="change ${change >= 0 ? 'positive' : 'negative'}">${change >= 0 ? '+' : ''}${change.toFixed(2)}% / 24 h</div></article>`;
    }).join('');
    const updated = $('#marketUpdated');
    if (updated && dataset.updated_at) updated.textContent = (en ? 'Updated: ' : 'Ažurirano: ') + new Date(dataset.updated_at).toLocaleString(en ? 'en-GB' : 'hr-HR') + (en ? ' · five-minute market cycle' : ' · petominutni tržišni ciklus');
    const ticker = $('#ticker');
    if (ticker) {
      const tape = dataset.coins.slice(0, 5).map((item) => {
        const change = Number(item.changes_24h[currency] || 0);
        return `<span><b>${item.symbol}</b> ${money(item.prices[currency], currency)} ${change >= 0 ? '+' : ''}${change.toFixed(2)}%</span>`;
      }).join('');
      ticker.innerHTML = tape + '<span><b>GNK ASG</b> DIGITAL ASSETS MONITOR · ' + (en ? '5-MINUTE INFORMATIONAL DISPLAY' : 'PETOMINUTNI INFORMATIVNI PRIKAZ') + '</span>' + tape;
    }
    convert();
  }
  async function refresh() {
    try {
      const response = await fetch('data/market.json?v=' + Date.now(), { cache:'no-store' });
      dataset = response.ok ? await response.json() : dataset;
    } catch (error) {}
    render();
  }
  function init() {
    const select = $('#currency');
    select?.addEventListener('change', (e) => { currency = e.target.value; render(); });
    $('#convertAmount')?.addEventListener('input', convert);
    $('#convertCoin')?.addEventListener('change', convert);
    window.addEventListener('gnk-language-change', render);
    refresh();
    window.setInterval(refresh, 300000);
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
