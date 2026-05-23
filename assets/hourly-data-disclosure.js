(() => {
  'use strict';
  const isEnglish = () => /\/en\/?$/.test(location.pathname) || (window.GNK_LANG && window.GNK_LANG.get && window.GNK_LANG.get() === 'en');
  function revise() {
    const section = document.getElementById('publicSources');
    if (!section) return;
    const expected = isEnglish() ? 'Refreshes every 5 minutes' : 'Osvježava se svakih 5 minuta';
    const replacement = isEnglish() ? 'Public data generated hourly' : 'Javni podatci generiraju se satno';
    section.querySelectorAll('strong, span, p').forEach(node => {
      if (node.textContent.trim() === expected) node.textContent = replacement;
    });
  }
  function init() {
    revise();
    const observer = new MutationObserver(revise);
    observer.observe(document.body, {childList:true, subtree:true});
    window.addEventListener('gnk-language-change', revise);
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
