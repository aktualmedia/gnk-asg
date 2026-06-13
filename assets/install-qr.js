(() => {
  'use strict';
  if (document.getElementById('installQrCard')) return;
  const style = document.createElement('style');
  style.textContent = '.install-qr-card{position:fixed;right:18px;bottom:92px;z-index:60;width:178px;padding:14px;border-radius:22px;background:#07162d;border:1px solid rgba(212,175,55,.55);box-shadow:0 18px 50px rgba(7,22,45,.28);color:#fff;font-family:Arial,Helvetica,sans-serif}.install-qr-card.is-hidden{display:none}.install-qr-card small{display:block;color:#d4af37;font-weight:800;letter-spacing:.08em;text-transform:uppercase;font-size:10px;margin-bottom:7px}.install-qr-card strong{display:block;font-size:15px;line-height:1.25;margin-bottom:8px}.install-qr-card img{display:block;width:132px;height:132px;margin:0 auto 10px;border-radius:14px;background:#fff;padding:8px}.install-qr-card p{font-size:11px;line-height:1.45;color:#dbe7f5;margin:0 0 10px}.install-qr-actions{display:flex;gap:6px;align-items:center}.install-qr-actions a,.install-qr-actions button{border-radius:999px;padding:7px 9px;font-size:11px;font-weight:900;text-decoration:none;cursor:pointer}.install-qr-actions a{background:#d4af37;color:#07162d}.install-qr-actions button{background:#143b6d;color:#fff;border:1px solid rgba(255,255,255,.18)}@media(max-width:760px){.install-qr-card{position:static;width:auto;margin:22px 18px 0;display:flex;gap:14px;align-items:center}.install-qr-card img{width:92px;height:92px;margin:0}.install-qr-card p{display:none}.install-qr-actions{margin-top:8px}}';
  document.head.appendChild(style);
  const card = document.createElement('aside');
  card.id = 'installQrCard';
  card.className = 'install-qr-card';
  card.innerHTML = '<div><small>Mobilna verzija</small><strong>Instaliraj GNK ASG portal</strong><p>Skeniraj QR kod i otvori instalacijsku stranicu. Instalaciju potvrđuje preglednik ili uređaj.</p><div class="install-qr-actions"><a href="/instalacija/?source=qr-mobile">Instaliraj</a><button type="button" id="hideInstallQr">Sakrij</button></div></div><img src="/assets/install-mobile-qr.svg" alt="QR kod za instalaciju mobilne verzije GNK ASG portala">';
  const footer = document.querySelector('footer');
  if (footer && matchMedia('(max-width:760px)').matches) footer.parentNode.insertBefore(card, footer);
  else document.body.appendChild(card);
  card.querySelector('#hideInstallQr')?.addEventListener('click', () => { card.classList.add('is-hidden'); try { localStorage.setItem('gnk_install_qr_hidden','1'); } catch (_) {} });
  try { if (localStorage.getItem('gnk_install_qr_hidden') === '1') card.classList.add('is-hidden'); } catch (_) {}
})();
