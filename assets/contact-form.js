(() => {
  'use strict';
  const FALLBACK_EMAIL = 'info@gnk-asg.hr';
  const WHATSAPP = 'https://wa.me/385916104398';
  const API_ENDPOINT = '/api/contact';

  function value(form, name) {
    const el = form.querySelector('[name="' + name + '"]');
    return el ? String(el.value || '').trim() : '';
  }

  function status(form, text, type) {
    const box = form.querySelector('.contact-form-status');
    if (!box) return;
    box.textContent = text;
    box.className = 'contact-form-status ' + (type || '');
  }

  function buildText(form) {
    return 'Ime/Naziv: ' + value(form, 'name') + '\n' +
      'E-mail: ' + value(form, 'email') + '\n' +
      'Telefon: ' + value(form, 'phone') + '\n' +
      'Društvo: ' + value(form, 'company') + '\n' +
      'Vrsta upita: ' + value(form, 'request_type') + '\n' +
      'Preferirani kanal: ' + value(form, 'preferred_channel') + '\n' +
      'Tema: ' + value(form, 'topic') + '\n\n' +
      value(form, 'message');
  }

  function payload(form) {
    return {
      name: value(form, 'name'),
      email: value(form, 'email'),
      phone: value(form, 'phone'),
      company: value(form, 'company'),
      request_type: value(form, 'request_type') || 'opci_upit',
      preferred_channel: value(form, 'preferred_channel') || 'email',
      topic: value(form, 'topic'),
      message: value(form, 'message'),
      privacy_consent: !!form.querySelector('[name="privacy_consent"]:checked')
    };
  }

  function updateLinks(form) {
    const subject = encodeURIComponent('GNK ASG kontakt: ' + value(form, 'topic'));
    const body = encodeURIComponent(buildText(form));
    const mail = form.querySelector('[data-mail-fallback]');
    if (mail) mail.href = 'mailto:' + FALLBACK_EMAIL + '?subject=' + subject + '&body=' + body;
    const wa = form.querySelector('[data-whatsapp-fallback]');
    if (wa) wa.href = WHATSAPP + '?text=' + encodeURIComponent('Pozdrav, kontaktiram GNK ASG d.o.o. u vezi teme: ' + value(form, 'topic') + '\n\n' + value(form, 'message'));
  }

  async function submitToApi(form) {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload(form))
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'api_unavailable');
    }
    return data;
  }

  function init() {
    document.querySelectorAll('[data-gnk-contact-form]').forEach(form => {
      if (form.dataset.ready === '1') return;
      form.dataset.ready = '1';
      form.addEventListener('input', () => updateLinks(form));
      form.addEventListener('change', () => updateLinks(form));
      form.addEventListener('submit', async event => {
        event.preventDefault();
        if (!value(form, 'name') || !value(form, 'email') || !value(form, 'topic') || !value(form, 'message') || !form.querySelector('[name="privacy_consent"]:checked')) {
          status(form, 'Molimo popunite obvezna polja i označite privolu za obradu upita.', 'error');
          return;
        }
        updateLinks(form);
        status(form, 'Šaljem upit kroz zaštićeni kontakt endpoint...', 'pending');
        try {
          const data = await submitToApi(form);
          status(form, 'Upit je zaprimljen. Oznaka upita: ' + data.id + '. Za osjetljive teme odgovor daje ovlaštena osoba nakon provjere.', 'ok');
          form.reset();
          updateLinks(form);
        } catch (error) {
          status(form, 'Server endpoint trenutačno nije dostupan. Upit možete poslati kroz e-mail ili WhatsApp gumb ispod forme.', 'error');
        }
      });
      updateLinks(form);
    });
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
