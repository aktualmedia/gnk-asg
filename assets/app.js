document.addEventListener('DOMContentLoaded', function () {
  function style(path) {
    if (document.querySelector('link[href^="' + path + '"]')) return;
    var el = document.createElement('link');
    el.rel = 'stylesheet'; el.href = path + '?v=20260522-10'; document.head.appendChild(el);
  }
  function script(path) {
    if (document.querySelector('script[src^="' + path + '"]')) return;
    var el = document.createElement('script');
    el.src = path + '?v=20260522-10'; el.defer = true; document.body.appendChild(el);
  }
  style('assets/fina-panel.css');
  style('assets/advanced.css');
  style('assets/bitcoin-chart.css');
  script('assets/status.js');
  script('assets/market.js');
  script('assets/bitcoin-chart.js');
  script('assets/news-live.js');
  script('assets/assistant.js');
  script('assets/inline-assistant.js');

  var notice = document.querySelector('.mention-notice');
  if (notice) {
    notice.innerHTML = '<strong>Automatski prikaz objava o društvu:</strong> javne objave koje izravno spominju GNK ASG d.o.o., GNK DINAMO Ltd. ili Nermina Sefića automatski se prikazuju u rubrici GNK ASG u medijima. Neželjena vijest uklanja se kroz blok-listu portala.';
  }
  var menuButton = document.getElementById('menuToggle');
  var menu = document.getElementById('navLinks');
  if (menuButton && menu) menuButton.addEventListener('click', function () { menu.classList.toggle('open'); });

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
        panel.innerHTML = '<header class="fina-head"><small>Službene poslovne informacije</small><h3>FINA Info.BIZ / RGFI</h3><p>Javni izvori i provjere</p></header><div class="fina-stage"><article class="fina-item"><span class="fina-tag"></span><h4></h4><p></p><a target="_blank" rel="noopener">Provjeri izvor</a></article></div><div class="fina-legal">Prikazuju se samo javno dostupne i provjerljive informacije te poveznice prema službenim izvorima.</div>';
        panel.querySelector('.fina-tag').textContent = item.category || '';
        panel.querySelector('h4').textContent = item.title || '';
        panel.querySelector('.fina-item p').textContent = item.summary || '';
        panel.querySelector('a').href = item.url || '#';
      }
      show();
      if (items.length > 1) window.setInterval(function () { current = (current + 1) % items.length; show(); }, 11000);
    }).catch(function () {});
  }
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(function () {});
});
