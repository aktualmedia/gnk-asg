(() => {
  'use strict';
  const state = { network: null };
  const en = () => document.documentElement.lang === 'en' || /\/en\/?$/.test(location.pathname) || (window.GNK_LANG && window.GNK_LANG.get && window.GNK_LANG.get() === 'en');
  const text = () => en() ? {
    eyebrow: 'GNK DINAMO Ltd. Group · Visual overview',
    title: 'Global network in one branded frame',
    body: 'This static corporate visual provides orientation between the interactive 2D network and selected-location modules. Counts below are read directly from the public network dataset currently displayed by the portal.',
    imageAlt: 'GNK ASG corporate visual overview of the international group network',
    existing: 'Displayed existing companies',
    planned: 'Planned positions 2026',
    total: 'Displayed positions after expansion',
    note: 'Conceptual visual overview. Geographic verification and location-specific context are provided by the interactive map and official source links below.'
  } : {
    eyebrow: 'GNK DINAMO Ltd. Group · Vizualni pregled',
    title: 'Globalna mreža u jednom brendiranom kadru',
    body: 'Ovaj statični korporativni vizual služi za orijentaciju između interaktivne 2D mreže i modula odabrane lokacije. Brojčani prikaz u nastavku čita se izravno iz javnog podatkovnog skupa mreže koji portal prikazuje.',
    imageAlt: 'GNK ASG korporativni vizualni pregled međunarodne mreže grupe',
    existing: 'Prikazana postojeća društva',
    planned: 'Planirane pozicije 2026.',
    total: 'Prikazane pozicije nakon širenja',
    note: 'Konceptualni vizualni pregled. Zemljopisna provjera i kontekst pojedine lokacije dostupni su kroz interaktivnu kartu i poveznice prema izvorima u nastavku.'
  };
  function totals() {
    const nodes = state.network?.nodes || [];
    const existing = nodes.filter(item => item.status === 'active').length + (state.network?.center ? 1 : 0);
    const planned = nodes.filter(item => item.status === 'planned').length;
    return { existing, planned, total: existing + planned };
  }
  function findDock() {
    return window.GNK_LOCATION_CONTEXT?.dock?.() || document.querySelector('#global-network .location-context-dock');
  }
  function render() {
    const dock = findDock();
    if (!dock || !state.network) return false;
    let panel = document.getElementById('networkOverviewVisual');
    if (!panel) {
      panel = document.createElement('section');
      panel.id = 'networkOverviewVisual';
      panel.className = 'network-overview-visual';
      dock.prepend(panel);
    }
    const T = text();
    const count = totals();
    panel.innerHTML = `<figure class="network-overview-image"><img src="assets/gnk-asg-social-card.png" loading="lazy" alt="${T.imageAlt}"></figure><div class="network-overview-copy"><small>${T.eyebrow}</small><h3>${T.title}</h3><p>${T.body}</p><div class="network-overview-kpis"><div><strong>${count.existing}</strong><span>${T.existing}</span></div><div><strong>+${count.planned}</strong><span>${T.planned}</span></div><div><strong>${count.total}</strong><span>${T.total}</span></div></div><p class="network-overview-note">${T.note}</p></div>`;
    return true;
  }
  async function init() {
    try {
      const response = await fetch('data/group_network.json?v=' + Date.now(), { cache: 'no-store' });
      if (!response.ok) return;
      state.network = await response.json();
      let tries = 0;
      const timer = setInterval(() => {
        if (render() || ++tries > 180) clearInterval(timer);
      }, 60);
      window.addEventListener('gnk-language-change', render);
    } catch (_) {}
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
