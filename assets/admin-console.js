(() => {
  'use strict';
  const count = document.getElementById('approvedCount');
  const last = document.getElementById('approvedLast');
  const list = document.getElementById('approvedPreview');
  async function load() {
    try {
      const response = await fetch('../data/media_approved.json?v=' + Date.now(), { cache: 'no-store' });
      const items = response.ok ? await response.json() : [];
      if (count) count.textContent = Array.isArray(items) ? String(items.length) : '0';
      if (!Array.isArray(items) || !items.length) {
        if (last) last.textContent = 'Trenutačno nema javno odobrenih medijskih objava.';
        if (list) list.innerHTML = '<p class="admin-empty">Nema odobrenih objava za prikaz.</p>';
        return;
      }
      if (last) last.textContent = 'Posljednje odobrenje: ' + (items[0].approved_at || items[0].published_at || '—');
      if (list) list.innerHTML = items.slice(0, 4).map(item => '<article class="approved-item"><strong>' + String(item.title || '').replace(/[<>&]/g,'') + '</strong><span>' + String(item.source || '').replace(/[<>&]/g,'') + ' · ' + String(item.published_at || '').replace(/[<>&]/g,'') + '</span></article>').join('');
    } catch (error) {
      if (last) last.textContent = 'Status se nije mogao učitati.';
    }
  }
  load();
})();
