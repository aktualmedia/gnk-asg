document.addEventListener('DOMContentLoaded', function () {
  function style(path) {
    if (document.querySelector('link[href^="' + path + '"]')) return;
    var el = document.createElement('link');
    el.rel = 'stylesheet'; el.href = path + '?v=20260523-21'; document.head.appendChild(el);
  }
  function script(path) {
    if (document.querySelector('script[src^="' + path + '"]')) return;
    var el = document.createElement('script');
    el.src = path + '?v=20260523-21'; el.defer = true; document.body.appendChild(el);
  }
  style('assets/fina-panel.css');
  style('assets/advanced.css');
  style('assets/header-premium.css');
  style('assets/group-contrast.css');
  style('assets/group-network.css');
  style('assets/network-motion.css');
  style('assets/bitcoin-chart.css');
  style('assets/market-expansion.css');
  style('assets/language.css');
  style('assets/intelligence-desk.css');
  style('assets/mobile-app.css');
  style('assets/desk-search.css');
  style('assets/floating-intelligence.css');
  style('assets/public-sources.css');
  style('assets/mobile-stability.css');
  script('assets/i18n.js');
  script('assets/language-routing.js');
  script('assets/portal-navigation.js');
  script('assets/status.js');
  script('assets/market.js');
  script('assets/live-market-pulse.js');
  script('assets/bitcoin-chart.js');
  script('assets/market-expansion.js');
  script('assets/news-live.js');
  script('assets/assistant.js');
  script('assets/inline-assistant.js');
  script('assets/intelligence-desk.js');
  script('assets/desk-search.js');
  script('assets/mobile-app.js');
  script('assets/mobile-navigation.js');
  script('assets/floating-intelligence.js');
  script('assets/group-network.js');
  script('assets/network-motion.js');
  script('assets/group-clarity.js');
  script('assets/public-sources.js');
  script('assets/hourly-data-disclosure.js');

  function isEnglish() {
    return /\/en\/?$/.test(window.location.pathname) || (window.GNK_LANG && window.GNK_LANG.get && window.GNK_LANG.get() === 'en');
  }
  function renderMediaNotice() {
    var notice = document.querySelector('.mention-notice');
    if (!notice) return;
    notice.innerHTML = isEnglish()
      ? '<strong>Approved public publications:</strong> the GNK ASG in the Media section displays only public online and media publications about GNK ASG d.o.o., GNK DINAMO Ltd. or Nermin Sefić that have been manually reviewed and approved for public display.'
      : '<strong>Odobrene javne objave:</strong> rubrika GNK ASG u medijima prikazuje samo javne internetske i medijske objave o GNK ASG d.o.o., GNK DINAMO Ltd. ili Nerminu Sefiću koje su prethodno ručno pregledane i odobrene za javni prikaz.';
  }
  renderMediaNotice();
  window.addEventListener('gnk-language-change', renderMediaNotice);

  var menuButton = document.getElementById('menuToggle');
  var menu = document.getElementById('navLinks');
  if (menuButton && menu) {
    menuButton.addEventListener('click', function () { menu.classList.toggle('open'); });
    document.addEventListener('click', function (event) {
      if (!menu.contains(event.target) && event.target !== menuButton) menu.classList.remove('open');
    });
  }

  var grid = document.getElementById('newsGrid');
  if (grid) {
    fetch('data/fina_watch.json?v=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (data) {
      var items = data.items || [];
      if (!items.length) return;
      var layout = document.createElement('div'); layout.className = 'news-layout';
      grid.parentNode.insertBefore(layout, grid); layout.appendChild(grid);
      var panel = document.createElement('aside'); panel.className = 'fina-panel'; layout.appendChild(panel);
      var current = 0;
      function show() {
        var item = items[current]; if (!item) return;
        var en = isEnglish();
        panel.innerHTML = '<header class="fina-head"><small>' + (en ? 'Official business information' : 'Službene poslovne informacije') + '</small><h3>FINA Info.BIZ / RGFI</h3><p>' + (en ? 'Public sources and verification' : 'Javni izvori i provjere') + '</p></header><div class="fina-stage"><article class="fina-item"><span class="fina-tag"></span><h4></h4><p></p><a target="_blank" rel="noopener">' + (en ? 'Verify source' : 'Provjeri izvor') + '</a></article></div><div class="fina-legal">' + (en ? 'Only publicly available and verifiable information and links to official sources are displayed.' : 'Prikazuju se samo javno dostupne i provjerljive informacije te poveznice prema službenim izvorima.') + '</div>';
        panel.querySelector('.fina-tag').textContent = item.category || '';
        panel.querySelector('h4').textContent = item.title || '';
        panel.querySelector('.fina-item p').textContent = item.summary || '';
        panel.querySelector('a').href = item.url || '#';
      }
      show();
      window.addEventListener('gnk-language-change', show);
      if (items.length > 1) window.setInterval(function () { current = (current + 1) % items.length; show(); }, 11000);
    }).catch(function () {});
  }
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(function () {});
});
