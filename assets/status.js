(() => {
  let statusData = null;
  const english = () => window.GNK_LANG && window.GNK_LANG.get() === 'en';
  function render() {
    if (!statusData) return;
    const en = english();
    const locale = en ? 'en-GB' : 'hr-HR';
    const date = statusData.updated_at ? new Date(statusData.updated_at).toLocaleString(locale) : (en ? 'not available' : 'nije dostupno');
    const news = document.getElementById('newsBadge');
    const market = document.getElementById('marketBadge');
    if (news && statusData.news && statusData.news.public_items != null) {
      news.classList.remove('waiting');
      news.textContent = 'Business News: ' + statusData.news.public_items + (en ? ' items · ' : ' stavki · ') + date;
    }
    if (market && statusData.market && statusData.market.coins != null) {
      market.classList.remove('waiting');
      market.textContent = 'Digital Assets: ' + statusData.market.coins + (en ? ' markets · ' : ' tržišta · ') + date;
    }
  }
  async function init() {
    const hero = document.querySelector('.hero-actions');
    if (!hero) return;
    const row = document.createElement('div');
    row.className = 'live-row';
    row.innerHTML = '<span class="live-badge waiting" id="newsBadge">Business News: provjera</span><span class="live-badge waiting" id="marketBadge">Digital Assets: provjera</span>';
    hero.insertAdjacentElement('afterend', row);
    try {
      const response = await fetch('data/update_status.json?v=' + Date.now(), { cache:'no-store' });
      if (!response.ok) return;
      statusData = await response.json();
      render();
    } catch (error) {}
    window.addEventListener('gnk-language-change', render);
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
