(() => {
'use strict';
const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let C=null;
async function getContacts(){ if(C)return C; const paths=['../data/contacts.json','data/contacts.json','/data/contacts.json']; for(const p of paths){try{const r=await fetch(p+'?v='+Date.now(),{cache:'no-store'}); if(r.ok){C=await r.json(); return C;}}catch(e){}} throw new Error('contacts.json nije dostupan');}
function riskClass(r){return r==='high'?'high':r==='medium'?'medium':'low'}
function renderList(){
 const grid=$('#contactGrid'); if(!grid||!C)return;
 const q=($('#contactSearch')?.value||'').toLowerCase(), risk=$('#contactRisk')?.value||'all';
 const rows=(C.contacts||[]).filter(x=>x.public!==false).filter(x=>(risk==='all'||x.risk===risk)&&(`${x.label} ${x.email} ${(x.topics||[]).join(' ')}`.toLowerCase().includes(q)));
 grid.innerHTML=rows.map(x=>`<article class="tile"><span class="label ${riskClass(x.risk)}">${esc(x.risk)}</span><h3>${esc(x.label)}</h3><p><a href="mailto:${esc(x.email)}">${esc(x.email)}</a></p><p>${esc((x.topics||[]).join(', '))}</p><p>${x.manual_required?'<strong>Ručni pregled prije odgovora.</strong>':'Auto-ack moguć.'}</p></article>`).join('');
 const ack=$('#ackGrid'); if(ack) ack.innerHTML=Object.entries(C.auto_replies||{}).map(([k,v])=>`<article class="tile"><span class="label ${riskClass(k)}">${esc(k)}</span><p>${esc(v)}</p></article>`).join('');
}
function contactPayload(){
 const form=$('#contactFormV13'); if(!form) return null;
 const d=Object.fromEntries(new FormData(form).entries());
 const contact=(C.contacts||[]).find(x=>x.id===d.recipient)||C.contacts[0];
 return {
   version:'gnk-asg-contact-v19',
   created_at:new Date().toISOString(),
   recipient_id:contact.id,
   recipient_label:contact.label,
   recipient_email:contact.email,
   risk:contact.risk,
   manual_required:!!contact.manual_required,
   name:d.name||'',
   email:d.email||'',
   phone:d.phone||'',
   subject:d.subject||'',
   message:d.message||'',
   consent:!!d.consent,
   auto_ack_template:C.auto_replies?.[contact.risk]||C.auto_replies?.low||''
 };
}
function renderOutput(p, extra=''){
 const out=$('#contactOutput'); if(out) out.textContent=(extra?extra+'\n\n':'')+JSON.stringify(p,null,2);
}
function buildMailto(p){
 const subject=encodeURIComponent(`[GNK ASG] ${p.subject}`);
 const body=encodeURIComponent(`Ime/društvo: ${p.name}\nE-mail: ${p.email}\nTelefon: ${p.phone}\nPrimatelj: ${p.recipient_label}\nRizik: ${p.risk}\n\nPoruka:\n${p.message}\n\n---\nAuto-ack predložak:\n${p.auto_ack_template}`);
 return `mailto:${p.recipient_email}?subject=${subject}&body=${body}`;
}
async function serverSend(p){
 const endpoint = (location.origin.includes('localhost') ? '/contact-send' : '/contact-send');
 try{
   const r=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(p)});
   const txt=await r.text();
   renderOutput(p, `Server response HTTP ${r.status}: ${txt}`);
 }catch(e){
   renderOutput(p, `Server-side slanje nije aktivno na statičkoj stranici. Koristi “Otvori mail za slanje” ili spoji Cloudflare Worker. Greška: ${e.message}`);
 }
}
async function initForm(){
 const data=await getContacts();
 const sel=$('#recipientSelect'); if(!sel)return;
 sel.innerHTML=(data.contacts||[]).filter(x=>x.public!==false).map(x=>`<option value="${esc(x.id)}">${esc(x.label)} — ${esc(x.email)}</option>`).join('');
 ['input','change'].forEach(ev=>$('#contactFormV13')?.addEventListener(ev,()=>{const p=contactPayload(); if(p)renderOutput(p);}));
 $('#mailtoBtn')?.addEventListener('click',()=>{const p=contactPayload(); if(!p)return; renderOutput(p,'Otvaram mail klijent za direktno slanje.'); location.href=buildMailto(p);});
 $('#serverBtn')?.addEventListener('click',()=>{const p=contactPayload(); if(!p)return; serverSend(p);});
 $('#copyBtn')?.addEventListener('click',async()=>{const p=contactPayload(); if(!p)return; const txt=JSON.stringify(p,null,2); try{await navigator.clipboard.writeText(txt); renderOutput(p,'Payload kopiran u clipboard.');}catch(e){renderOutput(p,'Kopiranje nije uspjelo automatski. Ručno kopiraj tekst ispod.');}});
 renderOutput(contactPayload());
}
document.addEventListener('DOMContentLoaded',async()=>{try{await getContacts(); renderList(); initForm(); $('#contactSearch')&&( $('#contactSearch').oninput=renderList); $('#contactRisk')&&( $('#contactRisk').onchange=renderList);}catch(e){const out=$('#contactOutput')||$('#contactGrid'); if(out) out.textContent='Greška: '+e.message;}});
})();
