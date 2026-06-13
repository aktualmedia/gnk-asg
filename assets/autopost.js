(() => {
'use strict';
const $=s=>document.querySelector(s); const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let A=null,G=null,S=null,GI=null;
async function loadJSON(paths){for(const p of paths){try{const r=await fetch(p+'?v='+Date.now(),{cache:'no-store'});if(r.ok)return await r.json();}catch(e){}} throw new Error('JSON nije dostupan');}
async function init(){
  const base = location.pathname.includes('/profiles/') ? ['../../data/','../data/','/data/'] : ['../data/','data/','/data/'];
  A = await loadJSON(base.map(x=>x+'autopost.json'));
  G = await loadJSON(base.map(x=>x+'gallery.json'));
  S = await loadJSON(base.map(x=>x+'seo-index.json'));
  GI = await loadJSON(base.map(x=>x+'google-indexing.json'));
  renderEditor(); renderGallery(); renderSEO(); renderGoogle();
}
function card(a,b,c){return `<article class="tile"><small>${esc(a)}</small><strong>${esc(b)}</strong><span>${esc(c||'')}</span></article>`}
function renderEditor(){
 const sum=$('#editorSummary'); if(sum) sum.innerHTML=[card('Runs/day',A.runs.length,A.runs.join(' · ')),card('Timezone',A.timezone,'Europe/Zagreb'),card('Publish mode',A.publish_mode_default,'draft / auto_after_rules'),card('Workflow',A.automation_steps.length,'autopost pipeline')].join('');
 const steps=$('#editorSteps'); if(steps) steps.innerHTML=A.automation_steps.map((x,i)=>card('Korak '+(i+1),x,'workflow')).join('');
 const tpl=$('#editorTemplates'); if(tpl) tpl.innerHTML=A.content_templates.map(x=>card(x.type,x.min_words+' riječi',x.image_style)).join('');
 const out=$('#editorOutput'); if(out) out.textContent=JSON.stringify({version:'gnk-asg-command-v19',command:'run_autopost_cycle',schedule:A.runs,created_at:new Date().toISOString(),dry_run:true,workflow:A.automation_steps},null,2);
}
function renderGallery(){const grid=$('#galleryGrid'); if(grid) grid.innerHTML=(G.items||[]).map(x=>`<a class=\"tile\" href=\"${esc((x.detail_url||'').replace('../',''))}\"><small>${esc(x.status)}</small><strong>${esc(x.title)}</strong><span>${esc(x.alt)}</span></a>`).join(''); const out=$('#galleryOutput'); if(out) out.textContent=JSON.stringify(G,null,2);}
function renderSEO(){ const sum=$('#seoSummary'); if(sum) sum.innerHTML=[card('Meta title', S.default_meta.meta_title, 'default'),card('Keywords', S.default_meta.keywords.length, 'keyword set'),card('Profiles', S.profiles.length, 'indexing pages'),card('Articles', S.article_index.length, 'planned/article queue')].join(''); const sch=$('#seoSchemas'); if(sch) sch.innerHTML=S.schema_plan.map(x=>card('Schema',x,'JSON-LD plan')).join(''); const q=$('#seoQueue'); if(q) q.innerHTML=S.article_index.map(x=>card(x.slug,x.type,x.status)).join(''); const out=$('#seoOutput'); if(out) out.textContent=JSON.stringify(S,null,2); }
function renderGoogle(){ const sum=$('#googleSummary'); if(sum) sum.innerHTML=[card('Verification',GI.verification_meta_name,GI.verification_content),card('Sitemap',GI.priority_urls.length,'priority URLs'),card('Hook','All HTML pages','global head placeholder'),card('Analytics',GI.analytics_tag_placeholder,'optional')].join(''); const steps=$('#googleSteps'); if(steps) steps.innerHTML=GI.required_steps.map((x,i)=>card('Step '+(i+1),x,'Search Console workflow')).join(''); const urls=$('#googleUrls'); if(urls) urls.innerHTML=GI.priority_urls.map(x=>card('Priority URL',x,'submit after deploy')).join(''); const out=$('#googleOutput'); if(out) out.textContent=GI.head_hook; }
document.addEventListener('DOMContentLoaded',()=>init().catch(e=>{const o=$('#editorOutput')||$('#galleryOutput')||$('#seoOutput')||$('#googleOutput'); if(o) o.textContent='Greška: '+e.message;}));
})();
