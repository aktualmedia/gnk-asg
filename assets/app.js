document.addEventListener('DOMContentLoaded', function () {
  var menuButton = document.getElementById('menuToggle');
  var menu = document.getElementById('navLinks');
  if (menuButton && menu) {
    menuButton.addEventListener('click', function () { menu.classList.toggle('open'); });
  }
  var grid = document.getElementById('newsGrid');
  if (!grid) { return; }
  var style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = 'assets/fina-panel.css?v=1';
  document.head.appendChild(style);
  fetch('data/fina_watch.json?v=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (data) {
    var items = data.items || [];
    var layout = document.createElement('div');
    layout.className = 'news-layout';
    grid.parentNode.insertBefore(layout, grid);
    layout.appendChild(grid);
    var panel = document.createElement('aside');
    panel.className = 'fina-panel';
    layout.appendChild(panel);
    var current = 0;
    function show() {
      var item = items[current];
      panel.replaceChildren();
      var head = document.createElement('header');
      head.className = 'fina-head';
      var small = document.createElement('small'); small.textContent = 'Službene poslovne informacije';
      var h = document.createElement('h3'); h.textContent = 'FINA Info.BIZ / RGFI';
      var p = document.createElement('p'); p.textContent = 'Javni izvori i provjere';
      head.append(small, h, p); panel.appendChild(head);
      var stage = document.createElement('div'); stage.className = 'fina-stage';
      if (item) {
        var article = document.createElement('article'); article.className = 'fina-item';
        var tag = document.createElement('span'); tag.className = 'fina-tag'; tag.textContent = item.category;
        var title = document.createElement('h4'); title.textContent = item.title;
        var summary = document.createElement('p'); summary.textContent = item.summary;
        var link = document.createElement('a'); link.href = item.url; link.target = '_blank'; link.rel = 'noopener'; link.textContent = 'Provjeri izvor';
        article.append(tag, title, summary, link); stage.appendChild(article);
      }
      panel.appendChild(stage);
      var note = document.createElement('div'); note.className = 'fina-legal'; note.textContent = 'Prikazuju se samo javno dostupne i provjerljive informacije te poveznice prema službenim izvorima.'; panel.appendChild(note);
    }
    show();
    if (items.length > 1) { window.setInterval(function () { current = (current + 1) % items.length; show(); }, 11000); }
  }).catch(function () {});
});
