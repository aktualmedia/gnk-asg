(() => {
  'use strict';

  if (window.__GNK_FRONTEND_STABILITY_GUARD__) return;
  window.__GNK_FRONTEND_STABILITY_GUARD__ = true;

  const state = {
    version: '2026-06-12-frontend-stability-guard-01',
    menu_bound: false,
    errors: [],
    long_tasks: [],
    safe_mode: /[?&]safe=1/.test(location.search)
  };
  window.GNK_FRONTEND_STATE = state;

  function logError(type, detail) {
    state.errors.push({ type, detail: String(detail || '').slice(0, 300), at: new Date().toISOString() });
    if (state.errors.length > 20) state.errors.shift();
  }

  window.addEventListener('error', event => logError('error', event.message || event.error));
  window.addEventListener('unhandledrejection', event => logError('unhandledrejection', event.reason));

  try {
    if ('PerformanceObserver' in window) {
      const po = new PerformanceObserver(list => {
        list.getEntries().forEach(entry => {
          state.long_tasks.push({ name: entry.name || 'longtask', duration: Math.round(entry.duration), at: Date.now() });
          if (state.long_tasks.length > 15) state.long_tasks.shift();
        });
      });
      po.observe({ entryTypes: ['longtask'] });
    }
  } catch (_) {}

  function byId(id) { return document.getElementById(id); }

  function closeMenu() {
    const nav = byId('navLinks');
    const btn = byId('menuToggle');
    if (nav) nav.classList.remove('open');
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }

  function openMenu() {
    const nav = byId('navLinks');
    const btn = byId('menuToggle');
    if (nav) nav.classList.add('open');
    if (btn) btn.setAttribute('aria-expanded', 'true');
  }

  function toggleMenu(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const nav = byId('navLinks');
    if (!nav) return;
    nav.classList.contains('open') ? closeMenu() : openMenu();
  }

  function bindMenu() {
    const nav = byId('navLinks');
    const btn = byId('menuToggle');
    if (!nav || !btn || btn.dataset.gnkStableMenu === '1') return;
    btn.dataset.gnkStableMenu = '1';
    btn.setAttribute('aria-controls', 'navLinks');
    btn.setAttribute('aria-expanded', nav.classList.contains('open') ? 'true' : 'false');
    btn.addEventListener('click', toggleMenu, { passive: false });
    nav.addEventListener('click', event => {
      const link = event.target && event.target.closest ? event.target.closest('a') : null;
      if (link) closeMenu();
    });
    document.addEventListener('click', event => {
      if (!nav.classList.contains('open')) return;
      if (event.target === btn || nav.contains(event.target)) return;
      closeMenu();
    });
    document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
    state.menu_bound = true;
  }

  function ensureBasicMenuCss() {
    if (document.getElementById('gnkStableMenuCss')) return;
    const style = document.createElement('style');
    style.id = 'gnkStableMenuCss';
    style.textContent = `
      @media(max-width:1040px){
        #navLinks.open{display:flex!important;position:absolute!important;right:20px!important;top:76px!important;width:min(320px,calc(100vw - 40px))!important;max-height:calc(100vh - 96px)!important;overflow:auto!important;flex-direction:column!important;align-items:stretch!important;background:#fff!important;border:1px solid #dae2ee!important;border-radius:16px!important;padding:14px!important;box-shadow:0 22px 60px rgba(7,22,45,.18)!important;z-index:9999!important}
        #menuToggle{touch-action:manipulation!important;user-select:none!important}
      }
      body.gnk-safe-mode .group-globe-stage,body.gnk-safe-mode canvas{animation-play-state:paused!important}
    `;
    document.head.appendChild(style);
  }

  function detectSafeMode() {
    const memory = navigator.deviceMemory || 4;
    const small = window.matchMedia && window.matchMedia('(max-width: 760px)').matches;
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (state.safe_mode || reduced || (small && memory <= 3)) {
      state.safe_mode = true;
      document.documentElement.classList.add('gnk-safe-mode');
      document.body && document.body.classList.add('gnk-safe-mode');
    }
  }

  function init() {
    ensureBasicMenuCss();
    detectSafeMode();
    bindMenu();
    setTimeout(bindMenu, 300);
    setTimeout(bindMenu, 1200);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
