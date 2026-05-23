(() => {
  const isEnglish = () => /\/en\/?$/.test(location.pathname);
  const labels = () => isEnglish() ? {profile:'Profile', finance:'Financials', network:'Network', markets:'Market Intelligence', sources:'Sources', desk:'AI Desk', control:'Control'} : {profile:'Profil', finance:'Financije', network:'Mreža', markets:'Market Intelligence', sources:'Izvori', desk:'AI Desk', control:'Upravljanje'};
  function render() {
    const nav = document.getElementById('navLinks');
    if (!nav) return;
    nav.querySelectorAll(':scope > a').forEach(link => link.classList.add('legacy-nav-item'));
    let box = nav.querySelector('.portal-navigation');
    if (!box) { box = document.createElement('div'); box.className = 'portal-navigation'; nav.appendChild(box); }
    const t = labels();
    const marketUrl = isEnglish() ? '/gnk-asg/en/markets/' : '/gnk-asg/trzista/';
    box.innerHTML = '<a href="#o-nama">' + t.profile + '</a><a href="#financials">' + t.finance + '</a><a href="#global-network">' + t.network + '</a><a href="' + marketUrl + '">' + t.markets + '</a><a href="#publicSources">' + t.sources + '</a><a class="desk-entry" href="#assistant">✦ ' + t.desk + '</a><a class="control-entry" href="/gnk-asg/admin/">' + t.control + '</a>';
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', render) : render();
  window.addEventListener('gnk-language-change', render);
})();
