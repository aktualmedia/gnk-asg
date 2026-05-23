(() => {
  'use strict';
  const grid = document.getElementById('newsGrid');
  const tabs = Array.from(document.querySelectorAll('#newsTabs button'));
  if (!grid) return;
  let articles = [];
  let activeFilter = 'all';
  const esc = (value) => String(value || '').replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const english = () => window.GNK_LANG && window.GNK_LANG.get() === 'en';
  function stamp(item) {
    const raw = item.published_at || item.date || '';
    const time = Date.parse(raw);
    return Number.isFinite(time) ? time : 0;
  }
  function fresh(item) {
    const days = item.group === 'mentions' ? 365 : 30;
    return stamp(item) > Date.now() - (days * 24 * 60 * 60 * 1000);
  }
  function renderCard(item) {
    const en = english();
    const type = item.group === 'mentions' ? ' is-mention' : item.category === 'technology' ? ' is-tech' : item.category === 'digital-assets' ? ' is-assets' : '';
    const label = item.group === 'mentions' ? (en ? 'GNK ASG IN THE MEDIA · AUTOMATED MONITOR' : 'GNK ASG U MEDIJIMA · AUTOMATSKI MONITOR') : (item.source || item.category || 'BUSINESS NEWS');
    const date = stamp(item) ? new Date(stamp(item)).toLocaleDateString(en ? 'en-GB' : 'hr-HR') : '';
    const summary = item.summary || (en ? 'Open the source for the full publication.' : 'Otvorite izvor za cjelovitu objavu.');
    const open = en ? 'OPEN SOURCE →' : 'OTVORI IZVOR →';
    return '<article class="news-card' + type + '"><span class="meta">' + esc(label) + (date ? ' · ' + esc(date) : '') + '</span><h3>' + esc(item.title) + '</h3><p>' + esc(summary) + '</p><a target="_blank" rel="noopener nofollow" href="' + esc(item.url) + '">' + open + '</a></article>';
  }
  function render(filter) {
    activeFilter = filter;
    const en = english();
    if (filter === 'fina') {
      grid.innerHTML = '<article class="news-card"><span class="meta">FINA / RGFI</span><h3>' + (en ? 'Official Public Information' : 'Službene javne informacije') + '</h3><p>' + (en ? 'FINA and RGFI sources are shown in the official public-information panel.' : 'FINA i RGFI izvori prikazuju se u službenom panelu javnih informacija.') + '</p><a target="_blank" rel="noopener nofollow" href="https://rgfi.fina.hr/JavnaObjava-web/">' + (en ? 'OPEN PUBLIC DISCLOSURE →' : 'OTVORI JAVNU OBJAVU →') + '</a></article>';
      return;
    }
    const selected = (filter === 'all' ? articles : articles.filter((item) => String(item.group || item.category || '').toLowerCase().includes(filter))).filter(fresh).sort((a,b) => stamp(b) - stamp(a));
    if (!selected.length) {
      const monitorText = filter === 'mentions' ? (en ? 'The corporate monitor searches public publications up to 365 days back and refreshes every hour.' : 'Korporativni monitor pretražuje javne objave do 365 dana unatrag i osvježava se svakog sata.') : (en ? 'Only news from the last 30 days are shown and new content is collected every hour.' : 'Prikazuju se samo vijesti iz posljednjih 30 dana, a novi sadržaj preuzima se svakog sata.');
      grid.innerHTML = '<article class="news-card"><span class="meta">' + (en ? 'AUTOMATED REFRESH' : 'AUTOMATSKO AŽURIRANJE') + '</span><h3>' + (en ? 'No current item in the selected section' : 'Nema aktualne stavke u odabranoj rubrici') + '</h3><p>' + monitorText + '</p></article>';
      return;
    }
    grid.innerHTML = selected.slice(0, 15).map(renderCard).join('');
  }
  async function load() {
    try {
      const response = await fetch('data/news.json?v=' + Date.now(), {cache:'no-store'});
      articles = response.ok ? await response.json() : [];
    } catch (error) { articles = []; }
    render(activeFilter);
  }
  tabs.forEach((button) => button.addEventListener('click', () => {
    tabs.forEach((entry) => entry.classList.remove('active'));
    button.classList.add('active');
    render(button.dataset.filter || 'all');
  }));
  window.addEventListener('gnk-language-change', () => render(activeFilter));
  load();
})();
