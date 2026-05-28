(function () {
  'use strict';

  var DOCS = {
    audit: '/documents/GNK_ASG_Izvjesce_neovisnog_revizora_i_financijski_izvjestaji_2025.pdf',
    group: '/documents/GNK_DINAMO_Ltd_Colorado_Filing_Consolidated_Financial_Statements_2025.pdf'
  };
  var availability = { audit: false, group: false };

  function english() {
    return document.documentElement.lang === 'en' || /\/en\/?$/.test(window.location.pathname);
  }

  function createStrip(data, id, enabled) {
    var item = document.createElement('div');
    item.className = 'financial-document-strip';
    item.id = id;

    var copy = document.createElement('div');
    copy.className = 'financial-document-copy';
    var mark = document.createElement('span');
    mark.className = 'financial-document-mark';
    mark.textContent = 'PDF';
    var text = document.createElement('div');
    text.className = 'financial-document-text';
    var label = document.createElement('span');
    label.className = 'financial-document-label';
    label.textContent = data.label;
    var title = document.createElement('strong');
    title.className = 'financial-document-title';
    title.textContent = data.title;
    var desc = document.createElement('span');
    desc.className = 'financial-document-desc';
    desc.textContent = data.description;
    text.appendChild(label); text.appendChild(title); text.appendChild(desc);
    copy.appendChild(mark); copy.appendChild(text);
    item.appendChild(copy);

    if (enabled) {
      var link = document.createElement('a');
      link.className = 'financial-document-action';
      link.href = data.file;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = data.action + ' \u2193';
      item.appendChild(link);
    }
    return item;
  }

  function addCardLink(card, href, label) {
    if (!card || card.querySelector('.document-download-action')) return;
    var link = document.createElement('a');
    link.className = 'document-download-action';
    link.href = href;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = label + ' \u2192';
    card.appendChild(link);
  }

  function content(en) {
    return {
      audit: en ? {
        label: 'Independent audit', title: 'Independent Auditor Report and Financial Statements',
        description: 'With notes including consolidated financial data of GNK DINAMO Ltd. Group.', action: 'Download PDF', file: DOCS.audit
      } : {
        label: 'Neovisna revizija', title: 'Izvješće neovisnog revizora i financijski izvještaji',
        description: 'S bilješkama koje uključuju konsolidirane financijske podatke GNK DINAMO Ltd. Group.', action: 'Preuzmi PDF', file: DOCS.audit
      },
      group: en ? {
        label: 'Filed in Colorado', title: 'Consolidated Financial Statements of the Group',
        description: 'Certified Colorado filing; data included in the notes to the audited GNK ASG d.o.o. financial statements.', action: 'Download PDF', file: DOCS.group
      } : {
        label: 'Filed in Colorado', title: 'Konsolidirani financijski izvještaji grupe',
        description: 'Certificirani Colorado podnesak; podatci uključeni u bilješke revidiranih financijskih izvještaja GNK ASG d.o.o.', action: 'Preuzmi PDF', file: DOCS.group
      }
    };
  }

  function render() {
    var en = english();
    var text = content(en);
    var kpis = document.querySelector('#financials .kpi-grid');
    var groupKpis = document.querySelector('#grupa .group-kpis');
    var oldAudit = document.getElementById('audit-document-strip');
    var oldGroup = document.getElementById('group-document-strip');
    if (oldAudit) oldAudit.remove();
    if (oldGroup) oldGroup.remove();

    if (kpis) kpis.parentNode.insertBefore(createStrip(text.audit, 'audit-document-strip', availability.audit), kpis.nextSibling);
    if (groupKpis) {
      var strip = createStrip(text.group, 'group-document-strip', availability.group);
      var note = document.querySelector('#grupa .gold-note');
      if (note) note.parentNode.insertBefore(strip, note.nextSibling);
      else groupKpis.parentNode.insertBefore(strip, groupKpis.nextSibling);
    }
    var docs = document.querySelectorAll('#dokumenti .doc');
    if (docs.length > 1) {
      if (availability.audit) addCardLink(docs[0], DOCS.audit, en ? 'Download PDF' : 'Preuzmi PDF');
      if (availability.group) addCardLink(docs[1], DOCS.group, en ? 'Download PDF' : 'Preuzmi PDF');
    }
  }

  function checkDocument(key) {
    return fetch(DOCS[key], { method: 'HEAD', cache: 'no-store' }).then(function (response) {
      availability[key] = response.ok && (response.headers.get('content-type') || '').indexOf('pdf') !== -1;
    }).catch(function () { availability[key] = false; });
  }

  document.addEventListener('DOMContentLoaded', function () {
    render();
    Promise.all([checkDocument('audit'), checkDocument('group')]).then(render);
  });
  window.addEventListener('gnk-language-change', render);
}());
