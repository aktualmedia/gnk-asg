(() => {
'use strict';
const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paths=['../data/autopilot-control.json','data/autopilot-control.json','/data/autopilot-control.json'];
async function load(){for(const p of paths){try{const r=await fetch(p+'?v='+Date.now(),{cache:'no-store'});if(r.ok)return await r.json();}catch(e){}}throw new Error('autopilot-control.json nije dostupan');}
const card=(a,b,c)=>`<article class="tile"><small>${esc(a)}</small><strong>${esc(b)}</strong><span>${esc(c||'')}</span></article>`;
function score(d){
 const modules=d.autopilot_modules||[];
 const ready=modules.filter(m=>/ready/.test(m.status)).length;
 const backend=modules.filter(m=>/backend/.test(m.status)).length;
 const s=Math.round((ready/modules.length)*70 + (backend/modules.length)*15 + 14);
 return Math.min(99,s);
}
function renderAutopilot(d){
 const sum=$('#autopilotSummary'); if(sum){
  sum.innerHTML=[
   card('Readiness score', score(d)+'%', d.goal),
   card('Modules', d.autopilot_modules.length, 'autopilot matrix'),
   card('Protected actions', d.protected_actions.length, 'manual approval'),
   card('Target', d.readiness_score_model.target, 'controlled automation')
  ].join('');
 }
 const grid=$('#moduleGrid'); if(grid) grid.innerHTML=d.autopilot_modules.map(m=>card(m.autonomy+' · '+m.status,m.name,m.does+' · Approval: '+m.approval)).join('');
 const lv=$('#levelGrid'); if(lv) lv.innerHTML=d.autonomy_levels.map(x=>card(x.level,x.name,x.description)).join('');
 const out=$('#autopilotOutput'); if(out) out.textContent=JSON.stringify({version:d.version,score:score(d),protected_actions:d.protected_actions,readiness_score_model:d.readiness_score_model},null,2);
}
function renderBrand(d){
 const b=d.brand_lab||{};
 const cand=$('#brandCandidates'); if(cand) cand.innerHTML=(b.candidates||[]).map(x=>card(x.status,x.name,x.type)).join('');
 const tests=$('#brandTests'); if(tests) tests.innerHTML=(b.tests||[]).map((x,i)=>card('Test '+(i+1),x,'brand/žig checklist')).join('');
 const out=$('#brandOutput'); if(out) out.textContent=JSON.stringify(b,null,2);
}
document.addEventListener('DOMContentLoaded',()=>load().then(d=>{renderAutopilot(d);renderBrand(d);}).catch(e=>{const o=$('#autopilotOutput')||$('#brandOutput'); if(o)o.textContent='Greška: '+e.message;}));
})();
