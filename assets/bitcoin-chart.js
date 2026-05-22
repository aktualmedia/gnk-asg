(() => {
  'use strict';
  const marketSection = document.querySelector('#digital-assets .container');
  if (!marketSection) return;

  const panel = document.createElement('section');
  panel.className = 'btc-live-panel';
  panel.setAttribute('aria-label', 'Bitcoin tržišni grafikon');
  panel.innerHTML = `
    <div class="btc-live-head">
      <div>
        <span class="btc-label">LIVE MARKET CHART</span>
        <h3>Bitcoin / EUR <small>7 dana</small></h3>
      </div>
      <div class="btc-metrics">
        <strong id="btcCurrent">Učitavanje…</strong>
        <span id="btcChange">—</span>
      </div>
    </div>
    <div class="btc-chart-wrap"><canvas id="btcChart" role="img" aria-label="Grafikon kretanja cijene Bitcoina u eurima tijekom posljednjih sedam dana"></canvas></div>
    <div class="btc-chart-foot"><span id="btcLowHigh">Raspon: —</span><span id="btcChartUpdated">Izvor: CoinGecko · informativni prikaz</span></div>`;
  const toolbar = marketSection.querySelector('.market-toolbar');
  if (toolbar) toolbar.insertAdjacentElement('afterend', panel); else marketSection.appendChild(panel);

  const formatEUR = (value) => new Intl.NumberFormat('hr-HR', {style:'currency', currency:'EUR', maximumFractionDigits: 0}).format(value);
  function draw(points) {
    const canvas = document.getElementById('btcChart');
    if (!canvas || !points.length) return;
    const rect = canvas.parentElement.getBoundingClientRect();
    const scale = window.devicePixelRatio || 1;
    const w = Math.max(280, Math.floor(rect.width));
    const h = 260;
    canvas.width = w * scale; canvas.height = h * scale; canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    const ctx = canvas.getContext('2d'); ctx.scale(scale, scale); ctx.clearRect(0, 0, w, h);
    const prices = points.map(p => Number(p[1]));
    const min = Math.min(...prices), max = Math.max(...prices), span = Math.max(1, max - min);
    const pad = {l:10, r:12, t:20, b:28};
    const x = i => pad.l + (i / (points.length - 1 || 1)) * (w - pad.l - pad.r);
    const y = v => pad.t + (1 - ((v - min) / span)) * (h - pad.t - pad.b);
    ctx.strokeStyle = 'rgba(212,175,55,.17)'; ctx.lineWidth = 1;
    for (let row = 0; row < 4; row++) { const yy = pad.t + row * (h-pad.t-pad.b)/3; ctx.beginPath(); ctx.moveTo(pad.l, yy); ctx.lineTo(w-pad.r, yy); ctx.stroke(); }
    const gradient = ctx.createLinearGradient(0, pad.t, 0, h-pad.b); gradient.addColorStop(0, 'rgba(23,113,220,.38)'); gradient.addColorStop(1, 'rgba(23,113,220,0)');
    ctx.beginPath(); points.forEach((p,i) => i ? ctx.lineTo(x(i), y(Number(p[1]))) : ctx.moveTo(x(i), y(Number(p[1])))); ctx.lineTo(x(points.length - 1), h-pad.b); ctx.lineTo(x(0), h-pad.b); ctx.closePath(); ctx.fillStyle = gradient; ctx.fill();
    ctx.beginPath(); points.forEach((p,i) => i ? ctx.lineTo(x(i), y(Number(p[1]))) : ctx.moveTo(x(i), y(Number(p[1])))); ctx.strokeStyle = '#2c83f3'; ctx.lineWidth = 2.5; ctx.stroke();
    const lastX = x(points.length-1), lastY = y(prices[prices.length-1]); ctx.beginPath(); ctx.arc(lastX,lastY,5,0,Math.PI*2); ctx.fillStyle='#d4af37'; ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.72)'; ctx.font='12px Arial'; ctx.fillText('7 DANA', pad.l, h-8); ctx.fillText('DANAS', w-55, h-8);
  }
  async function getData() {
    try {
      let response = await fetch('data/btc_chart.json?v=' + Date.now(), {cache:'no-store'});
      if (response.ok) { const local = await response.json(); if (local.prices && local.prices.length) return local; }
    } catch (e) {}
    try {
      const url = 'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=eur&days=7';
      const response = await fetch(url, {cache:'no-store'});
      if (response.ok) { const data = await response.json(); return {prices:data.prices || [], updated_at:new Date().toISOString(), source:'CoinGecko live public market data'}; }
    } catch (e) {}
    return {prices:[]};
  }
  async function refresh() {
    const data = await getData(); const points = data.prices || [];
    if (!points.length) { document.getElementById('btcCurrent').textContent = 'Nedostupno'; return; }
    const prices = points.map(p => Number(p[1])); const first = prices[0], last = prices[prices.length-1]; const change = ((last-first)/first)*100;
    document.getElementById('btcCurrent').textContent = formatEUR(last);
    const changeNode = document.getElementById('btcChange'); changeNode.textContent = (change >= 0 ? '+' : '') + change.toFixed(2) + '% / 7d'; changeNode.className = change >= 0 ? 'up' : 'down';
    document.getElementById('btcLowHigh').textContent = 'Raspon: ' + formatEUR(Math.min(...prices)) + ' - ' + formatEUR(Math.max(...prices));
    document.getElementById('btcChartUpdated').textContent = 'Ažurirano: ' + new Date(data.updated_at || Date.now()).toLocaleString('hr-HR') + ' · Izvor: CoinGecko';
    draw(points);
  }
  refresh(); window.addEventListener('resize', refresh); setInterval(refresh, 300000);
})();
