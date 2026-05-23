(() => {
  'use strict';
  const esc = value => String(value || '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const language = () => (window.GNK_LANG && window.GNK_LANG.get() === 'en') ? 'en' : 'hr';
  const content = {
    hr: {
      eyebrow:'Digitalna infrastruktura i poslovna rješenja', title:'Technology Services & Intelligent Systems', intro:'GNK ASG portal predstavlja tehnološki profil usmjeren na programske platforme, podatkovnu analitiku, umjetnu inteligenciju, digitalnu imovinu i sigurnu poslovnu infrastrukturu.',
      solutions:[['Platforme','Enterprise Software','Skalabilne digitalne platforme, integracije i podatkovni sustavi za međunarodne poslovne procese.'],['Intelligence','AI & Analytics','Modeli, automatizacija i analitika za obradu informacija, tržišnih pokazatelja i dokumentacije.'],['FinTech','Digital Assets','Informativni market monitoring, konverzije i podatkovni prikaz digitalne imovine.'],['Governance','Secure Operations','Sigurnost, dokumentirana transparentnost i kontrolirani javni korporativni podatci.']],
      strip:[['AI READY','Inteligentno korisničko sučelje'],['HOURLY DATA','Satno osvježavanje vijesti'],['MARKET MONITOR','BTC, zlato, nafta i USD'],['BILINGUAL','Hrvatski / English']],
      deskEyebrow:'Korporativni informacijski centar', deskTitle:'GNK ASG Intelligence Desk', deskText:'Napredniji digitalni pomoćnik za pregled javnih korporativnih pokazatelja, tehnološkog profila, tržišnih podataka i medijskih objava.',
      modes:[['corporate','Korporativno','Društvo i grupa'],['financial','Financije','FY 2025'],['technology','Tehnologija','AI i platforme'],['market','Tržišta','Digital assets']],
      capability:['Odgovori o javnim pokazateljima GNK ASG d.o.o.','Usmjeravanje prema javnim dokumentima i izvorima','Tumačenje informativnih tržišnih panela'],
      status:['Javni podatci','Dokumentirani izvori','HR / EN'], welcome:'Pozdrav. Odaberite područje ili postavite pitanje o GNK ASG-u, financijama, tehnologiji, tržištima ili objavama u medijima.',
      quick:['Prihodi 2025.','Kapital i aktiva','AI i softverske platforme','GNK ASG u medijima'], placeholder:'Postavite pitanje Intelligence Desku…', send:'POŠALJI', legal:'Odgovori su informativni i temelje se na javno prikazanim podatcima portala; nisu pravni, revizorski ni investicijski savjet.'
    },
    en: {
      eyebrow:'Digital Infrastructure and Business Solutions', title:'Technology Services & Intelligent Systems', intro:'The GNK ASG portal presents a technology profile focused on software platforms, data analytics, artificial intelligence, digital assets and secure business infrastructure.',
      solutions:[['Platforms','Enterprise Software','Scalable digital platforms, integrations and data systems for international business processes.'],['Intelligence','AI & Analytics','Models, automation and analytics for information, market indicators and document processing.'],['FinTech','Digital Assets','Informational market monitoring, conversion and digital-asset data display.'],['Governance','Secure Operations','Security, documented transparency and controlled public corporate data.']],
      strip:[['AI READY','Intelligent user interface'],['HOURLY DATA','Hourly news refresh'],['MARKET MONITOR','BTC, gold, oil and USD'],['BILINGUAL','Croatian / English']],
      deskEyebrow:'Corporate Information Centre', deskTitle:'GNK ASG Intelligence Desk', deskText:'An enhanced digital assistant for public corporate indicators, the technology profile, market data and media publications.',
      modes:[['corporate','Corporate','Company and group'],['financial','Financials','FY 2025'],['technology','Technology','AI and platforms'],['market','Markets','Digital assets']],
      capability:['Answers on public GNK ASG d.o.o. indicators','Guidance to public documents and sources','Explanation of informational market panels'],
      status:['Public data','Documented sources','HR / EN'], welcome:'Welcome. Select an area or ask about GNK ASG, financials, technology, markets or media publications.',
      quick:['2025 revenue','Capital and assets','AI and software platforms','GNK ASG in the media'], placeholder:'Ask the Intelligence Desk…', send:'SEND', legal:'Responses are informational and based on publicly displayed portal data; they are not legal, audit or investment advice.'
    }
  };
  let mode = 'corporate';
  let market = null;
  let status = null;
  function reply(query) {
    const en = language() === 'en';
    const q = query.toLowerCase();
    const source = en ? '\n\nSource: public portal sections and displayed FY 2025 data.' : '\n\nIzvor: javne sekcije portala i prikazani podatci FY 2025.';
    if (/prihod|revenue|504/.test(q)) return (en ? 'GNK ASG d.o.o. displays total revenue of EUR 504.00 million for FY 2025 in the audited company financial profile.' : 'GNK ASG d.o.o. u revidiranom financijskom profilu za FY 2025 prikazuje ukupne prihode od 504,00 mil. EUR.') + source;
    if (/kapital|aktiva|assets|equity|obvez/.test(q)) return (en ? 'As at 31 December 2025, total assets are displayed as EUR 46.40 million and capital and reserves as EUR 46.21 million, with current liabilities of EUR 184.50 thousand and no long-term liabilities.' : 'Na dan 31.12.2025. prikazana je aktiva od 46,40 mil. EUR te kapital i rezerve od 46,21 mil. EUR, uz kratkoročne obveze od 184,50 tis. EUR i bez dugoročnih obveza.') + source;
    if (/grup|dinamo|group/.test(q)) return (en ? 'The portal presents GNK DINAMO Ltd. of Boulder, Colorado as the international group framework and separately identifies the basis of the displayed consolidated FY 2025 indicators.' : 'Portal prikazuje GNK DINAMO Ltd. iz Bouldera, Colorado kao međunarodni grupni okvir te posebno navodi osnovu prikazanih konsolidiranih pokazatelja FY 2025.') + source;
    if (/medij|media|vijest|news/.test(q)) return en ? 'The GNK ASG in the Media tab monitors public online publications that mention GNK ASG or GNK DINAMO Ltd. News data are scheduled for hourly refresh and the public feed retains up to 1,000 newest items.' : 'Rubrika GNK ASG u medijima prati javne internetske objave koje spominju GNK ASG ili GNK DINAMO Ltd. Vijesti se osvježavaju svaki sat, a javni feed zadržava do 1.000 najnovijih stavki.';
    if (/bitcoin|btc|zlato|gold|naft|oil|usd|market|trži/.test(q)) {
      if (market && market.assets) {
        const a = market.assets;
        const format = (n, unit) => new Intl.NumberFormat(en ? 'en-US' : 'hr-HR', {maximumFractionDigits:2}).format(n) + ' ' + unit;
        return (en ? 'Current displayed indicative values: Bitcoin ' + format(a.btc.current,'USD/BTC') + ', gold ' + format(a.gold.current,'USD/oz') + ' and Brent oil ' + format(a.oil.current,'USD/barrel') + '. The cross-asset panel also compares USD/EUR movements.' : 'Trenutačno prikazane indikativne vrijednosti: Bitcoin ' + format(a.btc.current,'USD/BTC') + ', zlato ' + format(a.gold.current,'USD/unca') + ' i Brent nafta ' + format(a.oil.current,'USD/barel') + '. Usporedni panel prikazuje i kretanje USD/EUR.') + (en ? '\n\nInformational market display only.' : '\n\nSamo informativni tržišni prikaz.');
      }
      return en ? 'The market monitor compares Bitcoin, gold, Brent oil and USD/EUR using indicative data refreshed by the portal workflow.' : 'Market monitor uspoređuje Bitcoin, zlato, Brent naftu i USD/EUR koristeći indikativne podatke koje portal osvježava kroz workflow.';
    }
    if (/ai|umjet|software|platform|tehnolog|technology|cyber/.test(q)) return en ? 'The technology profile covers artificial intelligence, software platforms, fintech and digital assets, sports technology, cybersecurity and global innovation. A secure server endpoint may later extend this assistant beyond public-data answers.' : 'Tehnološki profil obuhvaća umjetnu inteligenciju, softverske platforme, fintech i digitalnu imovinu, sportsku tehnologiju, kibernetičku sigurnost i globalne inovacije. Siguran serverski endpoint kasnije može proširiti pomoćnika izvan odgovora temeljenih na javnim podatcima.';
    if (/dokument|document|reviz|audit|izvor|source/.test(q)) return en ? 'The Documents section identifies the independent auditor report and financial statements for GNK ASG d.o.o. for 2025, the GNK DINAMO Ltd. consolidated group report and the official corporate information source.' : 'Sekcija Dokumenti navodi izvješće neovisnog revizora i financijske izvještaje GNK ASG d.o.o. za 2025., konsolidirani grupni izvještaj GNK DINAMO Ltd. i službeni izvor korporativnih informacija.';
    return en ? 'I can explain public corporate indicators, FY 2025 financial data, the technology profile, market panels, documents or monitored media publications. Select a topic or use a more specific question.' : 'Mogu pojasniti javne korporativne pokazatelje, financijske podatke FY 2025, tehnološki profil, tržišne panele, dokumente ili praćene medijske objave. Odaberite temu ili postavite preciznije pitanje.';
  }
  function solutionsSection() {
    if (document.getElementById('solutions')) return;
    const tech = document.getElementById('technology');
    if (!tech) return;
    const section = document.createElement('section'); section.id = 'solutions'; section.className = 'solutions';
    tech.insertAdjacentElement('afterend', section); renderSolutions();
  }
  function renderSolutions() {
    const section = document.getElementById('solutions'); if (!section) return;
    const c = content[language()];
    section.innerHTML = '<div class="container"><div class="section-head"><div><p class="eyebrow">' + esc(c.eyebrow) + '</p><h2>' + esc(c.title) + '</h2></div><p>' + esc(c.intro) + '</p></div><div class="solution-grid">' + c.solutions.map(item => '<article class="solution-card"><span class="label">' + esc(item[0]) + '</span><h3>' + esc(item[1]) + '</h3><p>' + esc(item[2]) + '</p></article>').join('') + '</div><div class="solution-strip">' + c.strip.map(item => '<div><strong>' + esc(item[0]) + '</strong><span>' + esc(item[1]) + '</span></div>').join('') + '</div></div>';
  }
  function desk() {
    const original = document.getElementById('assistant'); if (!original) return;
    original.innerHTML = '<div class="container intelligence-shell"><div class="desk-panel" id="deskPanel"></div><div class="desk-console"><div class="desk-status" id="deskStatus"></div><div class="desk-transcript" id="deskTranscript"></div><div class="desk-quick" id="deskQuick"></div><form class="desk-form" id="deskForm"><input id="deskInput" autocomplete="off"><button type="submit"></button></form><div class="desk-legal" id="deskLegal"></div></div></div>';
    original.querySelector('#deskForm').addEventListener('submit', event => { event.preventDefault(); ask(original.querySelector('#deskInput').value); });
    renderDesk(true);
  }
  function renderDesk(reset) {
    const panel = document.getElementById('deskPanel'); if (!panel) return;
    const c = content[language()];
    panel.innerHTML = '<p class="eyebrow">' + esc(c.deskEyebrow) + '</p><h2>' + esc(c.deskTitle) + '</h2><p>' + esc(c.deskText) + '</p><div class="desk-modes">' + c.modes.map(item => '<button type="button" class="desk-mode ' + (item[0] === mode ? 'active' : '') + '" data-mode="' + item[0] + '"><strong>' + esc(item[1]) + '</strong><small>' + esc(item[2]) + '</small></button>').join('') + '</div><div class="desk-capabilities">' + c.capability.map(item => '<div>✓ ' + esc(item) + '</div>').join('') + '</div>';
    panel.querySelectorAll('.desk-mode').forEach(button => button.onclick = () => { mode = button.dataset.mode; panel.querySelectorAll('.desk-mode').forEach(b => b.classList.toggle('active', b === button)); ask(c.quick[{corporate:1,financial:0,technology:2,market:3}[mode]]); });
    document.getElementById('deskStatus').innerHTML = '<span class="online">' + esc(c.status[0]) + '</span><span>' + esc(c.status[1]) + '</span><span>' + esc(c.status[2]) + '</span>';
    document.getElementById('deskQuick').innerHTML = c.quick.map(item => '<button type="button">' + esc(item) + '</button>').join('');
    document.querySelectorAll('#deskQuick button').forEach(button => button.onclick = () => ask(button.textContent));
    document.getElementById('deskInput').placeholder = c.placeholder;
    document.querySelector('#deskForm button').textContent = c.send;
    document.getElementById('deskLegal').textContent = c.legal;
    if (reset || !document.querySelector('.desk-message')) document.getElementById('deskTranscript').innerHTML = '<div class="desk-message bot">' + esc(c.welcome) + '</div>';
  }
  function ask(question) {
    if (!String(question || '').trim()) return;
    const transcript = document.getElementById('deskTranscript'); if (!transcript) return;
    transcript.insertAdjacentHTML('beforeend','<div class="desk-message user">' + esc(question) + '</div><div class="desk-message bot">' + esc(reply(question)) + '</div>');
    transcript.scrollTop = transcript.scrollHeight;
    document.getElementById('deskInput').value = '';
  }
  async function loadData() {
    try { const response = await fetch('data/macro_market.json?v=' + Date.now(), {cache:'no-store'}); if (response.ok) market = await response.json(); } catch (error) {}
    try { const response = await fetch('data/update_status.json?v=' + Date.now(), {cache:'no-store'}); if (response.ok) status = await response.json(); } catch (error) {}
  }
  function init() {
    solutionsSection(); desk(); loadData();
    window.addEventListener('gnk-language-change', () => { renderSolutions(); renderDesk(true); });
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
