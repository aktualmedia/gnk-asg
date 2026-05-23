(() => {
  'use strict';
  const isEn = () => /\/en\/?$/.test(location.pathname) || (window.GNK_LANG && window.GNK_LANG.get && window.GNK_LANG.get() === 'en');
  const esc = value => String(value || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const copy = {
    hr: {eyebrow:'Provjerljivi javni podatci', title:'Javni izvori i službeni registri', intro:'Izravan pristup službenim registrima, financijskim objavama, pravima intelektualnog vlasništva i javnim IT izvorima. Podatci iz registara provjeravaju se na izvornom službenom mjestu.', oib:'OIB', mbs:'MBS', open:'OTVORI IZVOR →', live:'AUTOMATSKI IZVOR', link:'SLUŽBENA POVEZNICA', ecb:'ECB referentni tečajevi', updates:'Službeni IT i sigurnosni izvori', unavailable:'Ažurirani otvoreni podatci bit će prikazani nakon satnog osvježavanja.', note:'Registre koji nemaju javno otvoreno podatkovno sučelje portal ne kopira automatski; vodi izravno na službenu pretragu radi točne i aktualne provjere.', page:'Otvori centar registara'},
    en: {eyebrow:'Verifiable public data', title:'Public Sources and Official Registers', intro:'Direct access to official company registers, financial disclosures, intellectual-property records and public IT sources. Register information is verified at its official source.', oib:'Tax ID', mbs:'MBS', open:'OPEN SOURCE →', live:'AUTOMATED SOURCE', link:'OFFICIAL LINK', ecb:'ECB reference rates', updates:'Official IT and security sources', unavailable:'Updated open data will appear after the hourly refresh.', note:'Registers without an open public data interface are not automatically copied by the portal; the portal links directly to official search facilities for accurate, current verification.', page:'Open registers centre'}
  };
  const t = () => copy[isEn() ? 'en' : 'hr'];
  let directory = null;
  let openData = null;
  function sourceCard(item) {
    const en = isEn();
    return '<article class="source-card"><span class="source-type">' + esc(en ? item.type_en : item.type_hr) + '</span><h4>' + esc(item.name) + '</h4><p>' + esc(en ? item.summary_en : item.summary_hr) + '</p><div class="source-lookup">' + esc(en ? item.lookup_en : item.lookup_hr) + '</div><div class="source-action"><a target="_blank" rel="noopener" href="' + esc(item.url) + '">' + t().open + '</a><span class="source-badge ' + (item.automated ? 'live' : 'link') + '">' + (item.automated ? t().live : t().link) + '</span></div></article>';
  }
  function livePanel() {
    if (!openData) return '<p class="official-note">' + esc(t().unavailable) + '</p>';
    const rate = openData.ecb && openData.ecb.usd_per_eur ? openData.ecb.usd_per_eur : '—';
    const date = openData.ecb && openData.ecb.date ? openData.ecb.date : '—';
    const updates = Array.isArray(openData.official_updates) ? openData.official_updates.length : 0;
    return '<div class="live-source-panel"><article class="live-source-box"><small>' + t().ecb + '</small><strong>1 EUR = ' + esc(rate) + ' USD</strong><p>' + (isEn() ? 'Reference date: ' : 'Referentni datum: ') + esc(date) + '</p></article><article class="live-source-box"><small>' + t().updates + '</small><strong>' + updates + (isEn() ? ' current entries' : ' aktualnih objava') + '</strong><p>' + (isEn() ? 'Collected only from publicly accessible official-source searches.' : 'Prikupljeno samo iz javno dostupnih pretraga službenih izvora.') + '</p></article></div>';
  }
  function render() {
    if (!directory) return;
    const target = document.getElementById('publicSources');
    if (!target) return;
    target.innerHTML = '<div class="container"><div class="section-head"><div><p class="eyebrow">' + t().eyebrow + '</p><h2>' + t().title + '</h2></div><p>' + t().intro + '</p></div><div class="sources-toolbar"><div><strong>' + esc(directory.entity.name) + '</strong><span>' + (isEn() ? 'Official verification identifiers' : 'Identifikatori za službenu provjeru') + '</span></div><div class="sources-entity"><b>' + t().oib + ': ' + esc(directory.entity.oib) + '</b><b>' + t().mbs + ': ' + esc(directory.entity.mbs) + '</b></div></div>' + directory.groups.map(group => '<div class="sources-group"><h3>' + esc(isEn() ? group.title_en : group.title_hr) + '</h3><div class="sources-grid">' + group.items.map(sourceCard).join('') + '</div></div>').join('') + livePanel() + '<div class="official-note">' + t().note + ' <a href="registri/">' + t().page + ' →</a></div></div>';
  }
  async function init() {
    const documents = document.getElementById('dokumenti');
    if (!documents) return;
    const section = document.createElement('section');
    section.id = 'publicSources'; section.className = 'public-sources';
    documents.insertAdjacentElement('beforebegin', section);
    try {
      const results = await Promise.all([
        fetch('data/public_sources.json?v=' + Date.now(), {cache:'no-store'}),
        fetch('data/official_open_data.json?v=' + Date.now(), {cache:'no-store'})
      ]);
      if (results[0].ok) directory = await results[0].json();
      if (results[1].ok) openData = await results[1].json();
    } catch (error) {}
    render();
    window.addEventListener('gnk-language-change', render);
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
