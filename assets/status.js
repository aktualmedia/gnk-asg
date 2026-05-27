(() => {
  let newsData = null;
  let marketData = null;
  let referenceData = [];
  const english = () => document.documentElement.lang === 'en' || (window.GNK_LANG && window.GNK_LANG.get && window.GNK_LANG.get() === 'en');
  const minutesOld = value => value ? Math.max(0, (Date.now() - new Date(value).getTime()) / 60000) : Infinity;
  const dateLabel = value => value ? new Date(value).toLocaleString(english() ? 'en-GB' : 'hr-HR') : (english() ? 'not available' : 'nije dostupno');

  function installStyle() {
    if (document.getElementById('gnk-live-status-style')) return;
    const style = document.createElement('style');
    style.id = 'gnk-live-status-style';
    style.textContent = [
      '.live-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:17px}',
      '.live-badge{display:inline-flex;align-items:center;gap:7px;min-height:27px;padding:0 10px;border:1px solid #e1e7ef;border-radius:999px;background:rgba(255,255,255,.82);color:#64768b;font:750 .62rem/1 Arial,sans-serif;letter-spacing:.045em}',
      '.live-badge:before{content:"";display:inline-block;width:6px;height:6px;border-radius:50%;background:#b9c4d1}',
      '.live-badge.ok{border-color:#d8ebdf;color:#3c6753;background:#f7fbf8}',
      '.live-badge.ok:before{background:#26a269}',
      '.live-badge.warning{border-color:#efe2bd;color:#725d28;background:#fffdf8}',
      '.live-badge.warning:before{background:#d0a12e}',
      '.automation-status{font-weight:850;text-transform:uppercase;letter-spacing:.095em}',
      '@media(max-width:680px){.live-row{gap:6px;margin-top:13px}.live-badge{font-size:.57rem;min-height:25px;padding:0 8px}}'
    ].join('');
    document.head.appendChild(style);
  }

  function setBadge(id, text, state) {
    const node = document.getElementById(id);
    if (!node) return;
    node.textContent = text;
    node.classList.remove('waiting', 'ok', 'warning');
    node.classList.add(state);
  }

  function render() {
    const en = english();
    const news = newsData && newsData.news;
    if (news && news.public_items != null) {
      const newsText = en ? 'Business News: ' + news.public_items + ' items · Updated: ' + dateLabel(news.updated_at) : 'Poslovne vijesti: ' + news.public_items + ' stavki · Ažurirano: ' + dateLabel(news.updated_at);
      setBadge('newsBadge', newsText, minutesOld(news.updated_at) <= 95 ? 'ok' : 'warning');
    }
    if (marketData && marketData.digital_assets) {
      const markets = marketData.digital_assets.coins || 0;
      const marketText = en ? 'Digital Assets: ' + markets + ' assets · Updated: ' + dateLabel(marketData.updated_at) : 'Digitalna imovina: ' + markets + ' stavki · Ažurirano: ' + dateLabel(marketData.updated_at);
      setBadge('marketBadge', marketText, minutesOld(marketData.updated_at) <= 20 ? 'ok' : 'warning');
    }
    const newsFresh = Boolean(news && minutesOld(news.updated_at) <= 95);
    const marketFresh = Boolean(marketData && minutesOld(marketData.updated_at) <= 20);
    const referenceFresh = referenceData.length === 4 && referenceData.every(data => data && minutesOld(data.updated_at) <= 95);
    if (newsFresh && marketFresh && referenceFresh) {
      setBadge('automationBadge', en ? 'Automated updates active' : 'Automatsko ažuriranje aktivno', 'ok');
    } else if (newsFresh && marketFresh) {
      setBadge('automationBadge', en ? 'Reference update pending' : 'Referentno ažuriranje u tijeku', 'warning');
    } else {
      setBadge('automationBadge', en ? 'Update verification' : 'Provjera ažuriranja', 'waiting');
    }
  }

  async function read(path) {
    try {
      const response = await fetch(path + '?v=' + Date.now(), { cache: 'no-store' });
      return response.ok ? await response.json() : null;
    } catch (error) { return null; }
  }

  async function refresh() {
    const results = await Promise.all([
      read('/data/update_status.json'),
      read('/data/fast_market_status.json'),
      read('/data/open_data.json'),
      read('/data/macro_market.json'),
      read('/data/asg_gold_asset.json'),
      read('/data/stock_exchanges.json')
    ]);
    newsData = results[0];
    marketData = results[1];
    referenceData = results.slice(2);
    render();
  }

  async function init() {
    const hero = document.querySelector('.hero-actions');
    if (!hero || document.getElementById('automationBadge')) return;
    installStyle();
    const row = document.createElement('div');
    row.className = 'live-row';
    row.innerHTML = '<span class="live-badge waiting" id="newsBadge">Poslovne vijesti: provjera</span><span class="live-badge waiting" id="marketBadge">Digitalna imovina: provjera</span><span class="live-badge waiting automation-status" id="automationBadge">Provjera ažuriranja</span>';
    hero.insertAdjacentElement('afterend', row);
    await refresh();
    window.addEventListener('gnk-language-change', render);
    window.setInterval(refresh, 300000);
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
