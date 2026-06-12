(() => {
  'use strict';
  const FALLBACK_EMAIL = 'info@gnk-asg.hr';
  const WHATSAPP = 'https://wa.me/385916104398';
  function value(form, name) { const el = form.querySelector('[name="' + name + '"]'); return el ? String(el.value || '').trim() : ''; }
  function status(form, text, type) { const box = form.querySelector('.contact-form-status'); if (!box) return; box.textContent = text; box.className = 'contact-form-status ' + (type || ''); }
  function buildText(form) { return 'Ime/Naziv: ' + value(form, 'name') + '
' + 'E-mail: ' + value(form, 'email') + '
' + 'Telefon: ' + value(form, 'phone') + '
' + 'Vrsta upita: ' + value(form, 'request_type') + '
' + 'Tema: ' + value(form, 'topic') + '

' + value(form, 'message'); }
  function updateLinks(form) {
    const subject = encodeURIComponent('GNK ASG kontakt: ' + value(form, 'topic'));
    const body = encodeURIComponent(buildText(form));
    const mail = form.querySelector('[data-mail-fallback]'); if (mail) mail.href = 'mailto:' + FALLBACK_EMAIL + '?subject=' + subject + '&body=' + body;
    const wa = form.querySelector('[data-whatsapp-fallback]'); if (wa) wa.href = WHATSAPP + '?text=' + encodeURIComponent('Pozdrav, kontaktiram GNK ASG d.o.o. u vezi teme: ' + value(form, 'topic') + '

' + value(form, 'message'));
  }
  function init() {
    document.querySelectorAll('[data-gnk-contact-form]').forEach(form => {
      if (form.dataset.ready === '1') return; form.dataset.ready = '1';
      form.addEventListener('input', () => updateLinks(form)); form.addEventListener('change', () => updateLinks(form));
      form.addEventListener('submit', event => {
        event.preventDefault();
        if (!value(form, 'name') || !value(form, 'email') || !value(form, 'topic') || !value(form, 'message') || !form.querySelector('[name="privacy_consent"]:checked')) { status(form, 'Molimo popunite obvezna polja i označite privolu za obradu upita.', 'error'); return; }
        updateLinks(form); status(form, 'Forma je pripremljena. Do aktivacije server endpointa pošaljite upit kroz e-mail ili WhatsApp gumb ispod forme.', 'ok');
      });
      updateLinks(form);
    });
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
