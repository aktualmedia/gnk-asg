(() => {
  'use strict';
  const grid = document.getElementById('newsGrid');
  const tabs = Array.from(document.querySelectorAll('#newsTabs button'));
  if (!grid) return;
  let articles = [];
  const esc = (value) => String(value || '').replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  function stamp(item) {
    const raw = item.published_at || item.date || '';
    const time = Date.parse(raw);
    return Number.isFinite(time) ? time : 0;
  }
  function fresh(item) {
    const value = stamp(item);
    return value > Date.now() - (30 * 24 * 60 * 60 * 1000);
  }
  function renderCard(item) {
    const type = item.group === 'mentions' ? ' is-mention' : item.category === 'technology' ? ' is-tech' : item.category === 'digital-assets' ? ' is-assets' : '';
    const label = item.group === 'mentions' ? 'GNK ASG U MEDIJIMA · AUTOMATSKI MONITOR' : (item.source || item.category || 'BUSINESS NEWS');
    const date = stamp(item) ? new Date(stamp(item)).toLocaleDateString('hr-HR') : '';
    return '<article class="news-card' + type + '"><span class="meta">' + esc(label) + (date ? ' · ' + esc(date) : '') + '</span><h3>' + esc(item.title) + '</h3><p>' + esc(item.summary || 'Otvorite izvor za cjelovitu objavu.') + '</p><a target="_blank" rel="noopener nofollow" href="' + esc(item.url) + '">OTVORI IZVOR →</a></article>';
  }
  function render(filter) {
    if (filter === 'fina') {
      grid.innerHTML = '<article class="news-card"><span class="meta">FINA / RGFI</span><h3>Službene javne informacije</h3><p>FINA i RGFI izvori prikazuju se u službenom panelu desno od poslovnih vijesti.</p><a target="_blank" rel="noopener nofollow" href="https://rgfi.fina.hr/JavnaObjava-web/">OTVORI JAVNU OBJAVU →</a></article>';
      return;
    }
    const selected = (filter === 'all' ? articles : articles.filter((item) => String(item.group || item.category || '').toLowerCase().includes(filter))).filter(fresh).sort((a,b) => stamp(b) - stamp(a));
    if (!selected.length) {
      grid.innerHTML = '<article class="news-card"><span class="meta">AUTOMATSKO AŽURIRANJE</span><h3>Čeka se aktualni sadržaj odabrane rubrike</h3><p>Prikazuju se samo vijesti iz posljednjih 30 dana, a novi sadržaj preuzima se svakog sata.</p></article>';
      return;
    }
    grid.innerHTML = selected.slice(0, 15).map(renderCard).join('');
  }
  async function load() {
    try {
      const response = await fetch('data/news.json?v=' + Date.now(), {cache:'no-store'});
      articles = response.ok ? await response.json() : [];
    } catch (error) { articles = []; }
    render('all');
  }
  tabs.forEach((button) => button.addEventListener('click', () => {
    tabs.forEach((entry) => entry.classList.remove('active'));
    button.classList.add('active');
    render(button.dataset.filter || 'all');
  }));
  load();
})();
