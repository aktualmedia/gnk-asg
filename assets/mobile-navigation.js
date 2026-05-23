(() => {
  'use strict';
  const isEnglish = () => /\/en\/?$/.test(window.location.pathname) || (window.GNK_LANG && window.GNK_LANG.get && window.GNK_LANG.get() === 'en');
  function labels() {
    return isEnglish() ? {
      finance:'Financials', network:'Global Network', technology:'Technology & AI', markets:'Markets', news:'News', desk:'Intelligence Desk', registers:'Public Registers', documents:'Documents', install:'Install app', control:'Control', home:'Home'
    } : {
      finance:'Financije', network:'Globalna mreža', technology:'Tehnologija i AI', markets:'Tržišta', news:'Vijesti', desk:'Intelligence Desk', registers:'Javni registri', documents:'Dokumenti', install:'Instaliraj aplikaciju', control:'Upravljanje', home:'Početna'
    };
  }
  function renderMenu() {
    const nav = document.getElementById('navLinks');
    if (!nav) return;
    nav.querySelectorAll(':scope > a').forEach(link => link.classList.add('desktop-nav-link'));
    let mobile = nav.querySelector('.mobile-menu-links');
    if (!mobile) {
      mobile = document.createElement('div');
      mobile.className = 'mobile-menu-links';
      nav.prepend(mobile);
    }
    const t = labels();
    mobile.innerHTML = '<a class="primary" href="#assistant">' + t.desk + '</a>' +
      '<a href="#global-network">' + t.network + '</a>' +
      '<a href="#financials">' + t.finance + '</a>' +
      '<a href="#technology">' + t.technology + '</a>' +
      '<a href="#digital-assets">' + t.markets + '</a>' +
      '<a href="#news">' + t.news + '</a>' +
      '<a href="#publicSources">' + t.registers + '</a>' +
      '<a href="#dokumenti">' + t.documents + '</a>' +
      '<a href="instalacija/">' + t.install + '</a>' +
      '<a class="management-link" href="/gnk-asg/admin/">' + t.control + '</a>';
    mobile.querySelectorAll('a').forEach(link => link.addEventListener('click', () => nav.classList.remove('open')));
  }
  function renderHome() {
    let home = document.querySelector('.float-home');
    if (!home) {
      home = document.createElement('a');
      home.href = '#top';
      document.body.appendChild(home);
    }
    home.classList.add('mobile-home');
    home.innerHTML = '⌂<span class="mobile-home-label">' + labels().home + '</span>';
    home.setAttribute('aria-label', labels().home);
  }
  function init() {
    renderMenu();
    renderHome();
    window.addEventListener('gnk-language-change', () => { renderMenu(); renderHome(); });
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
