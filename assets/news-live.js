(() => {
  'use strict';
  const grid = document.getElementById('newsGrid');
  const tabsHost = document.getElementById('newsTabs');
  if (!grid) return;
  let tabs = Array.from(document.querySelectorAll('#newsTabs button'));
  let articles = [];
  let approvedMedia = [];
  let activeFilter = 'all';
  const esc = (value) => String(value || '').replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const english = () => window.GNK_LANG && window.GNK_LANG.get() === 'en';
  function ensureTopicControls() {
    if (!tabsHost || tabsHost.dataset.topicsReady) return;
    const mention = tabsHost.querySelector('[data-filter="mentions"]');
    const entries = [
      { filter:'economy', hr:'Ekonomija', en:'Economy' },
      { filter:'sport', hr:'Sport', en:'Sport' },
      { filter:'mobilnost', hr:'Mobilnost', en:'Mobility' }
    ];
    entries.forEach((entry) => {
      if (tabsHost.querySelector('[data-filter="' + entry.filter + '"]')) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.filter = entry.filter;
      button.dataset.hr = entry.hr;
      button.dataset.en = entry.en;
      button.textContent = english() ? entry.en : entry.hr;
      tabsHost.insertBefore(button, mention || null);
    });
    const section = grid.closest('#news .container') || grid.parentElement;
    if (section && !section.querySelector('.topic-monitor-link')) {
      const note = document.createElement('p');
      note.className = 'topic-monitor-link';
      note.innerHTML = '<a href="/teme/">' + (english() ? 'Open thematic monitoring: economy, sport, mobility and technology →' : 'Otvori tematski monitoring: ekonomija, sport, mobilnost i tehnologija →') + '</a>';
      tabsHost.after(note);
    }
    tabsHost.dataset.topicsReady = '1';
    tabs = Array.from(tabsHost.querySelectorAll('button'));
    bindTabs();
  }
  function updateLabels() {
    tabs.forEach((button) => { if (button.dataset.hr) button.textContent = english() ? button.dataset.en : button.dataset.hr; });
    const link = document.querySelector('.topic-monitor-link a');
    if (link) link.textContent = english() ? 'Open thematic monitoring: economy, sport, mobility and technology →' : 'Otvori tematski monitoring: ekonomija, sport, mobilnost i tehnologija →';
  }
  function stamp(item) {
    const raw = item.published_at || item.date || '';
    const time = Date.parse(raw);
    return Number.isFinite(time) ? time : 0;
  }
  function fresh(item) {
    const days = item.group === 'mentions' ? 3650 : 30;
    return stamp(item) > Date.now() - (days * 24 * 60 * 60 * 1000);
  }
  function renderCard(item) {
    const en = english();
    const isMention = item.group === 'mentions';
    const type = isMention ? ' is-mention' : item.category === 'technology' ? ' is-tech' : item.category === 'digital-assets' ? ' is-assets' : item.category === 'automotive' ? ' is-tech' : '';
    const label = isMention ? (en ? 'GNK ASG IN THE MEDIA · MANUALLY APPROVED' : 'GNK ASG U MEDIJIMA · RUČNO ODOBRENO') : (item.source || item.category || 'BUSINESS NEWS');
    const date = stamp(item) ? new Date(stamp(item)).toLocaleDateString(en ? 'en-GB' : 'hr-HR') : '';
    const summary = item.summary || (en ? 'Open the source for the full publication.' : 'Otvorite izvor za cjelovitu objavu.');
    const open = en ? 'OPEN SOURCE →' : 'OTVORI IZVOR →';
    return '<article class="news-card' + type + '"><span class="meta">' + esc(label) + (date ? ' · ' + esc(date) : '') + '</span><h3>' + esc(item.title) + '</h3><p>' + esc(summary) + '</p><a target="_blank" rel="noopener nofollow" href="' + esc(item.url) + '">' + open + '</a></article>';
  }
  function collection(filter) {
    if (filter === 'mentions') return approvedMedia;
    if (filter === 'all') return articles.concat(approvedMedia);
    return articles.filter((item) => String(item.group || '').toLowerCase().includes(filter) || String(item.category || '').toLowerCase().includes(filter));
  }
  function render(filter) {
    activeFilter = filter;
    const en = english();
    if (filter === 'fina') {
      grid.innerHTML = '<article class="news-card"><span class="meta">FINA / RGFI</span><h3>' + (en ? 'Official Public Information' : 'Službene javne informacije') + '</h3><p>' + (en ? 'FINA and RGFI sources are shown in the official public-information panel.' : 'FINA i RGFI izvori prikazuju se u službenom panelu javnih informacija.') + '</p><a target="_blank" rel="noopener nofollow" href="https://rgfi.fina.hr/JavnaObjava-web/">' + (en ? 'OPEN PUBLIC DISCLOSURE →' : 'OTVORI JAVNU OBJAVU →') + '</a></article>';
      return;
    }
    const selected = collection(filter).filter(fresh).sort((a,b) => stamp(b) - stamp(a));
    if (!selected.length) {
      const monitorText = filter === 'mentions' ? (en ? 'This section displays only public media publications previously reviewed and manually approved for publication.' : 'Ova rubrika prikazuje samo javne medijske objave koje su prethodno pregledane i ručno odobrene za objavu.') : (en ? 'Only news from the last 30 days are shown and new content is collected every hour.' : 'Prikazuju se samo vijesti iz posljednjih 30 dana, a novi sadržaj preuzima se svakog sata.');
      grid.innerHTML = '<article class="news-card"><span class="meta">' + (filter === 'mentions' ? (en ? 'MANUAL APPROVAL REQUIRED' : 'POTREBNO RUČNO ODOBRENJE') : (en ? 'AUTOMATED REFRESH' : 'AUTOMATSKO AŽURIRANJE')) + '</span><h3>' + (en ? 'No approved item in the selected section' : 'Nema odobrene stavke u odabranoj rubrici') + '</h3><p>' + monitorText + '</p></article>';
      return;
    }
    grid.innerHTML = selected.slice(0, 15).map(renderCard).join('');
  }
  function bindTabs() {
    tabs.forEach((button) => {
      if (button.dataset.newsBound) return;
      button.dataset.newsBound = '1';
      button.addEventListener('click', () => {
        tabs.forEach((entry) => entry.classList.remove('active'));
        button.classList.add('active');
        render(button.dataset.filter || 'all');
      });
    });
  }
  async function load() {
    try {
      const responses = await Promise.all([
        fetch('data/news.json?v=' + Date.now(), {cache:'no-store'}),
        fetch('data/media_approved.json?v=' + Date.now(), {cache:'no-store'})
      ]);
      articles = responses[0].ok ? await responses[0].json() : [];
      approvedMedia = responses[1].ok ? await responses[1].json() : [];
      approvedMedia = approvedMedia.map(item => Object.assign({}, item, {group:'mentions', category:'mentions'}));
    } catch (error) { articles = []; approvedMedia = []; }
    render(activeFilter);
  }
  ensureTopicControls();
  bindTabs();
  window.addEventListener('gnk-language-change', () => { updateLabels(); render(activeFilter); });
  load();
})();