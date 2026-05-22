(() => {
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
      const status = await response.json();
      const date = status.updated_at ? new Date(status.updated_at).toLocaleString('hr-HR') : 'nije dostupno';
      const news = document.getElementById('newsBadge');
      const market = document.getElementById('marketBadge');
      if (status.news && status.news.public_items != null) {
        news.classList.remove('waiting'); news.textContent = 'Business News: ' + status.news.public_items + ' stavki · ' + date;
      }
      if (status.market && status.market.coins != null) {
        market.classList.remove('waiting'); market.textContent = 'Digital Assets: ' + status.market.coins + ' tržišta · ' + date;
      }
    } catch (error) {}
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
