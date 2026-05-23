(() => {
  'use strict';
  const count = document.getElementById('approvedCount');
  const last = document.getElementById('approvedLast');
  const list = document.getElementById('approvedPreview');
  const pendingCount = document.getElementById('pendingCount');
  const monitorState = document.getElementById('monitorState');
  const reviewList = document.getElementById('reviewList');
  const queueUpdated = document.getElementById('queueUpdated');
  const queueFeedback = document.getElementById('queueFeedback');
  const toolbar = document.getElementById('queueToolbar');
  const actionUrl = 'https://github.com/aktualmedia/gnk-asg/actions/workflows/queue-item-action.yml';
  let queue = [];
  let activeSubject = 'all';

  function esc(value) {
    return String(value || '').replace(/[&<>"']/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[character]));
  }
  function safeUrl(value) {
    try {
      const parsed = new URL(String(value || ''), window.location.href);
      return /^https?:$/.test(parsed.protocol) ? parsed.href : '#';
    } catch (error) {
      return '#';
    }
  }
  function formatDate(value) {
    const parsed = Date.parse(value || '');
    return Number.isFinite(parsed) ? new Date(parsed).toLocaleString('hr-HR') : '—';
  }
  function feedback(text) {
    if (!queueFeedback) return;
    queueFeedback.textContent = text;
    queueFeedback.classList.add('visible');
    window.setTimeout(() => queueFeedback.classList.remove('visible'), 6000);
  }
  async function copyIdAndOpen(itemId, action) {
    const instruction = 'ID stavke ' + itemId + ' kopiran je. U obrascu odaberite radnju „' + action + '” i pokrenite workflow.';
    try {
      await navigator.clipboard.writeText(itemId);
      feedback(instruction);
    } catch (error) {
      window.prompt('Kopirajte ID stavke pa ga zalijepite u autorizirani obrazac:', itemId);
      feedback('Otvoren je obrazac. Unesite ID stavke i odaberite radnju „' + action + '”.');
    }
    window.open(actionUrl, '_blank', 'noopener,noreferrer');
  }
  function renderQueue() {
    if (!reviewList) return;
    const items = activeSubject === 'all' ? queue : queue.filter((item) => item.subject === activeSubject);
    if (!items.length) {
      reviewList.innerHTML = '<div class="queue-empty">Trenutačno nema javnih nalaza koji čekaju pregled u odabranoj kategoriji.</div>';
      return;
    }
    reviewList.innerHTML = items.slice(0, 100).map((item) => {
      const id = esc(item.id);
      const source = esc(item.source || 'Javni izvor');
      const subject = esc(item.subject || 'Korporativni nalaz');
      const title = esc(item.title || 'Objava bez naslova');
      const summary = esc(item.summary || 'Otvorite izvor radi pregleda sadržaja.');
      const url = safeUrl(item.url);
      return '<article class="review-item" data-id="' + id + '"><div><small>' + subject + ' · ' + source + '</small><h3><a target="_blank" rel="noopener nofollow" href="' + esc(url) + '">' + title + '</a></h3><p>' + summary + '</p><div class="review-meta"><span>' + esc(formatDate(item.published_at)) + '</span><span class="review-id">ID: ' + id + '</span><a target="_blank" rel="noopener nofollow" href="' + esc(url) + '">Otvori izvor →</a></div></div><div class="review-buttons"><button class="approve" type="button" data-action="approve" data-id="' + id + '">Odobri</button><button class="reject" type="button" data-action="reject" data-id="' + id + '">Odbaci</button><button class="delete" type="button" data-action="delete" data-id="' + id + '">Obriši</button></div></article>';
    }).join('');
    reviewList.querySelectorAll('button[data-action]').forEach((button) => button.addEventListener('click', () => copyIdAndOpen(button.dataset.id, button.textContent.trim())));
  }
  async function loadApproved() {
    try {
      const response = await fetch('../data/media_approved.json?v=' + Date.now(), { cache: 'no-store' });
      const items = response.ok ? await response.json() : [];
      if (count) count.textContent = Array.isArray(items) ? String(items.length) : '0';
      if (!Array.isArray(items) || !items.length) {
        if (last) last.textContent = 'Trenutačno nema javno odobrenih medijskih objava.';
        if (list) list.innerHTML = '<p class="admin-empty">Nema odobrenih objava za prikaz.</p>';
        return;
      }
      if (last) last.textContent = 'Posljednje odobrenje: ' + formatDate(items[0].approved_at || items[0].published_at);
      if (list) list.innerHTML = items.slice(0, 4).map((item) => '<article class="approved-item"><strong>' + esc(item.title) + '</strong><span>' + esc(item.source) + ' · ' + esc(formatDate(item.published_at)) + '</span></article>').join('');
    } catch (error) {
      if (last) last.textContent = 'Status odobrenih objava nije se mogao učitati.';
    }
  }
  async function loadQueue() {
    try {
      const responses = await Promise.all([
        fetch('../data/corporate_review_queue.json?v=' + Date.now(), { cache: 'no-store' }),
        fetch('../data/update_status.json?v=' + Date.now(), { cache: 'no-store' })
      ]);
      queue = responses[0].ok ? await responses[0].json() : [];
      if (!Array.isArray(queue)) queue = [];
      const status = responses[1].ok ? await responses[1].json() : {};
      const monitor = status.corporate_media_monitor || {};
      if (pendingCount) pendingCount.textContent = String(queue.length);
      if (monitorState) monitorState.textContent = monitor.status === 'ok' ? 'AKTIVAN' : (monitor.status === 'partial' ? 'DJELOMIČAN' : '—');
      if (queueUpdated) queueUpdated.textContent = 'Posljednja automatska provjera: ' + formatDate(monitor.updated_at) + '. Pronađeno stavki koje čekaju pregled: ' + queue.length + '.';
      renderQueue();
    } catch (error) {
      if (monitorState) monitorState.textContent = '—';
      if (queueUpdated) queueUpdated.textContent = 'Status reda za pregled trenutačno nije dostupan.';
      if (reviewList) reviewList.innerHTML = '<div class="queue-empty">Red za pregled nije se mogao učitati.</div>';
    }
  }
  if (toolbar) {
    toolbar.querySelectorAll('button[data-subject]').forEach((button) => button.addEventListener('click', () => {
      toolbar.querySelectorAll('button').forEach((entry) => entry.classList.remove('active'));
      button.classList.add('active');
      activeSubject = button.dataset.subject || 'all';
      renderQueue();
    }));
  }
  loadApproved();
  loadQueue();
  window.setInterval(loadQueue, 300000);
})();
