(() => {
  'use strict';
  if (window.__GNK_EMERGENCY_FAST__) return;
  window.__GNK_EMERGENCY_FAST__ = true;
  window.GNK_EMERGENCY_FAST = { version: '2026-06-12-01', loaded_at: new Date().toISOString() };

  function css() {
    if (document.getElementById('gnkEmergencyFastStyle')) return;
    const s = document.createElement('style');
    s.id = 'gnkEmergencyFastStyle';
    s.textContent = `
      @media(max-width:1040px){
        #navLinks.open{display:flex!important;position:absolute!important;right:20px!important;top:76px!important;width:min(320px,calc(100vw - 40px))!important;max-height:calc(100vh - 96px)!important;overflow:auto!important;flex-direction:column!important;align-items:stretch!important;background:#fff!important;border:1px solid #dae2ee!important;border-radius:16px!important;padding:14px!important;box-shadow:0 22px 60px rgba(7,22,45,.18)!important;z-index:99999!important}
        #menuToggle{touch-action:manipulation!important;user-select:none!important}
      }
      body.gnk-emergency-fast canvas,body.gnk-emergency-fast .group-globe-stage{display:none!important}
    `;
    document.head.appendChild(s);
  }

  function bindMenu() {
    const btn = document.getElementById('menuToggle');
    const nav = document.getElementById('navLinks');
    if (!btn || !nav || btn.dataset.emergencyFast === '1') return;
    btn.dataset.emergencyFast = '1';
    btn.setAttribute('aria-controls', 'navLinks');
    btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', nav.classList.contains('open') ? 'true' : 'false');
    }, { passive: false });
    nav.addEventListener('click', event => {
      const link = event.target && event.target.closest ? event.target.closest('a') : null;
      if (link) {
        nav.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function stopOldServiceWorker() {
    if (!navigator.serviceWorker) return;
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(reg => reg.update && reg.update());
    }).catch(() => {});
  }

  function init() {
    document.body && document.body.classList.add('gnk-emergency-fast');
    css();
    bindMenu();
    setTimeout(bindMenu, 250);
    setTimeout(bindMenu, 1000);
    stopOldServiceWorker();
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init, { once: true }) : init();
})();
