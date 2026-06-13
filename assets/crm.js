(() => {
'use strict';
const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let CRM=null, selected=null;
const paths = location.pathname.includes('/admin/') ? ['../../data/crm.json','../data/crm.json','/data/crm.json'] : ['../data/crm.json','data/crm.json','/data/crm.json'];
async function get(){if(CRM)return CRM;for(const p of paths){try{const r=await fetch(p+'?v='+Date.now(),{cache:'no-store'});if(r.ok){CRM=await r.json();return CRM;}}catch(e){}}throw new Error('crm.json nije dostupan');}
const card=(a,b,c)=>`<article class="tile"><small>${esc(a)}</small><strong>${esc(b)}</strong><span>${esc(c||'')}</span></article>`;
function riskClass(r){return r==='high'?'high':r==='medium'?'medium':'low'}
function renderPublic(c){
 if(!$('#crmSummary'))return;
 $('#crmSummary').innerHTML=[
  card('Inbox', 'Upiti', 'kontakt forma, mail, WhatsApp'),
  card('Ticketing', c.inquiry_statuses.length+' statusa', 'kontrola obrade'),
  card('Lead', c.lead_stages.length+' faza', 'investor pipeline'),
  card('Audit', c.audit_events.length+' događaja', 'trag radnji')
 ].join('');
 $('#statusGrid').innerHTML=c.inquiry_statuses.map(x=>card('Status',x,'inquiry workflow')).join('');
 $('#leadGrid').innerHTML=c.lead_stages.map(x=>card('Lead stage',x,'investor / sales pipeline')).join('');
 $('#slaGrid').innerHTML=c.sla_rules.map(x=>card(x.risk,x.first_response,x.mode)).join('');
 $('#templateGrid').innerHTML=c.response_templates.map(x=>card(x.name,x.risk,x.body)).join('');
}
function renderAdmin(c){
 const list=$('#inquiryList'); if(!list)return;
 const q=($('#crmSearch')?.value||'').toLowerCase(), f=$('#crmFilter')?.value||'all';
 const rows=c.sample_inquiries.filter(x=>(f==='all'||x.risk===f)&&(`${x.id} ${x.from} ${x.subject} ${x.pipeline} ${x.status}`.toLowerCase().includes(q)));
 list.innerHTML=rows.map((x,i)=>`<div class="item ${selected&&selected.id===x.id?'active':''}" data-id="${esc(x.id)}"><span class="label ${riskClass(x.risk)}">${esc(x.risk)}</span> <span class="label">${esc(x.status)}</span><strong>${esc(x.subject)}</strong><p>${esc(x.from)} · ${esc(x.pipeline)}</p></div>`).join('');
 list.querySelectorAll('.item').forEach(el=>el.onclick=()=>select(c,el.dataset.id));
 if(!selected && rows[0]) select(c, rows[0].id, false);
}
function select(c,id, rerender=true){
 selected=c.sample_inquiries.find(x=>x.id===id)||c.sample_inquiries[0];
 const tmpl=(c.response_templates||[]).find(t=>t.risk===selected.risk)||c.response_templates[0];
 $('#inquiryDetail').innerHTML=`<span class="label ${riskClass(selected.risk)}">${esc(selected.risk)}</span> <span class="label">${esc(selected.status)}</span><h2>${esc(selected.subject)}</h2><p><b>ID:</b> ${esc(selected.id)}<br><b>From:</b> ${esc(selected.from)}<br><b>Pipeline:</b> ${esc(selected.pipeline)}<br><b>Priority:</b> ${esc(selected.priority)}</p><h3>Predloženi template</h3><div class="notice">${esc(tmpl?.body||'')}</div>`;
 if(rerender) renderAdmin(c);
}
function bindAdmin(c){
 $('#crmFilter')&&($('#crmFilter').onchange=()=>renderAdmin(c));
 $('#crmSearch')&&($('#crmSearch').oninput=()=>renderAdmin(c));
 $('#crmEventForm')?.addEventListener('submit',e=>{
   e.preventDefault();
   const d=Object.fromEntries(new FormData(e.target).entries());
   const payload={version:'gnk-asg-crm-event-v19',created_at:new Date().toISOString(),inquiry:selected,event:d.event,note:d.note,requires_backend_token:true,auto_send:false};
   $('#crmOutput').textContent=JSON.stringify(payload,null,2);
 });
}
document.addEventListener('DOMContentLoaded',async()=>{try{const c=await get();renderPublic(c);renderAdmin(c);bindAdmin(c);}catch(e){const out=$('#crmOutput')||$('#crmSummary'); if(out) out.textContent='Greška: '+e.message;}});
})();
