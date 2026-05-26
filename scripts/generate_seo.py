#!/usr/bin/env python3
from __future__ import annotations
import json, re
from datetime import datetime, timezone
from pathlib import Path
from xml.sax.saxutils import escape
ROOT = Path(__file__).resolve().parents[1]
SITE = 'https://gnk-asg.hr/'
IMAGE = SITE + 'assets/gnk-asg-social-card.png'
TODAY = datetime.now(timezone.utc).date().isoformat()
ORG_ID = SITE + '#gnk-asg'
GROUP_ID = SITE + '#gnk-dinamo-ltd'
PERSON_ID = SITE + '#nermin-sefic'
WEBSITE_ID = SITE + '#website'
KEYWORDS_HR = 'GNK ASG d.o.o., GNK ASG doo, GNK ASG, GNK DINAMO Ltd., GNK DINAMO LTD, GNK Dinamo Ltd, GNK Dinamo grupa, Nermin Sefić, Nermin Sefic, korporativni portal, financijski pokazatelji, javni registri, tehnologija, umjetna inteligencija, Market Intelligence'
KEYWORDS_EN = 'GNK ASG d.o.o., GNK ASG doo, GNK ASG, GNK DINAMO Ltd., GNK DINAMO LTD, GNK Dinamo Ltd, GNK Dinamo group, Nermin Sefić, Nermin Sefic, corporate portal, financial indicators, public registries, technology, artificial intelligence, Market Intelligence'
ENTITY_HR = 'GNK ASG d.o.o., GNK DINAMO Ltd. i Nermin Sefić.'
ENTITY_EN = 'GNK ASG d.o.o., GNK DINAMO Ltd. and Nermin Sefić.'
PAGES = [
 {'path':'','file':'index.html','lang':'hr','locale':'hr_HR','changefreq':'daily','priority':'1.0','alt':('','en/'),'title':'GNK ASG d.o.o. | GNK DINAMO Ltd. grupa | Nermin Sefić','description':'Službeni korporativni portal: GNK ASG d.o.o., GNK DINAMO Ltd. grupni okvir i Nermin Sefić; financijski pokazatelji, globalna mreža društava, tehnologija, tržišta i vijesti.','type':'WebPage','name':'GNK ASG d.o.o. — Korporativni portal GNK DINAMO Ltd. grupe','crumb':'Početna'},
 {'path':'en/','file':'en/index.html','lang':'en','locale':'en_US','changefreq':'weekly','priority':'0.9','alt':('','en/'),'title':'GNK ASG d.o.o. | GNK DINAMO Ltd. Group | Nermin Sefić','description':'Official corporate portal for GNK ASG d.o.o., the GNK DINAMO Ltd. group framework and Nermin Sefić: financial indicators, global network, technology, markets and news.','type':'WebPage','name':'GNK ASG d.o.o. — GNK DINAMO Ltd. Group Corporate Portal','crumb':'Home'},
 {'path':'trzista/','file':'trzista/index.html','lang':'hr','locale':'hr_HR','changefreq':'daily','priority':'0.9','alt':('trzista/','en/markets/'),'title':'Market Intelligence | GNK ASG d.o.o. i GNK DINAMO Ltd. | Nermin Sefić','description':'Market Intelligence portal za GNK ASG d.o.o., GNK DINAMO Ltd. i Nermina Sefića: digitalna imovina, stablecoini, burze, globalni indeksi i dnevni tržišni osvrt.','type':'CollectionPage','name':'Market Intelligence — GNK ASG d.o.o. i GNK DINAMO Ltd.','crumb':'Tržišta'},
 {'path':'en/markets/','file':'en/markets/index.html','lang':'en','locale':'en_US','changefreq':'daily','priority':'0.9','alt':('trzista/','en/markets/'),'title':'Market Intelligence | GNK ASG d.o.o. and GNK DINAMO Ltd. | Nermin Sefić','description':'Market Intelligence for GNK ASG d.o.o., GNK DINAMO Ltd. and Nermin Sefić: digital assets, stablecoins, exchanges, global indices and a daily market brief.','type':'CollectionPage','name':'Market Intelligence — GNK ASG d.o.o. and GNK DINAMO Ltd.','crumb':'Markets'},
 {'path':'sadrzaj/','file':'sadrzaj/index.html','lang':'hr','locale':'hr_HR','changefreq':'weekly','priority':'0.8','title':'Sadržaj portala | GNK ASG d.o.o. | GNK DINAMO Ltd. | Nermin Sefić','description':'Pregled javnih sadržaja o subjektima GNK ASG d.o.o., GNK DINAMO Ltd. i Nermin Sefić: financije, mreža društava, tehnologija, registri, tržišni podatci i vijesti.','type':'CollectionPage','name':'Sadržaj portala GNK ASG d.o.o. i GNK DINAMO Ltd.','crumb':'Sadržaj'},
 {'path':'financije/','file':'financije/index.html','lang':'hr','locale':'hr_HR','changefreq':'weekly','priority':'0.8','alt':('financije/','en/finance/'),'title':'Financijski profil FY 2025 | GNK ASG d.o.o. | GNK DINAMO Ltd. | Nermin Sefić','description':'Javni financijski profil GNK ASG d.o.o. u okviru GNK DINAMO Ltd. grupe i uz javno istaknutog UBO-a Nermina Sefića: prihodi, aktiva, kapital, obveze i dokumentacijska osnova.','type':'WebPage','name':'Financijski profil FY 2025 — GNK ASG d.o.o.','crumb':'Financije'},
 {'path':'en/finance/','file':'en/finance/index.html','lang':'en','locale':'en_US','changefreq':'weekly','priority':'0.8','alt':('financije/','en/finance/'),'title':'Financial Profile FY 2025 | GNK ASG d.o.o. | GNK DINAMO Ltd. | Nermin Sefić','description':'Public FY 2025 financial profile of GNK ASG d.o.o. within the GNK DINAMO Ltd. group framework and publicly stated UBO Nermin Sefić: revenue, assets, equity and liabilities.','type':'WebPage','name':'Financial Profile FY 2025 — GNK ASG d.o.o.','crumb':'Financials'},
 {'path':'tehnologija/','file':'tehnologija/index.html','lang':'hr','locale':'hr_HR','changefreq':'weekly','priority':'0.8','alt':('tehnologija/','en/technology/'),'title':'Tehnologija i AI | GNK ASG d.o.o. | GNK DINAMO Ltd. | Nermin Sefić','description':'Tehnološki profil GNK ASG d.o.o. i GNK DINAMO Ltd. grupe povezane s Nerminom Sefićem: umjetna inteligencija, softverske platforme, analitika i kibernetička sigurnost.','type':'WebPage','name':'Tehnologija i umjetna inteligencija — GNK ASG d.o.o.','crumb':'Tehnologija'},
 {'path':'en/technology/','file':'en/technology/index.html','lang':'en','locale':'en_US','changefreq':'weekly','priority':'0.8','alt':('tehnologija/','en/technology/'),'title':'Technology and AI | GNK ASG d.o.o. | GNK DINAMO Ltd. | Nermin Sefić','description':'Technology profile of GNK ASG d.o.o. and the GNK DINAMO Ltd. group framework associated with Nermin Sefić: artificial intelligence, software platforms, analytics and cyber security.','type':'WebPage','name':'Technology and Artificial Intelligence — GNK ASG d.o.o.','crumb':'Technology'},
 {'path':'intelligence-desk/','file':'intelligence-desk/index.html','lang':'hr','locale':'hr_HR','changefreq':'weekly','priority':'0.8','alt':('intelligence-desk/','en/intelligence-desk/'),'title':'GNK ASG Intelligence Desk | GNK DINAMO Ltd. | Nermin Sefić','description':'GNK ASG Intelligence Desk za javne podatke povezane s GNK ASG d.o.o., GNK DINAMO Ltd. i Nerminom Sefićem: financije, tehnologija, tržišta i javno objavljeni izvori.','type':'WebPage','name':'GNK ASG Intelligence Desk — GNK DINAMO Ltd. i Nermin Sefić','crumb':'Intelligence Desk'},
 {'path':'en/intelligence-desk/','file':'en/intelligence-desk/index.html','lang':'en','locale':'en_US','changefreq':'weekly','priority':'0.8','alt':('intelligence-desk/','en/intelligence-desk/'),'title':'GNK ASG Intelligence Desk | GNK DINAMO Ltd. | Nermin Sefić','description':'GNK ASG Intelligence Desk for public information associated with GNK ASG d.o.o., GNK DINAMO Ltd. and Nermin Sefić: finance, technology, markets and published sources.','type':'WebPage','name':'GNK ASG Intelligence Desk — GNK DINAMO Ltd. and Nermin Sefić','crumb':'Intelligence Desk'},
 {'path':'registri/','file':'registri/index.html','lang':'hr','locale':'hr_HR','changefreq':'weekly','priority':'0.8','alt':('registri/','en/registries/'),'title':'Javni registri | GNK ASG d.o.o. | GNK DINAMO Ltd. | Nermin Sefić','description':'Javni izvori za provjeru podataka o GNK ASG d.o.o., GNK DINAMO Ltd. i Nerminu Sefiću: Sudski registar RH, FINA RGFI, Colorado Business Database, EUIPO i ECB.','type':'CollectionPage','name':'Javni registri i službeni izvori — GNK ASG d.o.o. i GNK DINAMO Ltd.','crumb':'Registri'},
 {'path':'en/registries/','file':'en/registries/index.html','lang':'en','locale':'en_US','changefreq':'weekly','priority':'0.8','alt':('registri/','en/registries/'),'title':'Public Registries | GNK ASG d.o.o. | GNK DINAMO Ltd. | Nermin Sefić','description':'Official public-source directory for reviewing GNK ASG d.o.o., GNK DINAMO Ltd. and Nermin Sefić through Croatian, US, EU and market-data registries.','type':'CollectionPage','name':'Public Registries and Official Sources — GNK ASG d.o.o. and GNK DINAMO Ltd.','crumb':'Registries'},
 {'path':'instalacija/','file':'instalacija/index.html','lang':'hr','locale':'hr_HR','changefreq':'monthly','priority':'0.7','title':'Instaliraj portal | GNK ASG d.o.o. | GNK DINAMO Ltd. | Nermin Sefić','description':'Instalacija korporativnog portala GNK ASG d.o.o. s javnim podatcima o GNK DINAMO Ltd. okviru i Nerminu Sefiću kao aplikacije putem preglednika Google Chrome.','type':'HowTo','name':'Instalacija GNK ASG aplikacije preko Google Chromea','crumb':'Instalacija'}
]
def url(p): return SITE + p['path']
def entities():
 return [
  {'@type':'Organization','@id':ORG_ID,'name':'GNK ASG d.o.o.','alternateName':['GNK ASG doo','GNK ASG'],'url':SITE,'logo':SITE+'assets/logo-gnk-asg.svg','image':IMAGE,'taxID':'75227917632','memberOf':{'@id':GROUP_ID},'address':{'@type':'PostalAddress','streetAddress':'Zagrebačka cesta 130','addressLocality':'Zagreb','addressCountry':'HR'}},
  {'@type':'Organization','@id':GROUP_ID,'name':'GNK DINAMO Ltd.','alternateName':['GNK DINAMO LTD','GNK Dinamo Ltd','GNK DINAMO Ltd. Group'],'url':SITE,'image':IMAGE},
  {'@type':'Person','@id':PERSON_ID,'name':'Nermin Sefić','alternateName':'Nermin Sefic','jobTitle':'Director / authorised representative / UBO of the group','worksFor':{'@id':ORG_ID},'affiliation':{'@id':GROUP_ID}}
 ]
def schema(p):
 u = url(p); keys = KEYWORDS_EN if p['lang']=='en' else KEYWORDS_HR
 item = {'@type':p['type'],'@id':u+'#webpage','url':u,'name':p['name'],'description':p['description'],'keywords':keys,'inLanguage':p['lang'],'isPartOf':{'@id':WEBSITE_ID},'about':[{'@id':ORG_ID},{'@id':GROUP_ID},{'@id':PERSON_ID}],'mentions':[{'@id':ORG_ID},{'@id':GROUP_ID},{'@id':PERSON_ID}],'primaryImageOfPage':{'@type':'ImageObject','url':IMAGE}}
 graph = [{'@type':'WebSite','@id':WEBSITE_ID,'url':SITE,'name':'GNK ASG d.o.o. | GNK DINAMO Ltd. | Nermin Sefić','publisher':{'@id':ORG_ID},'about':[{'@id':ORG_ID},{'@id':GROUP_ID},{'@id':PERSON_ID}],'keywords':keys,'inLanguage':['hr','en']}] + entities() + [item]
 if p['path'] not in ('','en/'):
  item['breadcrumb']={'@id':u+'#breadcrumb'}
  graph.append({'@type':'BreadcrumbList','@id':u+'#breadcrumb','itemListElement':[{'@type':'ListItem','position':1,'name':'GNK ASG d.o.o.','item':SITE},{'@type':'ListItem','position':2,'name':p['crumb'],'item':u}]})
 if p['type']=='HowTo':
  item['step']=[{'@type':'HowToStep','name':'Otvorite portal u Chromeu','text':'Otvorite GNK ASG d.o.o. portal u pregledniku Google Chrome.'},{'@type':'HowToStep','name':'Pokrenite instalaciju','text':'U izborniku preglednika odaberite instalaciju aplikacije ili dodavanje na početni zaslon.'},{'@type':'HowToStep','name':'Potvrdite instalaciju','text':'Potvrdite instalaciju i pokrenite portal kao aplikaciju.'}]
 return {'@context':'https://schema.org','@graph':graph}
def metadata(p):
 u = url(p); other = 'en_US' if p['locale']=='hr_HR' else 'hr_HR'; keys = KEYWORDS_EN if p['lang']=='en' else KEYWORDS_HR
 alt_image = 'GNK ASG d.o.o., GNK DINAMO Ltd. and Nermin Sefić — Corporate Portal' if p['lang']=='en' else 'GNK ASG d.o.o., GNK DINAMO Ltd. i Nermin Sefić — korporativni portal'
 lines = ['<!-- SEO:BEGIN generated by scripts/generate_seo.py -->',f'  <meta name="keywords" content="{escape(keys)}">','  <meta name="author" content="GNK ASG d.o.o.; GNK DINAMO Ltd.; Nermin Sefić">','  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">','  <meta name="theme-color" content="#07162d">',f'  <link rel="canonical" href="{u}">',f'  <meta property="og:title" content="{escape(p["title"])}">',f'  <meta property="og:description" content="{escape(p["description"])}">','  <meta property="og:type" content="website">',f'  <meta property="og:url" content="{u}">','  <meta property="og:site_name" content="GNK ASG d.o.o. | GNK DINAMO Ltd. | Nermin Sefić">',f'  <meta property="og:locale" content="{p["locale"]}">',f'  <meta property="og:locale:alternate" content="{other}">',f'  <meta property="og:image" content="{IMAGE}">','  <meta property="og:image:type" content="image/png">','  <meta property="og:image:width" content="1200">','  <meta property="og:image:height" content="630">',f'  <meta property="og:image:alt" content="{escape(alt_image)}">','  <meta name="twitter:card" content="summary_large_image">',f'  <meta name="twitter:title" content="{escape(p["title"])}">',f'  <meta name="twitter:description" content="{escape(p["description"])}">',f'  <meta name="twitter:image" content="{IMAGE}">',f'  <meta name="twitter:image:alt" content="{escape(alt_image)}">']
 if p.get('alt'):
  hr, en = p['alt']; lines += [f'  <link rel="alternate" hreflang="hr" href="{SITE+hr}">',f'  <link rel="alternate" hreflang="en" href="{SITE+en}">',f'  <link rel="alternate" hreflang="x-default" href="{SITE+hr}">']
 lines += ['  <script type="application/ld+json">'+json.dumps(schema(p),ensure_ascii=False,separators=(',',':'))+'</script>','<!-- SEO:END -->']
 return '\n'.join(lines)
def enhance(p):
 target = ROOT / p['file']; html = target.read_text(encoding='utf-8')
 html = re.sub(r'\s*<!-- SEO:BEGIN generated by scripts/generate_seo\.py -->.*?<!-- SEO:END -->\s*','\n',html,flags=re.S)
 html = re.sub(r'<title>.*?</title>','<title>'+p['title']+'</title>',html,count=1,flags=re.S)
 html = re.sub(r'<meta\s+name="description"\s+content="[^"]*"\s*/?>','<meta name="description" content="'+p['description']+'">',html,count=1)
 html = re.sub(r'\s*<meta\s+name="(?:keywords|author|robots|theme-color|twitter:[^"]+)"[^>]*>','',html)
 html = re.sub(r'\s*<meta\s+property="og:[^"]+"[^>]*>','',html)
 html = re.sub(r'\s*<link\s+rel="(?:canonical|alternate)"[^>]*>','',html)
 html = re.sub(r'\s*<script\s+type="application/ld\+json">.*?</script>','',html,flags=re.S)
 html = html.replace('</head>','\n'+metadata(p)+'\n</head>',1)
 target.write_text(html,encoding='utf-8')
def entry(p):
 lines = ['  <url>','    <loc>'+escape(url(p))+'</loc>']
 if p.get('alt'):
  hr, en = p['alt']; lines += [f'    <xhtml:link rel="alternate" hreflang="hr" href="{escape(SITE+hr)}" />',f'    <xhtml:link rel="alternate" hreflang="en" href="{escape(SITE+en)}" />',f'    <xhtml:link rel="alternate" hreflang="x-default" href="{escape(SITE+hr)}" />']
 lines += [f'    <lastmod>{TODAY}</lastmod>',f'    <changefreq>{p["changefreq"]}</changefreq>',f'    <priority>{p["priority"]}</priority>','  </url>']
 return '\n'.join(lines)
for page in PAGES: enhance(page)
(ROOT/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'+'\n'.join(entry(p) for p in PAGES)+'\n</urlset>\n',encoding='utf-8')
(ROOT/'robots.txt').write_text('User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /webmail/\n\nSitemap: '+SITE+'sitemap.xml\n',encoding='utf-8')
