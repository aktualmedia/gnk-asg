(() => {
  'use strict';
  const count = document.getElementById('approvedCount');
  const last = document.getElementById('approvedLast');
  const list = document.getElementById('approvedPreview');
  const monitorState = document.getElementById('monitorState');
  const monitorMessage = document.getElementById('monitorMessage');
  const queueUpdated = document.getElementById('queueUpdated');
  function esc(value) {
    return String(value || '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  }
  function formatDate(value) {
    const parsed = Date.parse(value || '');
    return Number.isFinite(parsed) ? new Date(parsed).toLocaleString('hr-HR') : '—';
  }
  async function loadApproved() {
    try {
      const response = await fetch('../data/media_approved.json?v=' + Date.now(), {cache:'no-store'});
      const data = response.ok ? await response.json() : [];
      const items = Array.isArray(data) ? data : [];
      if (count) count.textContent = String(items.length);
      if (!items.length) {
        if (last) last.textContent = 'Trenutačno nema javno odobrenih medijskih objava.';
        if (list) list.innerHTML = '<p class="admin-empty">Nema odobrenih objava za prikaz.</p>';
        return;
      }
      if (last) last.textContent = 'Posljednje odobrenje: ' + formatDate(items[0].approved_at || items[0].published_at);
      if (list) list.innerHTML = items.slice(0, 4).map(item => '<article class="approved-item"><strong>' + esc(item.title) + '</strong><span>' + esc(item.source) + ' · ' + esc(formatDate(item.published_at)) + '</span></article>').join('');
    } catch (error) {
      if (last) last.textContent = 'Status javno odobrenih objava nije se mogao učitati.';
    }
  }
  async function loadStatus() {
    try {
      const response = await fetch('../data/media_monitor_status.json?v=' + Date.now(), {cache:'no-store'});
      const status = response.ok ? await response.json() : {};
      const ok = status.status === 'ok';
      if (monitorState) monitorState.textContent = ok ? 'AKTIVAN' : (status.status === 'partial' ? 'DJELOMIČAN' : '—');
      if (monitorMessage) monitorMessage.textContent = ok ? 'Monitoring javnih izvora radi. Pregled nalaza obavlja ovlašteni korisnik kroz kontrolirani radni postupak.' : 'Status monitoringa nije potpuno uredan. Ovlašteni korisnik treba pregledati posljednje izvršenje.';
      if (queueUpdated) queueUpdated.textContent = 'Posljednja provjera monitoringa: ' + formatDate(status.updated_at) + '. Javni portal prikazuje samo ručno odobrene objave.';
    } catch (error) {
      if (monitorState) monitorState.textContent = '—';
      if (monitorMessage) monitorMessage.textContent = 'Status automatskog monitoringa trenutačno nije dostupan.';
      if (queueUpdated) queueUpdated.textContent = 'Neodobrene stavke nisu dio javnog prikaza.';
    }
  }
  loadApproved();
  loadStatus();
  window.setInterval(loadStatus, 300000);
})();
