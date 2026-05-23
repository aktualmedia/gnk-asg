(() => {
  'use strict';
  const isEnglishPage = /\/en\/?$/.test(window.location.pathname);
  const current = isEnglishPage ? 'en' : 'hr';
  try { localStorage.setItem('gnk_asg_language', current); } catch (error) {}
  function wire() {
    const buttons = document.querySelectorAll('.language-switch [data-lang]');
    if (!buttons.length) return false;
    buttons.forEach(button => {
      button.classList.toggle('active', button.dataset.lang === current);
      button.onclick = () => {
        const target = button.dataset.lang;
        try { localStorage.setItem('gnk_asg_language', target); } catch (error) {}
        if (target === current) return;
        const anchor = window.location.hash || '';
        window.location.href = target === 'en' ? '/gnk-asg/en/' + anchor : '/gnk-asg/' + anchor;
      };
    });
    return true;
  }
  if (!wire()) {
    const timer = setInterval(() => { if (wire()) clearInterval(timer); }, 80);
    setTimeout(() => clearInterval(timer), 5000);
  }
})();
