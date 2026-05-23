(() => {
  'use strict';
  const marketSection = document.querySelector('#digital-assets .container');
  if (!marketSection) return;
  const META = {
    btc: {label:'Bitcoin', ticker:'BTC', line:'#2c83f3', css:'btc'},
    gold: {label:'Zlato', ticker:'XAU', line:'#d4af37', css:'gold'},
    oil: {label:'Brent nafta', ticker:'BRENT', line:'#2ebd85', css:'oil'},
    usd: {label:'USD / EUR', ticker:'USD', line:'#afb7c4', css:'usd'}
  };
  let dataset = null;
  let view = 'indexed';
  const panel = document.createElement('section');
  panel.className = 'macro-dashboard';
  panel.setAttribute('aria-label', 'Bitcoin, zlato, nafta i američki dolar - usporedni tržišni prikaz');
  panel.innerHTML = `
    <div class="macro-head"><div><span class="btc-label">CROSS-ASSET MARKET MONITOR</span><h3>Bitcoin · zlato · Brent nafta · USD/EUR</h3><p>Statistički odnos kretanja cijena, prikazan na zajedničkoj indeksiranoj osnovici.</p></div><span class="macro-period" id="macroUpdated">Ažuriranje…</span></div>
    <div class="macro-cards" id="macroCards"></div>
    <div class="market-comparison-tabs"><button class="active" data-view="indexed">Relativna promjena</button><button data-view="btc">Bitcoin cijena</button></div>
    <div class="macro-chart-box"><canvas id="macroChart" role="img" aria-label="Usporedni grafikon Bitcoina, zlata, nafte i američkog dolara"></canvas><div class="macro-legend" id="macroLegend"></div></div>
    <div class="macro-analysis" id="macroCorrelations"></div>
    <p class="macro-foot">Podatci su indikativni i mogu biti vremenski odgođeni. Korelacija prikazuje zajednički smjer dnevnih promjena u promatranom razdoblju, ali ne dokazuje uzročnost niti predstavlja investicijski savjet.</p>`;
  const toolbar = marketSection.querySelector('.market-toolbar');
  if (toolbar) toolbar.insertAdjacentElement('afterend', panel); else marketSection.appendChild(panel);

  const format = (value, key) => {
    if (value == null || Number.isNaN(Number(value))) return '—';
    const currency = key === 'usd' ? 'EUR' : 'USD';
    const fraction = key === 'usd' ? 4 : key === 'btc' ? 0 : 2;
    return new Intl.NumberFormat('hr-HR', {style:'currency', currency, maximumFractionDigits:fraction}).format(Number(value));
  };
  const pct = value => value == null ? '—' : `${Number(value) >= 0 ? '+' : ''}${Number(value).toFixed(2)}%`;
  function cards() {
    const holder = document.getElementById('macroCards');
    if (!holder || !dataset) return;
    holder.innerHTML = Object.keys(META).map(key => {
      const a = dataset.assets[key]; if (!a) return '';
      const direction = Number(a.change_30d_percent || 0) >= 0 ? 'up' : 'down';
      return `<article class="macro-card"><div class="asset"><span><i class="macro-dot ${META[key].css}"></i>${META[key].label}</span><span>${META[key].ticker}</span></div><strong class="macro-price">${format(a.current,key)}</strong><span class="macro-change ${direction}">${pct(a.change_30d_percent)} / 30d</span><div class="unit">${a.unit || ''}</div></article>`;
    }).join('');
  }
  function legend(keys) {
    const target = document.getElementById('macroLegend'); if (!target) return;
    target.innerHTML = keys.map(key => `<span><i style="background:${META[key].line}"></i>${META[key].label}</span>`).join('');
  }
  function draw(keys) {
    const canvas = document.getElementById('macroChart'); if (!canvas || !dataset) return;
    const rect = canvas.parentElement.getBoundingClientRect(), ratio = window.devicePixelRatio || 1;
    const width = Math.max(285, Math.floor(rect.width - 18)), height = window.innerWidth < 650 ? 235 : 290;
    canvas.width = width * ratio; canvas.height = height * ratio; canvas.style.width = width + 'px'; canvas.style.height = height + 'px';
    const ctx = canvas.getContext('2d'); ctx.setTransform(ratio, 0, 0, ratio, 0, 0); ctx.clearRect(0,0,width,height);
    const pad = {left:42,right:14,top:17,bottom:30};
    const series = keys.map(key => ({key, points: view === 'btc' ? dataset.assets[key].points : dataset.assets[key].indexed_points})).filter(s => s.points && s.points.length);
    if (!series.length) return;
    const vals = series.flatMap(s => s.points.map(p => Number(p[1])));
    const low = Math.min(...vals), high = Math.max(...vals), span = Math.max(high-low, 0.01);
    const maxPoints = Math.max(...series.map(s => s.points.length));
    const x = i => pad.left + (i / Math.max(maxPoints-1,1)) * (width-pad.left-pad.right);
    const y = v => pad.top + (1 - (v-low)/span) * (height-pad.top-pad.bottom);
    ctx.font = '11px Arial'; ctx.fillStyle = 'rgba(214,225,239,.72)'; ctx.strokeStyle='rgba(212,175,55,.16)'; ctx.lineWidth=1;
    for(let i=0;i<4;i++){const val=high-(span*i/3), yy=y(val); ctx.beginPath();ctx.moveTo(pad.left,yy);ctx.lineTo(width-pad.right,yy);ctx.stroke(); ctx.fillText(view==='indexed'?val.toFixed(1):format(val,'btc'),3,yy+4);}
    series.forEach(s => {ctx.beginPath(); s.points.forEach((p,i) => {const xx=x(i), yy=y(Number(p[1])); i ? ctx.lineTo(xx,yy):ctx.moveTo(xx,yy);});ctx.strokeStyle=META[s.key].line;ctx.lineWidth=s.key==='btc'?2.8:2;ctx.stroke();});
    ctx.fillStyle='rgba(214,225,239,.76)'; ctx.fillText(view==='indexed'?'Početak = 100':'BTC cijena USD',pad.left,height-9); ctx.fillText('Danas',width-49,height-9);
    legend(keys);
  }
  function correlations() {
    const target=document.getElementById('macroCorrelations'); if(!target || !dataset) return;
    const labels={btc_gold:'BTC / zlato',btc_oil:'BTC / Brent nafta',btc_usd:'BTC / USD'};
    target.innerHTML = Object.keys(labels).map(key => {const value=dataset.correlations[key]; const explanation=value==null?'nema dovoljno podataka':Math.abs(value)<0.25?'slaba povezanost':value>0?'pozitivna povezanost':'suprotan smjer'; return `<div class="correlation"><small>${labels[key]}</small><strong>${value == null ? '—' : value.toFixed(3)}</strong><p>${explanation}</p></div>`;}).join('');
  }
  async function load() {
    try {const response=await fetch('data/macro_market.json?v='+Date.now(),{cache:'no-store'}); if(response.ok) dataset=await response.json();} catch(error) {}
    if(!dataset || !dataset.assets) return;
    document.getElementById('macroUpdated').textContent='Ažurirano ' + new Date(dataset.updated_at).toLocaleString('hr-HR');
    cards(); correlations(); draw(['btc','gold','oil','usd']);
  }
  panel.querySelectorAll('.market-comparison-tabs button').forEach(button => button.onclick = () => {panel.querySelectorAll('.market-comparison-tabs button').forEach(b=>b.classList.remove('active')); button.classList.add('active'); view=button.dataset.view; draw(view==='btc'?['btc']:['btc','gold','oil','usd']);});
  load(); window.addEventListener('resize',()=>dataset && draw(view==='btc'?['btc']:['btc','gold','oil','usd'])); setInterval(load,300000);
})();
