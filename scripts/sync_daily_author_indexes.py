#!/usr/bin/env python3
from __future__ import annotations

import html
import json
import re
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
SITE = "https://gnk-asg.hr"
TZ = ZoneInfo("Europe/Zagreb")
LOG_PATH = ROOT / "data" / "daily_insight_log.json"
INDEX_PATH = ROOT / "insights-hr" / "index.html"
DAILY_INDEX_PATH = ROOT / "insights-hr" / "daily" / "index.html"
SITEMAP_PATH = ROOT / "sitemap.xml"
DEFAULT_IMAGE = SITE + "/assets/gnk-asg-social-card.png"
PUBLISHER = "GNK ASG d.o.o."
FRAMEWORK = "GNK DINAMO Ltd."
EDITOR = "Nermin Sefić"
EDITOR_ASCII = "Nermin Sefic"
CORE_SEO = "Nermin Sefić, Nermin Sefic, GNK ASG, GNK ASG d.o.o., GNK DINAMO Ltd., GNK Dinamo Ltd, GNK ASG Intelligence Desk"


def load_log() -> dict:
    if not LOG_PATH.exists():
        return {"published": []}
    try:
        data = json.loads(LOG_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {"published": []}
    if not isinstance(data, dict):
        return {"published": []}
    data.setdefault("published", [])
    return data


def visible_entries(log: dict) -> list[dict]:
    return [e for e in log.get("published", []) if isinstance(e, dict) and not e.get("hidden")]


def hidden_canonicals(log: dict) -> set[str]:
    return {str(e.get("canonical") or "").strip() for e in log.get("published", []) if isinstance(e, dict) and e.get("hidden") and e.get("canonical")}


def normalize_local_url(local_url: str, daily: bool) -> str:
    local_url = str(local_url or "").strip()
    if not local_url:
        return "#"
    if local_url.startswith(("http://", "https://", "/")):
        return local_url
    if daily and local_url.startswith("daily/"):
        return local_url[len("daily/"):]
    return local_url


def render_cards(entries: list[dict], daily: bool) -> str:
    cards: list[str] = []
    for entry in reversed(entries[-30:]):
        href = normalize_local_url(str(entry.get("local_url") or entry.get("canonical") or "#"), daily)
        cards.append(
            f'''<a class="card insight-card" href="{html.escape(href)}"><div class="meta"><span>{html.escape(str(entry.get('slot_label','Dnevna objava')))}</span><span>{html.escape(str(entry.get('category','Dnevna tema')))}</span><span>{html.escape(str(entry.get('date','')))}</span></div><h2>{html.escape(str(entry.get('title','Dnevna tema')))}</h2><p>{html.escape(str(entry.get('summary','Autorski dnevni osvrt portala GNK ASG.')))}</p><span class="read">Pročitaj objavu →</span></a>'''
        )
    if not cards:
        cards.append('<article class="card"><h2>Objave su u pripremi</h2><p>Dnevne autorske objave bit će prikazane nakon prvog uredničkog ciklusa.</p></article>')
    return "".join(cards)


def render_collection(entries: list[dict], daily: bool) -> str:
    canonical = f"{SITE}/insights-hr/daily/" if daily else f"{SITE}/insights-hr/"
    page_title = "Dnevne poslovne objave | GNK ASG | Nermin Sefić" if daily else "Objave autora | GNK ASG Intelligence Desk | Nermin Sefić"
    description = "Dnevne autorske poslovne i ekonomske objave autora Nermina Sefića s SEO metapodacima, slikom, canonical URL-om i strukturiranim podacima." if daily else "Arhiva autorskih dnevnih objava GNK ASG Intelligence Desk: poslovne teme, tehnologija, tržišta, AI, javne informacije i urednička odgovornost Nermina Sefića."
    css = "../../assets/style.css?v=20260613-author-index" if daily else "../assets/style.css?v=20260613-author-index"
    logo_href = "../../" if daily else "../"
    logo_src = "../../assets/logo-gnk-asg.svg" if daily else "../assets/logo-gnk-asg.svg"
    home_href = "../../" if daily else "../"
    switch_href = "../" if daily else "daily/"
    switch_label = "Objave autora" if daily else "Dnevne objave"
    cards = render_cards(entries, daily)
    item_list = [{"@type": "ListItem", "position": i, "url": e.get("canonical") or f"{SITE}/insights-hr/{e.get('local_url','')}", "name": e.get("title", "Dnevna objava")} for i, e in enumerate(reversed(entries[-30:]), 1)]
    schema = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "@id": canonical + "#collection",
        "url": canonical,
        "name": page_title,
        "description": description,
        "keywords": CORE_SEO + ", objave autora, dnevne objave, poslovne teme, gospodarstvo, tržišta",
        "inLanguage": "hr",
        "isPartOf": {"@type": "WebSite", "name": f"{PUBLISHER} | {FRAMEWORK} | {EDITOR}", "url": SITE + "/"},
        "publisher": {"@type": "Organization", "name": PUBLISHER, "url": SITE + "/"},
        "mainEntity": {"@type": "ItemList", "itemListElement": item_list},
        "about": [{"@type": "Organization", "name": PUBLISHER}, {"@type": "Organization", "name": FRAMEWORK}, {"@type": "Person", "name": EDITOR, "alternateName": [EDITOR_ASCII, "Sefić Nermin", "Sefic Nermin"]}],
    }
    schema_json = html.escape(json.dumps(schema, ensure_ascii=False), quote=False)
    eyebrow = "Dnevne objave" if daily else "Objave autora"
    headline = "Dnevne poslovne objave." if daily else "Najnovije autorske poslovne objave."
    return f'''<!doctype html>
<html lang="hr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{html.escape(page_title)}</title>
<meta name="description" content="{html.escape(description)}">
<meta name="keywords" content="{html.escape(CORE_SEO)}, objave autora, dnevne objave, poslovne teme, gospodarstvo, tržišta">
<meta name="author" content="{PUBLISHER}; {FRAMEWORK}; {EDITOR}">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
<meta name="theme-color" content="#07162d">
<link rel="canonical" href="{canonical}">
<link rel="stylesheet" href="{css}">
<link rel="icon" href="{SITE}/favicon.svg" type="image/svg+xml">
<meta property="og:type" content="website">
<meta property="og:title" content="{html.escape(page_title)}">
<meta property="og:description" content="{html.escape(description)}">
<meta property="og:url" content="{canonical}">
<meta property="og:site_name" content="{PUBLISHER} | {FRAMEWORK} | {EDITOR}">
<meta property="og:locale" content="hr_HR">
<meta property="og:image" content="{DEFAULT_IMAGE}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{html.escape(page_title)}">
<meta name="twitter:description" content="{html.escape(description)}">
<meta name="twitter:image" content="{DEFAULT_IMAGE}">
<script type="application/ld+json">{schema_json}</script>
<style>.hero{{background:linear-gradient(135deg,#07162d,#143b6d);color:#fff;padding:62px 0 36px}}.hero h1{{font-family:Georgia,serif;font-size:clamp(2.3rem,6vw,4.4rem);font-weight:500;margin:8px 0 14px}}.hero p{{max-width:860px;color:#dbe7f5;line-height:1.7}}.grid{{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;padding:42px 0 76px}}.card{{display:block;background:#fff;border:1px solid #dce5f0;border-radius:24px;padding:24px;color:#07162d;text-decoration:none;box-shadow:0 14px 36px rgba(7,22,45,.07)}}.grid .card:first-child{{border-top:4px solid #d4af37}}.meta{{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:12px}}.meta span{{font-size:.66rem;font-weight:900;text-transform:uppercase;border:1px solid rgba(180,126,30,.35);border-radius:999px;padding:7px 10px;color:#7c5616;background:#fffaf0}}.card h2{{font-size:1.23rem;line-height:1.18}}.card p{{color:#64748b;line-height:1.6}}.read{{font-weight:900;color:#143b6d}}.note{{margin-top:-40px;margin-bottom:60px;padding:18px;border-radius:18px;background:#f7f9fc;color:#52647b}}@media(max-width:980px){{.grid{{grid-template-columns:1fr}}}}</style>
</head>
<body>
<header class="site-header"><div class="container nav"><a class="brand" href="{logo_href}"><img src="{logo_src}" alt="{PUBLISHER}"></a><nav class="nav-links"><a href="{home_href}">Početna</a><a href="{switch_href}">{switch_label}</a><a href="{home_href}sadrzaj/">Sadržaj</a><a href="{home_href}teme/">Teme</a></nav></div></header>
<main>
<section class="hero"><div class="container"><p class="eyebrow">{eyebrow}</p><h1>{headline}</h1><p>{html.escape(description)}</p></div></section>
<section class="container grid">{cards}</section>
<div class="container note"><strong>Urednička napomena:</strong> Objave su informativni poslovni osvrti i ne predstavljaju pravni, porezni, financijski ili investicijski savjet. Urednička odgovornost: {EDITOR}. Izdavač: {PUBLISHER}. Javni sadržajni okvir: {FRAMEWORK}.</div>
</main>
<footer><div class="container"><p>© 2026 {PUBLISHER} · {FRAMEWORK} · {EDITOR}</p></div></footer>
</body>
</html>'''


def sitemap_block(url: str, lastmod: str, changefreq: str = "monthly", priority: str = "0.8") -> str:
    return f'''  <url>
    <loc>{url}</loc>
    <lastmod>{lastmod}</lastmod>
    <changefreq>{changefreq}</changefreq>
    <priority>{priority}</priority>
  </url>
'''


def update_sitemap(entries: list[dict], log: dict) -> None:
    if not SITEMAP_PATH.exists():
        return
    text = SITEMAP_PATH.read_text(encoding="utf-8")
    hidden = hidden_canonicals(log)
    if hidden:
        text = re.sub(r"\s*<url>[\s\S]*?</url>", lambda m: "" if any(url in m.group(0) for url in hidden) else m.group(0), text)
    lastmod = datetime.now(TZ).date().isoformat()
    required = [
        (f"{SITE}/insights-hr/", "daily", "0.9"),
        (f"{SITE}/insights-hr/daily/", "daily", "0.9"),
    ]
    required += [(str(e.get("canonical")), "monthly", "0.8") for e in entries if e.get("canonical")]
    insert = ""
    for url, freq, priority in required:
        if url and f"<loc>{url}</loc>" not in text:
            insert += sitemap_block(url, lastmod, freq, priority)
    if insert:
        marker = "<!-- SEO:FOCUS:SITEMAP:END -->"
        if marker in text:
            text = text.replace(marker, insert + marker, 1)
        else:
            text = text.replace("</urlset>", insert + "</urlset>", 1)
    SITEMAP_PATH.write_text(text, encoding="utf-8")


def main() -> int:
    log = load_log()
    entries = visible_entries(log)
    INDEX_PATH.parent.mkdir(parents=True, exist_ok=True)
    DAILY_INDEX_PATH.parent.mkdir(parents=True, exist_ok=True)
    INDEX_PATH.write_text(render_collection(entries, daily=False), encoding="utf-8")
    DAILY_INDEX_PATH.write_text(render_collection(entries, daily=True), encoding="utf-8")
    update_sitemap(entries, log)
    print(f"Synced author indexes; visible_entries={len(entries)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
