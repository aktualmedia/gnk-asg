(() => {
  'use strict';

  const CONFIG = {
    whatsapp: 'https://wa.me/385915358365',
    whatsappLabelHr: 'WhatsApp +385 91 535 8365',
    whatsappLabelEn: 'WhatsApp +385 91 535 8365',
    contact: '/kontakt/',
    authorPosts: '/insights-hr/',
    legal: '/legal.html',
    mailInfo: 'mailto:info@gnk-asg.hr?subject=GNK%20ASG%20upit',
    mailIt: 'mailto:it@gnk-asg.hr?subject=Upit%20za%20IT%20asistenta'
  };

  function isEn() {
    return /\/en\/?$/.test(location.pathname) || /\/en\//.test(location.pathname) || (window.GNK_LANG && window.GNK_LANG.get && window.GNK_LANG.get() === 'en');
  }

  function clean(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function message() {
    const input = document.querySelector('#aiMini input');
    const query = clean(input && input.value);
    return isEn()
      ? 'Hello, I am contacting GNK ASG d.o.o.' + (query ? ' regarding: ' + query : '.')
      : 'Pozdrav, kontaktiram GNK ASG d.o.o.' + (query ? ' u vezi teme: ' + query : '.');
  }

  function waHref() {
    return CONFIG.whatsapp + '?text=' + encodeURIComponent(message());
  }

  function labels() {
    return isEn() ? {
      title: 'Communication options',
      note: 'For official, legal, financial, media or confidential matters use the contact form or WhatsApp. The public AI helper cannot bind the company.',
      whatsapp: CONFIG.whatsappLabelEn,
      contact: 'Contact form',
      mailIt: 'E-mail IT assistant',
      mailInfo: 'E-mail info',
      posts: 'Author posts',
      status: 'Data status',
      legal: 'Legal',
      chips: ['WhatsApp', 'Contact', 'E-mail', 'Author posts', 'Data status', 'Official inquiry']
    } : {
      title: 'Opcije komunikacije',
      note: 'Za službene, pravne, financijske, medijske ili povjerljive teme koristite kontakt formu ili WhatsApp. Javni AI pomoćnik ne preuzima obveze u ime društva.',
      whatsapp: CONFIG.whatsappLabelHr,
      contact: 'Kontakt forma',
      mailIt: 'E-mail IT asistentu',
      mailInfo: 'E-mail info',
      posts: 'Objave autora',
      status: 'Status podataka',
      legal: 'Legal',
      chips: ['WhatsApp', 'Kontakt', 'E-mail', 'Objave autora', 'Status podataka', 'Službeni upit']
    };
  }

  function patchLinks() {
    const l = labels();
    const wa = document.getElementById('aiWhatsAppLink');
    if (wa) {
      wa.href = waHref();
      wa.textContent = l.whatsapp;
      wa.setAttribute('target', '_blank');
      wa.setAttribute('rel', 'noopener nofollow');
    }
    const panel = document.getElementById('aiMini');
    if (!panel) return;
    const input = panel.querySelector('input');
    if (input && input.dataset.waUpgrade !== '1') {
      input.dataset.waUpgrade = '1';
      input.addEventListener('input', () => {
        const link = document.getElementById('aiWhatsAppLink');
        if (link) link.href = waHref();
      });
    }
  }

  function addChips(panel) {
    const chipBox = panel.querySelector('.ai-mini-chips');
    if (!chipBox || chipBox.dataset.contactUpgrade === '1') return;
    chipBox.dataset.contactUpgrade = '1';
    labels().chips.forEach(label => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.className = 'ai-contact-chip';
      button.addEventListener('click', () => {
        const input = panel.querySelector('input');
        if (input) input.value = label;
        const form = panel.querySelector('form');
        if (form) form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        patchLinks();
      });
      chipBox.appendChild(button);
    });
  }

  function addContactPanel(panel) {
    if (panel.querySelector('.ai-contact-upgrade')) return;
    const l = labels();
    const box = document.createElement('div');
    box.className = 'ai-contact-upgrade';
    box.innerHTML = [
      '<strong>' + l.title + '</strong>',
      '<div class="ai-contact-buttons">',
      '<a id="aiUpgradeWa" href="' + waHref() + '" target="_blank" rel="noopener nofollow">' + l.whatsapp + '</a>',
      '<a href="' + CONFIG.contact + '">' + l.contact + '</a>',
      '<a href="' + CONFIG.mailIt + '">' + l.mailIt + '</a>',
      '<a href="' + CONFIG.mailInfo + '">' + l.mailInfo + '</a>',
      '<a href="' + CONFIG.authorPosts + '">' + l.posts + '</a>',
      '<a href="' + CONFIG.legal + '">' + l.legal + '</a>',
      '</div>',
      '<p>' + l.note + '</p>'
    ].join('');
    const body = panel.querySelector('.ai-mini-body') || panel;
    body.appendChild(box);
  }

  function addStyles() {
    if (document.getElementById('aiCommunicationUpgradeStyle')) return;
    const style = document.createElement('style');
    style.id = 'aiCommunicationUpgradeStyle';
    style.textContent = `
      .ai-contact-upgrade{margin-top:12px;padding:12px;border-radius:18px;background:rgba(255,250,240,.92);border:1px solid rgba(173,125,32,.35);color:#14233d}
      .ai-contact-upgrade strong{display:block;margin-bottom:8px;color:#07162d}
      .ai-contact-upgrade p{margin:8px 0 0;font-size:12px;line-height:1.45;color:#52647b}
      .ai-contact-buttons{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
      .ai-contact-buttons a{display:block;text-align:center;text-decoration:none;border-radius:999px;padding:9px 10px;background:#07162d;color:#fff;font-weight:800;font-size:12px}
      .ai-contact-buttons a:nth-child(1){background:#166534}
      .ai-contact-buttons a:nth-child(2){background:#143b6d}
      .ai-contact-chip{border-color:rgba(22,101,52,.35)!important;background:#ecfdf5!important;color:#14532d!important}
      @media(max-width:640px){.ai-contact-buttons{grid-template-columns:1fr}.ai-contact-upgrade{position:sticky;bottom:0}}
    `;
    document.head.appendChild(style);
  }

  function upgrade() {
    const panel = document.getElementById('aiMini');
    if (!panel) return;
    addStyles();
    patchLinks();
    addChips(panel);
    addContactPanel(panel);
    const upWa = document.getElementById('aiUpgradeWa');
    if (upWa) upWa.href = waHref();
  }

  function init() {
    upgrade();
    const observer = new MutationObserver(upgrade);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('gnk-language-change', () => setTimeout(upgrade, 50));
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
