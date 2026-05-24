#!/usr/bin/env python3
"""Validate GNK ASG portal, SEO, 3D modules and public market datasets."""
from __future__ import annotations
import argparse, json, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; DATA=ROOT/'data'; SITE='https://aktualmedia.github.io/gnk-asg/'
IMAGE=SITE+'assets/gnk-asg-social-card.png'; ERRORS=[]; PASSED=[]
PAGES=[('index.html',SITE),('en/index.html',SITE+'en/'),('trzista/index.html',SITE+'trzista/'),('en/markets/index.html',SITE+'en/markets/'),('sadrzaj/index.html',SITE+'sadrzaj/'),('financije/index.html',SITE+'financije/'),('en/finance/index.html',SITE+'en/finance/'),('tehnologija/index.html',SITE+'tehnologija/'),('en/technology/index.html',SITE+'en/technology/'),('intelligence-desk/index.html',SITE+'intelligence-desk/'),('en/intelligence-desk/index.html',SITE+'en/intelligence-desk/'),('registri/index.html',SITE+'registri/'),('en/registries/index.html',SITE+'en/registries/'),('instalacija/index.html',SITE+'instalacija/')]
def ok(text): PASSED.append(text); print('PASS: '+text)
def fail(text): ERRORS.append(text); print('FAIL: '+text,file=sys.stderr)
def load(path):
 try:return json.loads(path.read_text(encoding='utf-8'))
 except Exception as exc: fail(f'JSON nije moguće učitati: {path.relative_to(ROOT)} ({exc})'); return None
def needed(path):
 p=ROOT/path
 if p.exists() and p.stat().st_size>0: ok('Datoteka postoji: '+path)
 else: fail('Nedostaje datoteka: '+path)
def check_structure(seo=False):
 required=['index.html','en/index.html','trzista/index.html','en/markets/index.html','financije/index.html','en/finance/index.html','tehnologija/index.html','en/technology/index.html','intelligence-desk/index.html','en/intelligence-desk/index.html','registri/index.html','en/registries/index.html','admin/index.html','sw.js','manifest.webmanifest','package.json','playwright.config.js','tests/market-centre.spec.js','assets/app.js','assets/portal-navigation.js','assets/group-network.js','assets/network-motion.js','assets/group-globe-3d.js','assets/market-centre.css','assets/market-centre-panels.css','assets/market-centre-data.js','assets/market-constellation.js','assets/gnk-asg-social-card.svg','assets/admin-status-only.js','data/group_network.json','data/group_network_geo.json','data/media_approved.json','data/media_monitor_status.json','data/stablecoins.json','data/exchange_compare.json','data/market_indices.json','data/fast_market_status.json','data/daily_market_brief.json','scripts/update_feeds_v2.py','scripts/update_macro_data.py','scripts/update_fast_market.py','scripts/generate_daily_market_brief.py','scripts/generate_social_preview.py','scripts/discover_corporate_media.py','scripts/generate_seo.py','scripts/validate_portal.py','.github/workflows/hourly-data-update.yml','.github/workflows/fast-market-update.yml','.github/workflows/daily-market-brief.yml','.github/workflows/daily-seo-refresh.yml','.github/workflows/media-monitor-status.yml','.github/workflows/manage-approved-media.yml','.github/workflows/portal-validation.yml']
 for path in required: needed(path)
 if seo: needed('assets/gnk-asg-social-card.png')
 for path in ['data/corporate_review_queue.json','data/corporate_review_decisions.json','.github/workflows/queue-item-action.yml','.github/workflows/review-queue-refresh.yml','scripts/apply_review_decision.py','assets/admin-console.js','.github/workflows/hourly-news-update.yml']:
  if (ROOT/path).exists(): fail('Neželjeni ili duplicirani javni artefakt: '+path)
  else: ok('Nije prisutno: '+path)
 app=(ROOT/'assets/app.js').read_text(encoding='utf-8'); nav=(ROOT/'assets/portal-navigation.js').read_text(encoding='utf-8')
 for name in ['group-globe-3d.js','network-motion.js']:
  ok('Aplikacija učitava: '+name) if name in app else fail('Aplikacija ne učitava: '+name)
 if '/gnk-asg/trzista/' in nav and '/gnk-asg/en/markets/' in nav: ok('Glavna navigacija vodi u dvojezični Market Intelligence')
 else: fail('Navigacija nema dvojezične Market Intelligence rute')
 for page in ['trzista/index.html','en/markets/index.html']:
  html=(ROOT/page).read_text(encoding='utf-8')
  if 'market-centre-data.js' in html and 'market-constellation.js' in html and 'marketConstellation' in html: ok('Market Intelligence prikaz povezan: '+page)
  else: fail('Market Intelligence prikaz nije potpuno povezan: '+page)
 admin=(ROOT/'admin/index.html').read_text(encoding='utf-8')
 if 'media-monitor-status.yml' in admin and 'name="robots" content="noindex,nofollow,noarchive"' in admin: ok('Admin je statusni i izvan indeksa')
 else: fail('Admin nema očekivani sigurnosni/noindex model')
 workflows={p:(ROOT/p).read_text(encoding='utf-8') for p in ['.github/workflows/hourly-data-update.yml','.github/workflows/fast-market-update.yml','.github/workflows/daily-market-brief.yml']}
 if "cron: '17 * * * *'" in workflows['.github/workflows/hourly-data-update.yml'] and 'data/market.json' not in workflows['.github/workflows/hourly-data-update.yml']: ok('Vijesti/makro ostaju satni bez prepisivanja brzog marketa')
 else: fail('Satni workflow nije pravilno odvojen od brzog marketa')
 if "cron: '*/5 * * * *'" in workflows['.github/workflows/fast-market-update.yml'] and 'fast_market_status.json' in workflows['.github/workflows/fast-market-update.yml'] and 'update_status.json' not in workflows['.github/workflows/fast-market-update.yml']: ok('Market Intelligence osvježavanje postavljeno je na pet minuta i izolirano')
 else: fail('Petominutni tržišni workflow nije ispravno postavljen')
 if 'generate_daily_market_brief.py' in workflows['.github/workflows/daily-market-brief.yml']: ok('Dnevni tržišni osvrt ima workflow')
 else: fail('Nedostaje workflow dnevnog osvrta')
def check_seo():
 tokens=['<title>','name="description"','name="robots"','rel="canonical"','property="og:title"','property="og:description"','property="og:url"','property="og:image"','property="og:image:type" content="image/png"','name="twitter:card"','name="twitter:image"','type="application/ld+json"','SEO:BEGIN generated by scripts/generate_seo.py']
 for file,url in PAGES:
  html=(ROOT/file).read_text(encoding='utf-8'); missing=[t for t in tokens if t not in html]
  if missing: fail(f'SEO paket nije potpun za {file}: {missing}')
  elif f'href="{url}"' not in html or f'content="{url}"' not in html or IMAGE not in html: fail('Canonical ili PNG social preview nije usklađen za '+file)
  else: ok('Potpuni SEO paket: '+file)
 sitemap=(ROOT/'sitemap.xml').read_text(encoding='utf-8'); missing=[url for _,url in PAGES if url not in sitemap]
 if missing: fail('Sitemap nema sve javne rute: '+', '.join(missing))
 else: ok('Sitemap sadrži svih četrnaest javnih ruta')
 robots=(ROOT/'robots.txt').read_text(encoding='utf-8')
 if 'Disallow: /gnk-asg/admin/' in robots and SITE+'sitemap.xml' in robots: ok('Robots politika zadržava admin izvan indeksa')
 else: fail('Robots politika nije ispravna')
def check_network():
 network=load(DATA/'group_network.json') or {}; geo=load(DATA/'group_network_geo.json') or {}; nodes=network.get('nodes',[]); total=len(nodes)+(1 if network.get('center') else 0)
 if total==network.get('counts',{}).get('expanded_total')==45: ok('3D korporativna mreža ima 45 lokacija')
 else: fail('3D korporativna mreža nije potpuna')
 missing=[n.get('id') for n in nodes if n.get('id') not in geo.get('nodes',{})]
 if geo.get('center',{}).get('id')==network.get('center',{}).get('id') and not missing: ok('Sve lokacije imaju 3D koordinate')
 else: fail('Nedostaju 3D koordinate: '+str(missing))
def check_data(post_fetch):
 news=load(DATA/'news.json'); market=load(DATA/'market.json') or {}; btc=load(DATA/'btc_chart.json') or {}; macro=load(DATA/'macro_market.json') or {}; stable=load(DATA/'stablecoins.json') or {}; exchanges=load(DATA/'exchange_compare.json') or {}; indices=load(DATA/'market_indices.json') or {}; fast=load(DATA/'fast_market_status.json') or {}; brief=load(DATA/'daily_market_brief.json') or {}; monitor=load(DATA/'media_monitor_status.json') or {}; hourly=load(DATA/'update_status.json') or {}
 if isinstance(news,list) and 0<len(news)<=1000: ok(f'Vijesti su dostupne: {len(news)} stavki')
 else: fail('Vijesti nedostaju ili prelaze limit')
 if len(market.get('coins',[]))>=8: ok(f'Digital Assets sadrži {len(market.get("coins",[]))} valuta')
 elif post_fetch: fail('Digital Assets nema najmanje osam valuta')
 if len(btc.get('prices',[]))>=7: ok(f'BTC graf sadrži {len(btc.get("prices",[]))} točaka')
 elif post_fetch: fail('BTC graf nije popunjen')
 if all(key in macro.get('assets',{}) for key in ['btc','gold','oil','usd']): ok('Makro usporedba sadrži BTC, zlato, Brent i USD/EUR')
 else: fail('Makro usporedba nije potpuna')
 if post_fetch:
  if len(stable.get('stablecoins',[]))>=3: ok(f'Stablecoin monitor sadrži {len(stable.get("stablecoins",[]))} tokena')
  else: fail('Stablecoin monitor nema dovoljno opažanja')
  if len(exchanges.get('exchanges',[]))>=1: ok(f'Usporedba burzi sadrži {len(exchanges.get("exchanges",[]))} izvora')
  else: fail('Usporedba burzi je prazna')
  if len(indices.get('indices',[]))>=3: ok(f'Globalni indeksi sadrže {len(indices.get("indices",[]))} tržišta')
  else: fail('Usporedba indeksa nema dovoljno tržišta')
  if not fast.get('errors') and fast.get('digital_assets',{}).get('coins',0)>=8 and fast.get('cadence')=='scheduled every five minutes': ok('Petominutni status potvrđuje tržišni dohvat')
  else: fail('Petominutni tržišni status sadrži pogrešku')
  if 'market' not in hourly and hourly.get('news',{}).get('public_items',0)>0: ok('Satni status potvrđuje odvojeni dohvat vijesti')
  else: fail('Satni status nije odvojen od marketa ili vijesti nisu učitane')
  if brief.get('status')=='published' and len(brief.get('summary',[]))>=3 and len(brief.get('summary_en',[]))>=3: ok('Dnevni stručni osvrt je objavljen dvojezično')
  else: fail('Dnevni stručni osvrt nije potpuno generiran')
  if not macro.get('errors'): ok('Makro tržišni dohvat nema pogrešaka')
  else: fail('Makro tržišni dohvat ima pogreške')
  if monitor.get('status') in {'ok','partial'} and monitor.get('public_display_policy')=='manual_approval_only': ok('Medijski monitor zadržava ručno odobravanje')
  else: fail('Politika media monitora nije ispravna')
def main():
 parser=argparse.ArgumentParser(); parser.add_argument('--post-fetch',action='store_true'); parser.add_argument('--seo',action='store_true'); args=parser.parse_args()
 check_structure(args.seo); check_network(); check_data(args.post_fetch)
 if args.seo: check_seo()
 print(f'\nRezultat: {len(PASSED)} provjera prošlo; {len(ERRORS)} provjera nije prošlo.')
 if ERRORS:
  for err in ERRORS: print(' - '+err,file=sys.stderr)
  return 1
 return 0
if __name__=='__main__': raise SystemExit(main())
