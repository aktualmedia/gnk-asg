(() => {
  'use strict';
  const q = (s, r = document) => r.querySelector(s);
  const qa = (s, r = document) => Array.from(r.querySelectorAll(s));
  const en = () => window.GNK_LANG && window.GNK_LANG.get && window.GNK_LANG.get() === 'en';
  const loc = () => en() ? 'en-GB' : 'hr-HR';
  const read = async (path) => { try { const r = await fetch(path + '?v=' + Date.now(), { cache:'no-store' }); return r.ok ? r.json() : null; } catch { return null; } };
  const clean = (value) => String(value || '');
  function style() {
    if (q('#gnk-final-fix-style')) return;
    const s = document.createElement('style');
    s.id = 'gnk-final-fix-style';
    s.textContent = '.news-card{min-height:0!important}.news-card.no-image{background:#fff!important;color:#102033!important;padding:18px!important}.news-card.no-image h3{color:#07162d!important;font-size:1rem}.news-card.no-image p{color:#5f7086!important;font-size:.82rem}.news-card.auto-editor{border:1px solid rgba(212,175,55,.42)!important;background:linear-gradient(180deg,#fff,#fffaf0)!important}.doc{position:relative}.doc .doc-link{display:inline-flex;margin-top:12px;border:1px solid rgba(212,175,55,.45);border-radius:999px;padding:8px 12px;background:#fffaf0;color:#07162d!important;font-weight:900;text-decoration:none}.snapshot-label{display:inline-flex;margin-top:8px;border:1px solid rgba(212,175,55,.42);border-radius:999px;padding:4px 8px;color:#e7c75f;font-size:.58rem;font-weight:900}.future-confirmation-note{margin-top:20px;padding:15px 17px;border:1px solid rgba(212,175,55,.32);border-radius:16px;background:rgba(255,255,255,.08);color:#f2e6c8;font-size:.88rem;line-height:1.5}.ai-fab{border:2px solid #d4af37!important}.ai-fab-mark{color:#fff!important}';
    document.head.appendChild(s);
  }
  function money(value, code) {
    const n = Number(value || 0);
    const digits = code === 'jpy' ? 0 : Math.abs(n) < 1 ? 5 : 2;
    try { return new Intl.NumberFormat(loc(), { style:'currency', currency:code.toUpperCase(), maximumFractionDigits:digits }).format(n); } catch { return String(n); }
  }
  function dlabel(value) { const d = new Date(value || ''); return isNaN(d) ? '—' : d.toLocaleString(loc()); }
  function node(tag, cls, text) { const el = document.createElement(tag); if (cls) el.className = cls; if (text != null) el.textContent = text; return el; }
  function patchGroup() {
    const g = q('#grupa'); if (!g || g.dataset.fixedFuture === '1') return;
    const walker = document.createTreeWalker(g, NodeFilter.SHOW_TEXT);
    let t; while ((t = walker.nextNode())) {
      t.nodeValue = t.nodeValue
        .replace('33 postojeća društva i 12 planiranih pozicija', '33 postojeća društva, 12 planiranih pozicija i 2 buduće pozicije u potvrdi')
        .replace('33 postojeća društva · +12 planiranih pozicija', '33 postojeća društva · +12 planiranih · +2 u potvrdi')
        .replace('12 Planirano 2026.', '14 Buduće pozicije')
        .replace('45 Ciljani prikaz nakon širenja', '47 Ciljani prikaz nakon potvrde');
    }
    const note = node('div', 'future-confirmation-note', en() ? '12 locations are planned from the data layer; 2 additional future positions are pending confirmation.' : '12 lokacija je planirano iz podatkovnog sloja, a 2 dodatne buduće pozicije vode se kao lokacije u potvrdi.');
    (q('.container', g) || g).appendChild(note);
    g.dataset.fixedFuture = '1';
  }
  async function market() {
    const grid = q('#coinGrid'); if (!grid) return;
    const data = await read('/data/market.json') || await read('data/market.json');
    const coins = Array.isArray(data && data.coins) ? data.coins : [];
    const cur = (q('#currency')?.value || 'eur').toLowerCase();
    grid.textContent = '';
    if (!coins.length) { grid.appendChild(node('article', 'coin', en() ? 'Market snapshot unavailable · FALLBACK' : 'Market snapshot nedostupan · FALLBACK')); return; }
    coins.slice(0, 12).forEach(c => {
      const card = node('article', 'coin');
      const top = node('div', 'coin-top');
      top.appendChild(node('strong', '', clean(c.symbol)));
      top.appendChild(node('small', '', clean(c.id)));
      card.appendChild(top);
      card.appendChild(node('div', 'price', money((c.prices || {})[cur], cur)));
      const ch = Number((c.changes_24h || {})[cur] || 0);
      card.appendChild(node('div', 'change ' + (ch >= 0 ? 'positive' : 'negative'), (ch >= 0 ? '+' : '') + ch.toFixed(2) + '% / 24 h'));
      card.appendChild(node('small', 'snapshot-label', 'SNAPSHOT'));
      grid.appendChild(card);
    });
    const stamp = q('#marketUpdated'); if (stamp) stamp.textContent = (en() ? 'Updated: ' : 'Ažurirano: ') + dlabel(data.updated_at || data.checked_at) + ' · SNAPSHOT';
    const ticker = q('#ticker'); if (ticker) { ticker.textContent = ''; coins.slice(0, 4).forEach(c => ticker.appendChild(node('span', '', clean(c.symbol) + ' ' + money((c.prices || {})[cur], cur)))); ticker.appendChild(node('span', '', 'GNK ASG MARKET SNAPSHOT')); }
    const result = q('#convertResult'); const amount = Number(q('#convertAmount')?.value || 1); const selected = q('#convertCoin')?.value || 'bitcoin'; const coin = coins.find(c => c.id === selected) || coins[0]; if (result && coin) result.textContent = money(amount * Number((coin.prices || {})[cur] || 0), cur);
  }
  function addNewsCard(grid, item) {
    const card = node('article', 'news-card no-image' + (item.type === 'auto-editor' ? ' auto-editor' : ''));
    const metaText = item.type === 'auto-editor' ? 'AUTO EDITOR · PUBLISHED · SNAPSHOT' : clean(item.source || item.category || item.group || 'NEWS');
    card.appendChild(node('span', 'meta', metaText));
    card.appendChild(node('h3', '', clean(item.title || 'Business News')));
    card.appendChild(node('p', '', clean(item.summary || item.seo_description || (en() ? 'Open the source for the full publication.' : 'Otvorite izvor za cjelovitu objavu.'))));
    const a = node('a', '', item.type === 'auto-editor' ? (en() ? 'READ ARTICLE →' : 'PROČITAJ OBJAVU →') : (en() ? 'OPEN SOURCE →' : 'OTVORI IZVOR →'));
    a.target = item.type === 'auto-editor' ? '_self' : '_blank';
    a.rel = item.type === 'auto-editor' ? 'bookmark' : 'noopener nofollow';
    a.href = item.canonical || item.url || item.share_url || '#';
    card.appendChild(a);
    grid.appendChild(card);
  }
  async function news(filter) {
    const grid = q('#newsGrid'); if (!grid) return;
    const data = await read('/data/news.json') || await read('data/news.json');
    const auto = await read('/data/auto_editor_posts.json') || await read('data/auto_editor_posts.json');
    const base = Array.isArray(data) ? data : [];
    const posts = Array.isArray(auto) ? auto.filter(p => p && p.status === 'published') : [];
    const active = filter || q('#newsTabs button.active')?.dataset.filter || 'all';
    if (active === 'fina') return;
    let selected = [];
    if (active === 'all' || active === 'technology' || active === 'economy' || active === 'digital-assets') selected = selected.concat(posts);
    selected = selected.concat(base.filter(i => active === 'all' || String((i.group || '') + ' ' + (i.category || '') + ' ' + (i.region || '')).toLowerCase().includes(active)));
    selected = selected.slice(0, 24);
    grid.textContent = '';
    if (!selected.length) { grid.appendChild(node('article', 'news-card no-image', en() ? 'No public item in selected section.' : 'Nema javne stavke u odabranoj rubrici.')); return; }
    selected.forEach(item => addNewsCard(grid, item));
  }
  function docs() {
    qa('#dokumenti .doc').forEach(card => {
      const title = (q('h3', card)?.textContent || '').toLowerCase();
      if (card.querySelector('a')) return;
      const a = node('a', 'doc-link', 'OTVORI PDF →'); a.target = '_blank'; a.rel = 'noopener';
      if (title.includes('revizor') || title.includes('financijski')) a.href = '/documents/GNK_ASG_Izvjesce_neovisnog_revizora_i_financijski_izvjestaji_2025.pdf';
      else if (title.includes('consolidated') || title.includes('dinamo')) a.href = '/documents/GNK_DINAMO_Ltd_Colorado_Filing_Consolidated_Financial_Statements_2025.pdf';
      else return;
      card.appendChild(a);
    });
  }
  function bind() {
    qa('#newsTabs button').forEach(b => { if (!b.dataset.fixBound) { b.dataset.fixBound = '1'; b.addEventListener('click', () => { qa('#newsTabs button').forEach(x => x.classList.remove('active')); b.classList.add('active'); news(b.dataset.filter || 'all'); }); }});
    ['currency','convertAmount','convertCoin'].forEach(id => { const el = document.getElementById(id); if (el && !el.dataset.fixBound) { el.dataset.fixBound = '1'; el.addEventListener(id === 'convertAmount' ? 'input' : 'change', market); } });
  }
  function ai() { let kept = false; qa('.ai-fab,.float-chat-trigger,#aiFab').forEach(el => { if (!kept && (el.id === 'aiFab' || el.classList.contains('ai-fab'))) { kept = true; return; } if (el.classList.contains('float-chat-trigger')) el.style.display = 'none'; }); }
  function run() { style(); patchGroup(); docs(); bind(); ai(); market(); news(); }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', run) : run();
  window.addEventListener('gnk-language-change', run);
  setTimeout(run, 800); setTimeout(run, 1800); setInterval(() => { market(); news(); docs(); ai(); }, 60000);
})();
