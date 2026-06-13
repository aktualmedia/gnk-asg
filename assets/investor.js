(() => {
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const card=(a,b,c)=>`<article class="tile"><small>${esc(a)}</small><strong>${esc(b)}</strong><span>${esc(c||'')}</span></article>`;
async function load(){
 const d=await fetch('../data/app-data.json?v='+Date.now(),{cache:'no-store'}).then(r=>r.json());
 const p=d.investor_package||{};
 document.getElementById('investorSummary').innerHTML=[
  card('Company', d.company.name, d.company.seat),
  card('Parent', d.parent_company.entity, `${d.parent_company.city}, ${d.parent_company.state}, ${d.parent_company.country}`),
  card('Group display', `${d.group.existing_total_companies} + ${d.group.planned_2026_locations}`, 'Existing companies + planned 2026 positions'),
  card('Status', p.status || 'draft', 'Investor-ready framework')
 ].join('');
 document.getElementById('dataRoomGrid').innerHTML=(p.data_room_sections||[]).map((x,i)=>card('Data room '+String(i+1).padStart(2,'0'),x,'Status: pending document verification')).join('');
 document.getElementById('investorFaq').innerHTML=(p.investor_faq||[]).map(x=>card(x.q,x.a,'')).join('');
 document.getElementById('riskGrid').innerHTML=(p.risk_register||[]).map(x=>card(x.level,x.risk,x.mitigation)).join('');
 document.getElementById('roadmapGrid').innerHTML=(p.roadmap||[]).map(x=>card(x.phase,x.goal,'')).join('');
 document.getElementById('investorBuild').onclick=()=>{document.getElementById('investorOutput').textContent=JSON.stringify({version:'gnk-asg-command-v19',command:document.getElementById('investorCommand').value,requested_by:'Nermin Sefić / Investor Hub',created_at:new Date().toISOString(),dry_run:true,note:document.getElementById('investorNote').value,safety:{requires_document_verification:true,auto_send:false,requires_approval:true}},null,2)};
 document.getElementById('investorBuild').click();
}
load().catch(e=>{document.getElementById('investorOutput').textContent='Greška: '+e.message});
})();
