(() => {
  'use strict';
  let network = null;
  const nodeGroups = () => Array.from(document.querySelectorAll('#networkSvg .network-node'));
  const list = () => network ? [network.center].concat(network.nodes || []) : [];
  function annotate() { nodeGroups().forEach((group, i) => { if (list()[i]) group.dataset.nodeId = list()[i].id; }); }
  function reveal(id) {
    const all = document.querySelector('#global-network [data-filter="all"]');
    if (all && !all.classList.contains('active')) all.click();
    setTimeout(() => {
      annotate();
      const group = nodeGroups().find(item => item.dataset.nodeId === id);
      if (group) group.dispatchEvent(new MouseEvent('click', {bubbles:true}));
      document.dispatchEvent(new CustomEvent('gnk-location-selected', {detail:{id}}));
      const canvas = document.querySelector('#global-network .network-canvas');
      const globe = document.querySelector('#global-network .globe-panel');
      const target = document.querySelector('[data-globe-mode="3d"]')?.classList.contains('active') ? globe : canvas;
      if (target) { target.classList.add('located'); setTimeout(() => target.classList.remove('located'), 1600); }
    }, 35);
  }
  function bind() {
    const go = document.getElementById('networkEntityGo');
    const select = document.getElementById('networkEntitySelect');
    const boulder = document.querySelector('#networkCommandDeck [data-net-shortcut="boulder"]');
    if (!go || !select || go.dataset.keepView) return false;
    go.dataset.keepView = '1';
    go.addEventListener('click', event => { event.preventDefault(); event.stopImmediatePropagation(); reveal(select.value); }, true);
    select.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); reveal(select.value); } });
    if (boulder && !boulder.dataset.keepView) {
      boulder.dataset.keepView = '1';
      boulder.addEventListener('click', event => { event.preventDefault(); event.stopImmediatePropagation(); reveal('boulder'); }, true);
    }
    return true;
  }
  async function init() {
    try { const response = await fetch('data/group_network.json?v=' + Date.now(), {cache:'no-store'}); if (response.ok) network = await response.json(); } catch (_) {}
    let count = 0; const timer = setInterval(() => { if (bind() || ++count > 120) clearInterval(timer); }, 70);
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
