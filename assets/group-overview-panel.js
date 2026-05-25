(() => {
  'use strict';
  const state = { network: null, busy: false };
  const $ = id => document.getElementById(id);
  const en = () => document.documentElement.lang === 'en' || /\/en\/?$/.test(location.pathname) || (window.GNK_LANG && window.GNK_LANG.get && window.GNK_LANG.get() === 'en');
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const T = () => en() ? {
    eyebrow:'GNK DINAMO Ltd. Group · Static overview',
    title:'Global network: 33 existing companies and +12 planned locations',
    body:'The static infographic below complements the interactive 2D and 3D view. Numbering and counts are generated from the same public dataset displayed in the network module.',
    alt:'Static global network infographic: 33 existing group companies and 12 planned expansion locations during 2026',
    existing:'Existing companies', planned:'Planned expansion 2026', total:'After expansion', governance:'Director / authorised representative / group UBO',
    currentList:'01-33 · Existing companies / positions', plannedList:'E01-E12 · Planned expansion 2026',
    dataNote:'Full local registered names are shown only where contained in the portal dataset. Official registration status is verified in the relevant public register.',
    network:'2D / 3D network', registries:'Public registers', markets:'Live markets', news:'News', documents:'Documents', download:'Download static image as PDF', preparing:'Preparing PDF…', failed:'PDF unavailable',
    share:'Share this overview', central:'Central headquarters', company:'Group company', plan:'Planned location'
  } : {
    eyebrow:'GNK DINAMO Ltd. Group · Statični pregled',
    title:'Globalna mreža: 33 postojeća društva i +12 planiranih lokacija',
    body:'Statična infografika u nastavku nadopunjuje interaktivni 2D i 3D prikaz. Numeracija i brojke generiraju se iz istog javnog podatkovnog skupa koji koristi modul mreže.',
    alt:'Statična infografika globalne mreže: 33 postojeća društva grupe i 12 planiranih lokacija širenja tijekom 2026.',
    existing:'Postojeća društva', planned:'Planirana ekspanzija 2026.', total:'Nakon ekspanzije', governance:'Direktor / ovlašteni predstavnik / UBO grupe',
    currentList:'01-33 · Postojeća društva / pozicije grupe', plannedList:'E01-E12 · Planirana ekspanzija 2026.',
    dataNote:'Puni lokalni registracijski nazivi prikazuju se samo gdje postoje u podatkovnoj bazi portala. Službeni registracijski status potvrđuje se u mjerodavnom javnom registru.',
    network:'Mreža tvrtki · 2D / 3D', registries:'Javni registri', markets:'Tržišta uživo', news:'Vijesti', documents:'Dokumenti', download:'Preuzmi statičnu sliku u PDF-u', preparing:'Pripremam PDF…', failed:'PDF nije dostupan',
    share:'Podijeli pregled', central:'Središnje sjedište', company:'Društvo grupe', plan:'Planirana lokacija'
  };
  function activeRows() { return [state.network.center].concat((state.network.nodes || []).filter(item => item.status === 'active')); }
  function plannedRows() { return (state.network.nodes || []).filter(item => item.status === 'planned'); }
  function name(item) { return item.id === 'boulder' ? item.name : (en() ? item.name_en : item.name_hr); }
  function place(item) { return item.id === 'boulder' ? item.place : (en() ? item.place_en : item.place_hr); }
  function row(item, index, planned) {
    const number = planned ? 'E' + String(index + 1).padStart(2,'0') : String(index + 1).padStart(2,'0');
    const cls = item.id === 'boulder' ? ' hq' : planned ? ' planned' : '';
    return `<div class="network-overview-row${cls}"><b>${number}</b><div><strong>${esc(name(item))}</strong><span>${esc(place(item))} · ${esc(item.region || '')}</span></div></div>`;
  }
  function shareLinks() {
    const t = T(), url = encodeURIComponent(location.origin + location.pathname + '#networkOverviewVisual'), title = encodeURIComponent('GNK DINAMO Ltd. - ' + t.title);
    return `<div class="network-overview-share"><strong>${t.share}</strong><a target="_blank" rel="noopener" href="https://www.linkedin.com/sharing/share-offsite/?url=${url}">LinkedIn</a><a target="_blank" rel="noopener" href="https://wa.me/?text=${title}%20${url}">WhatsApp</a><a href="mailto:?subject=${title}&body=${title}%0A${url}">E-mail</a></div>`;
  }
  function render() {
    const shell = document.querySelector('#global-network .network-shell');
    const layout = shell && shell.querySelector('.network-layout');
    if (!shell || !layout || !state.network) return false;
    let panel = $('networkOverviewVisual');
    if (!panel) {
      panel = document.createElement('section'); panel.id = 'networkOverviewVisual'; panel.className = 'network-overview-visual';
      layout.insertAdjacentElement('afterend', panel);
    } else if (panel.previousElementSibling !== layout) {
      layout.insertAdjacentElement('afterend', panel);
    }
    const t = T(), existing = activeRows(), planned = plannedRows(), count = state.network.counts || {};
    const regLink = en() ? 'en/registries/' : 'registri/';
    panel.innerHTML = `<header class="network-overview-head"><div><small>${t.eyebrow}</small><h3>${t.title}</h3><p>${t.body}</p></div><aside><span>${t.governance}</span><strong>Nermin Sefić</strong></aside></header><div class="network-overview-kpis"><div><strong>${count.existing_total || existing.length}</strong><span>${t.existing}</span></div><div class="planned"><strong>+${count.planned_2026 || planned.length}</strong><span>${t.planned}</span></div><div><strong>${count.expanded_total || (existing.length + planned.length)}</strong><span>${t.total}</span></div></div><figure class="network-overview-image"><img src="assets/gnk-global-static-overview-accurate.svg?v=20260525-static-network02" loading="lazy" decoding="async" alt="${esc(t.alt)}"></figure><nav class="network-overview-actions"><button class="primary" type="button" id="networkOverviewPdf">↓ ${t.download}</button><a href="#global-network">${t.network}</a><a href="${regLink}">${t.registries}</a><a href="#digital-assets">${t.markets}</a><a href="#news">${t.news}</a><a href="#dokumenti">${t.documents}</a></nav><div class="network-overview-lists"><section><h4>${t.currentList}</h4><div class="network-overview-existing">${existing.map((item, i) => row(item, i, false)).join('')}</div></section><section><h4>${t.plannedList}</h4><div class="network-overview-planned">${planned.map((item, i) => row(item, i, true)).join('')}</div></section></div><p class="network-overview-note">${t.dataNote}</p>${shareLinks()}`;
    $('networkOverviewPdf')?.addEventListener('click', () => downloadPdf($('networkOverviewPdf')));
    return true;
  }
  function bytes(value) { return new TextEncoder().encode(value); }
  function join(parts) { const n = parts.reduce((a,p) => a + p.length, 0), out = new Uint8Array(n); let o = 0; parts.forEach(p => { out.set(p,o); o += p.length; }); return out; }
  function pdfFromJpeg(dataUrl, width, height) {
    const binary = atob(dataUrl.split(',')[1]), image = new Uint8Array(binary.length); for (let i=0;i<binary.length;i++) image[i] = binary.charCodeAt(i);
    const pw='841.89', ph='595.28', stream=`q\n${pw} 0 0 ${ph} 0 0 cm\n/Im0 Do\nQ\n`;
    const objects=[null,bytes('<< /Type /Catalog /Pages 2 0 R >>'),bytes('<< /Type /Pages /Kids [3 0 R] /Count 1 >>'),bytes(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw} ${ph}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`),join([bytes(`<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.length} >>\nstream\n`),image,bytes('\nendstream')]),bytes(`<< /Length ${stream.length} >>\nstream\n${stream}endstream`)];
    const parts=[bytes('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n')], offsets=[0]; let length=parts[0].length;
    for(let i=1;i<objects.length;i++){offsets[i]=length; const p=join([bytes(`${i} 0 obj\n`),objects[i],bytes('\nendobj\n')]); parts.push(p); length+=p.length;}
    let table=`xref\n0 ${objects.length}\n0000000000 65535 f \n`; for(let i=1;i<objects.length;i++) table+=`${String(offsets[i]).padStart(10,'0')} 00000 n \n`;
    parts.push(bytes(`${table}trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${length}\n%%EOF`)); return new Blob([join(parts)], {type:'application/pdf'});
  }
  async function downloadPdf(button) {
    if (state.busy) return; state.busy = true; const t=T(), old=button.textContent; button.textContent=t.preparing; button.disabled=true;
    try {
      const svg = await fetch('assets/gnk-global-static-overview-accurate.svg?v=' + Date.now(), {cache:'no-store'}).then(response => response.text());
      const uri = URL.createObjectURL(new Blob([svg], {type:'image/svg+xml'})), image = new Image();
      await new Promise((resolve,reject) => { image.onload=resolve; image.onerror=reject; image.src=uri; });
      const canvas=document.createElement('canvas'); canvas.width=1600; canvas.height=980; canvas.getContext('2d').drawImage(image,0,0,1600,980); URL.revokeObjectURL(uri);
      const file = pdfFromJpeg(canvas.toDataURL('image/jpeg',.96),1600,980), link=document.createElement('a'); link.href=URL.createObjectURL(file); link.download='GNK_DINAMO_Globalna_Mreza_33_postojeca_12_planirano_2026.pdf'; link.click(); setTimeout(() => URL.revokeObjectURL(link.href),1200);
    } catch (_) { button.textContent=t.failed; setTimeout(() => { button.textContent=old; }, 2200); state.busy=false; button.disabled=false; return; }
    button.textContent=old; button.disabled=false; state.busy=false;
  }
  async function init() {
    try { const response = await fetch('data/group_network.json?v=' + Date.now(), {cache:'no-store'}); if (!response.ok) return; state.network = await response.json(); } catch (_) { return; }
    let tries=0; const timer=setInterval(() => { if (render() || ++tries>180) clearInterval(timer); }, 60);
    window.addEventListener('gnk-language-change', render);
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();