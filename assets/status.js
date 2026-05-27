(() => {
  let newsData = null;
  let marketData = null;
  let referenceData = null;
  const english = () => document.documentElement.lang === 'en' || (window.GNK_LANG && window.GNK_LANG.get && window.GNK_LANG.get() === 'en');
  const minutesOld = value => value ? Math.max(0, (Date.now() - new Date(value).getTime()) / 60000) : Infinity;
  const dateLabel = value => value ? new Date(value).toLocaleString(english() ? 'en-GB' : 'hr-HR') : (english() ? 'not available' : 'nije dostupno');

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
      setBadge('newsBadge', 'Business News: ' + news.public_items + (en ? ' items · ' : ' stavki · ') + dateLabel(news.updated_at), minutesOld(news.updated_at) <= 95 ? 'ok' : 'warning');
    }
    if (marketData && marketData.digital_assets) {
      const markets = marketData.digital_assets.coins || 0;
      setBadge('marketBadge', 'Digital Assets: ' + markets + (en ? ' assets · ' : ' stavki · ') + dateLabel(marketData.updated_at), minutesOld(marketData.updated_at) <= 20 ? 'ok' : 'warning');
    }
    const newsFresh = news && minutesOld(news.updated_at) <= 95;
    const marketFresh = marketData && minutesOld(marketData.updated_at) <= 20;
    const referenceFresh = referenceData && minutesOld(referenceData.updated_at) <= 95;
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

  async function init() {
    const hero = document.querySelector('.hero-actions');
    if (!hero) return;
    const row = document.createElement('div');
    row.className = 'live-row';
    row.innerHTML = '<span class="live-badge waiting" id="newsBadge">Business News: provjera</span><span class="live-badge waiting" id="marketBadge">Digital Assets: provjera</span><span class="live-badge waiting automation-status" id="automationBadge">Provjera ažuriranja</span>';
    hero.insertAdjacentElement('afterend', row);
    [newsData, marketData, referenceData] = await Promise.all([
      read('/data/update_status.json'),
      read('/data/fast_market_status.json'),
      read('/data/open_data.json')
    ]);
    render();
    window.addEventListener('gnk-language-change', render);
    window.setInterval(async () => {
      [newsData, marketData, referenceData] = await Promise.all([
        read('/data/update_status.json'),
        read('/data/fast_market_status.json'),
        read('/data/open_data.json')
      ]);
      render();
    }, 300000);
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();