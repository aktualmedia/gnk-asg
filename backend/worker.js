const H={'content-type':'application/json; charset=utf-8','access-control-allow-origin':'*','access-control-allow-headers':'content-type,authorization,x-mail-signature,x-whatsapp-signature','access-control-allow-methods':'GET,POST,OPTIONS'};
const J=(x,s=200)=>new Response(JSON.stringify(x,null,2),{status:s,headers:H});
const now=()=>new Date().toISOString();
const risk=c=>['promote_to_root','rollback_root','send_external_email','send_whatsapp_message'].includes(c)?'high':['change_secret','delete_file','change_dns'].includes(c)?'critical':['deploy_preview','prepare_draft_reply','rebuild_documents','prepare_whatsapp_draft'].includes(c)?'medium':'low';
const classify=m=>{const s=((m.subject||'')+' '+(m.text||m.body||'')).toLowerCase();if(/casino|viagra|winner|giveaway/.test(s))return['spam','critical'];if(/status_check|refresh_news|refresh_market|deploy_preview|command/.test(s))return['command','low'];if(/novinar|medij|komentar|izjava|press|interview/.test(s))return['media','high'];if(/sud|odvjetnik|pravni|tužba|opomena|rok/.test(s))return['legal','high'];if(/račun|uplata|porez|revizija|financ|invest/.test(s))return['finance','high'];if(/bug|portal|api|cloudflare|github|endpoint/.test(s))return['technical','medium'];if(/dokument|pdf|izvješće|revizorsko/.test(s))return['documents','low'];return['general','low'];};
async function put(env,b,k,v){if(env[b]?.put)await env[b].put(k,JSON.stringify(v));}
async function command(req,env){const auth=req.headers.get('authorization')||'';if(!env.OPERATOR_TOKEN||auth!==`Bearer ${env.OPERATOR_TOKEN}`)return J({ok:false,error:'unauthorized'},401);const p=await req.json().catch(()=>null);if(!p?.command)return J({ok:false,error:'invalid_command'},400);const r=risk(p.command),id=p.id||crypto.randomUUID();if(r==='critical')return J({ok:false,error:'critical_blocked'},403);if(r==='high'&&p.confirmation_phrase!=='ODOBRAVAM VISOKI RIZIK')return J({ok:false,error:'confirmation_required',phrase:'ODOBRAVAM VISOKI RIZIK'},409);const result={ok:true,id,command:p.command,risk:r,dry_run:p.dry_run!==false,time:now()};await put(env,'COMMAND_LOG','cmd:'+id,{...result,payload:p});return J(result);}
async function emailInbound(req,env){const p=await req.json().catch(()=>null);if(!p?.from||!p?.subject)return J({ok:false,error:'missing_mail_fields'},400);const [category,rr]=classify(p);const id=crypto.randomUUID();const draft=rr==='critical'?'Poruka je stavljena u karantenu.':category==='media'?'Poštovani, zaprimili smo medijski upit. Odgovor ćemo dostaviti nakon provjere i odobrenja.':category==='legal'?'Poštovani, zaprimili smo pravni upit i proslijedit ćemo ga na ručni pregled.':category==='finance'?'Poštovani, zaprimili smo financijski upit. Odgovor zahtijeva provjeru dokumentacije i odobrenje.':'Poštovani, zaprimili smo poruku. Javit ćemo se nakon provjere.';const entry={id,from:p.from,to:p.to||'',subject:p.subject,text:p.text||p.body||'',category,risk:rr,status:rr==='critical'?'quarantined':'received',created_at:now(),draft};await put(env,'MAIL_INBOX','mail:'+id,entry);return J({ok:true,id,category,risk:rr,status:entry.status,draft});}
async function contact(req,env){const p=await req.json().catch(()=>null);if(!p?.email||!p?.message||!p?.consent)return J({ok:false,error:'missing_fields'},400);const id=crypto.randomUUID();await put(env,'CONTACT_INBOX','contact:'+id,{id,...p,created_at:now(),status:'received'});return J({ok:true,id,status:'received'});}
async function publicChat(req,env){const p=await req.json().catch(()=>null);const q=String(p?.question||'').toLowerCase();let answer='Nemam taj podatak u javnoj bazi portala. Pošaljite upit kroz kontakt formu ili mail.';if(q.includes('besplat')||q.includes('ai'))answer='Javni agent radi besplatno, bez plaćenog API-ja: koristi lokalnu knowledge bazu i javne JSON podatke portala.';else if(q.includes('parent')||q.includes('boulder'))answer='Parent company je GNK DINAMO Ltd., Boulder, Colorado, USA.';else if(q.includes('whatsapp'))answer='WhatsApp link je https://wa.me/385915358365. Automatizacija ide samo preko službenog WhatsApp Business API-ja.';return J({ok:true,agent:'public-free-ai',answer});}
async function privateChat(req,env){const auth=req.headers.get('authorization')||'';if(!env.OPERATOR_TOKEN||auth!==`Bearer ${env.OPERATOR_TOKEN}`)return J({ok:false,error:'unauthorized'},401);const p=await req.json().catch(()=>null);const q=String(p?.instruction||p?.question||'');let command='status_check';const s=q.toLowerCase();if(s.includes('vijest'))command='refresh_news';else if(s.includes('market')||s.includes('bitcoin'))command='refresh_market';else if(s.includes('mail'))command='prepare_draft_reply';else if(s.includes('whatsapp')||s.includes('wa '))command='prepare_whatsapp_draft';else if(s.includes('investitor')||s.includes('investor'))command='prepare_investor_brief';else if(s.includes('data room'))command='prepare_data_room_index';else if(s.includes('deploy'))command='deploy_preview';return J({ok:true,agent:'private',command_json:{version:'gnk-asg-command-v19',command,requested_by:'Private Agent',created_at:now(),dry_run:true,note:q}});}




async function articleBuild(req,env){
 const p=await req.json().catch(()=>({}));
 const id=crypto.randomUUID();
 const entry={id,command:'article_build',slug:p.slug||'new-article',created_at:now(),status:'prepared',dry_run:p.dry_run!==false,note:p.note||'build indexed article + gallery asset'};
 await put(env,'COMMAND_LOG','article:'+id,entry);
 return J({ok:true,id,status:'article_build_prepared',entry});
}

async function autopostRun(req,env){
 const auth=req.headers.get('authorization')||'';
 const p=await req.json().catch(()=>({}));
 const id=crypto.randomUUID();
 const entry={id,command:'autopost_run',schedule:p.schedule||['09:00','13:00','18:00'],status:'prepared',created_at:now(),note:p.note||'Auto Editor 3x daily',dry_run:p.dry_run!==false};
 await put(env,'COMMAND_LOG','autopost:'+id,entry);
 return J({ok:true,id,status:'autopost_prepared',requires_auth_for_production:!auth,entry});
}

async function crmEvent(req,env){
 const auth=req.headers.get('authorization')||'';
 const p=await req.json().catch(()=>null);
 if(!p?.event)return J({ok:false,error:'missing_crm_event'},400);
 const id=crypto.randomUUID();
 const entry={id,...p,status:'prepared',created_at:now()};
 await put(env,'COMMAND_LOG','crm:'+id,entry);
 return J({ok:true,id,status:'crm_event_prepared',requires_auth_for_production:auth?false:true});
}

async function contactSend(req,env){
 const p=await req.json().catch(()=>null);
 if(!p?.recipient_email||!p?.email||!p?.message||!p?.consent)return J({ok:false,error:'missing_contact_fields'},400);
 const id=crypto.randomUUID();
 const entry={id,...p,status:'received',server_send:false,created_at:now()};
 await put(env,'CONTACT_INBOX','contact:'+id,entry);
 const canSend=!!(env.RESEND_API_KEY||env.BREVO_API_KEY);
 if(!canSend){
   return J({ok:true,id,status:'stored_or_prepared',sent:false,reason:'mail_provider_not_configured',auto_ack:p.auto_ack_template||''});
 }
 return J({ok:true,id,status:'provider_ready',sent:false,note:'Provider call hook present; connect Resend/Brevo send call server-side.',auto_ack:p.auto_ack_template||''});
}

async function guardedSend(req,env,kind){const auth=req.headers.get('authorization')||'';if(!env.OPERATOR_TOKEN||auth!==`Bearer ${env.OPERATOR_TOKEN}`)return J({ok:false,error:'unauthorized'},401);const p=await req.json().catch(()=>null);if(!p?.to||!p?.body||p.confirmation_phrase!=='ODOBRAVAM SLANJE')return J({ok:false,error:'send_confirmation_required',phrase:'ODOBRAVAM SLANJE'},409);return J({ok:true,status:kind+'_send_ready',sent:false,note:'Provider call must be connected server-side.'});}
export default{async fetch(req,env){const u=new URL(req.url);if(req.method==='OPTIONS')return J({});if(u.pathname==='/__health')return J({ok:true,service:'gnk-asg-v19-production-ready',time:now()});if(u.pathname==='/config')return J({ok:true,version:'v19',public_ai:'local/free',private_agent:'token_required',mail:'inbound/read/classify/draft/send-gate',whatsapp:'official_business_api_only',investor:'data_room_due_diligence_ready',app_install:'pwa_qr_guest_admin_desktop_ready',contact_routing:'contact_list_mailto_worker_auto_ack_ready',crm:'inbox_ticketing_lead_pipeline_ready',autopost:'3x_daily_gallery_seo_indexing_ready',news_gallery:'indexed_articles_image_sitemap_ready',production_rule:'preview_self_test_backup_before_root'});if(u.pathname==='/investor-config')return J({ok:true,investor_hub:true,data_room_sections:['corporate','registry','ownership','audit_finance','contracts_ip','technology','legal_risk','investment_thesis','roadmap'],rule:'publish only verified claims'});if(u.pathname==='/command'&&req.method==='POST')return command(req,env);if(u.pathname==='/contact'&&req.method==='POST')return contact(req,env);if(u.pathname==='/contact-send'&&req.method==='POST')return contactSend(req,env);if(u.pathname==='/crm-event'&&req.method==='POST')return crmEvent(req,env);if(u.pathname==='/autopost-run'&&req.method==='POST')return autopostRun(req,env);if(u.pathname==='/article-build'&&req.method==='POST')return articleBuild(req,env);if(u.pathname==='/email-inbound'&&req.method==='POST')return emailInbound(req,env);if(u.pathname==='/email-send'&&req.method==='POST')return guardedSend(req,env,'email');if(u.pathname==='/public-chat'&&req.method==='POST')return publicChat(req,env);if(u.pathname==='/private-chat'&&req.method==='POST')return privateChat(req,env);if(u.pathname==='/whatsapp-webhook'&&req.method==='POST')return J({ok:true,status:'received',draft:'Zaprimili smo WhatsApp poruku. Odgovor nakon provjere.'});if(u.pathname==='/whatsapp-send'&&req.method==='POST')return guardedSend(req,env,'whatsapp');return J({ok:false,error:'not_found',path:u.pathname},404)}}
