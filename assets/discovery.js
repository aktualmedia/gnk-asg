(() => {
'use strict';
const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const candidates = location.pathname.includes('/categories/') || location.pathname.includes('/tags/') || location.pathname.includes('/archive/') || location.pathname.includes('/search/')
  ? ['../data/','data/','/data/'] : ['data/','../data/','/data/'];
async function load(name){for(const b of candidates){try{const r=await fetch(b+name+'?v='+Date.now(),{cache:'no-store'});if(r.ok)return await r.json();}catch(e){}}throw new Error(name+' nije dostupan');}
const card=(a,b,c,u)=>`<a class="tile" href="${esc(u||'#')}"><small>${esc(a)}</small><strong>${esc(b)}</strong><span>${esc(c||'')}</span></a>`;
async function init(){
 const [news,tax,rel,perf] = await Promise.all([load('news.json'),load('taxonomy.json'),load('related-content.json'),load('performance-budget.json')]);
 const cats=$('#categoryGrid'); if(cats) cats.innerHTML=tax.categories.map(c=>card('Category',c.label,c.description,c.url)).join('');
 const tags=$('#tagGrid'); if(tags) tags.innerHTML=tax.tags.map(t=>card('Tag',t.label,'Povezani sadržaj',t.url)).join('');
 const arch=$('#archiveGrid'); if(arch) arch.innerHTML=news.items.map(n=>card(n.category,n.title,n.summary,'../news/'+n.slug+'/')).join('');
 const relGrid=$('#relatedGrid'); if(relGrid) relGrid.innerHTML=Object.entries(rel.items).map(([k,v])=>card('Related',k,v.join(' · '),'../news/'+k+'/')).join('');
 const perfGrid=$('#performanceGrid'); if(perfGrid) perfGrid.innerHTML=perf.rules.map((x,i)=>card('Fast rule '+(i+1),x,'performance budget','#')).join('');
 const input=$('#searchInput'), results=$('#searchResults');
 function renderSearch(){
   if(!results)return;
   const q=(input?.value||'').toLowerCase();
   const rows=news.items.filter(n=>`${n.title} ${n.summary} ${n.category} ${(n.keywords||[]).join(' ')}`.toLowerCase().includes(q));
   results.innerHTML=rows.map(n=>card(n.category,n.title,n.summary,'../news/'+n.slug+'/')).join('') || '<p>Nema rezultata.</p>';
 }
 if(input){input.oninput=renderSearch; renderSearch();}
 const out=$('#discoveryOutput'); if(out) out.textContent=JSON.stringify({taxonomy:tax,related:rel,performance:perf},null,2);
}
document.addEventListener('DOMContentLoaded',()=>init().catch(e=>{const o=$('#discoveryOutput')||$('#searchResults')||$('#archiveGrid'); if(o)o.textContent='Greška: '+e.message;}));
})();
