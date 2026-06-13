(() => {
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const checks=[
 ['Data','../data/app-data.json'],
 ['Home','../index.html'],
 ['CSS','../assets/style.css'],
 ['App JS','../assets/app.js'],
 ['Page JS','../assets/page.js'],
 ['Public agent','../agents/public/'],
 ['Private agent','../agents/private/'],
 ['MailOps','../mail/'],
 ['Communication','../communication/'],
 ['Admin','../admin/'],
 ['Command','../operator/command/'],
 ['Status','../operator/status/'],
 ['Locations','../locations/'],
 ['Legal','../legal/'],
 ['Upload guide','../upload/'],['Autopilot','../autopilot/'],['Brand Lab','../brand-lab/'],['Autopilot JSON','../data/autopilot-control.json'],['Search','../search/'],['Categories','../categories/'],['Tags','../tags/'],['Archive','../archive/'],['Taxonomy JSON','../data/taxonomy.json'],['Related JSON','../data/related-content.json'],['Performance JSON','../data/performance-budget.json'],['News sitemap','../news-sitemap.xml'],['News','../news/'],['Authors','../authors/'],['Image sitemap','../image-sitemap.xml'],['Image sitemap JSON','../data/image-sitemap.json'],['News JSON','../data/news.json'],['Editor','../editor/'],['Gallery','../gallery/'],['Profiles','../profiles/'],['SEO','../seo/'],['Google Indexing','../google-indexing/'],['Autopost JSON','../data/autopost.json'],['Gallery JSON','../data/gallery.json'],['SEO JSON','../data/seo-index.json'],['Google JSON','../data/google-indexing.json'],['CRM','../crm/'],['Admin CRM','../admin/crm/'],['CRM JSON','../data/crm.json'],['Contacts','../contact-list/'],['Contact form','../kontakt/'],['Contacts JSON','../data/contacts.json'],['Install','../install/'],['Downloads','../downloads/'],['Admin mobile','../app/admin/'],['Desktop','../desktop/'],['QR','../assets/qr-gnk-asg-app.svg']
];
async function run(){
 const grid=document.getElementById('testGrid'), out=document.getElementById('testOutput'), sum=document.getElementById('summary');
 const rows=[];
 for(const [name,path] of checks){
   try{
     const r=await fetch(path+'?v='+Date.now(),{cache:'no-store'});
     const ok=r.ok;
     rows.push({name,path,status:r.status,ok});
     grid.insertAdjacentHTML('beforeend',`<article class="tile"><small>${esc(name)}</small><strong>${ok?'OK':'PROBLEM'}</strong><span>${esc(path)} · HTTP ${r.status}</span></article>`);
   }catch(e){
     rows.push({name,path,status:'ERROR',ok:false,error:e.message});
     grid.insertAdjacentHTML('beforeend',`<article class="tile"><small>${esc(name)}</small><strong>ERROR</strong><span>${esc(e.message)}</span></article>`);
   }
 }
 const passed=rows.filter(x=>x.ok).length;
 sum.textContent=`Self-test: ${passed}/${rows.length} provjera OK`;
 out.textContent=JSON.stringify({passed,total:rows.length,ready_for_preview:passed===rows.length,production_rule:'Root se ne mijenja bez preview testa i backupa.',rows},null,2);
}
run();
})();
