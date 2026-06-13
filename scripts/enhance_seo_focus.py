#!/usr/bin/env python3
from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parents[1]
SITE = "https://gnk-asg.hr/"
TODAY = datetime.now(timezone.utc).date().isoformat()
MATRIX_PATH = ROOT / "data" / "seo_focus_matrix.json"
DAILY_LOG_PATH = ROOT / "data" / "daily_insight_log.json"
SITEMAP_PATH = ROOT / "sitemap.xml"
ROBOTS_PATH = ROOT / "robots.txt"
LLMS_PATH = ROOT / "llms.txt"

BASE_SITEMAP_PAGES = [
    {"path": "", "priority": "1.0", "changefreq": "daily"},
    {"path": "en/", "priority": "0.9", "changefreq": "weekly"},
    {"path": "nermin-sefic/", "priority": "0.9", "changefreq": "weekly"},
    {"path": "en/nermin-sefic/", "priority": "0.9", "changefreq": "weekly"},
    {"path": "trzista/", "priority": "0.9", "changefreq": "daily"},
    {"path": "en/markets/", "priority": "0.9", "changefreq": "daily"},
    {"path": "financije/", "priority": "0.8", "changefreq": "weekly"},
    {"path": "tehnologija/", "priority": "0.8", "changefreq": "weekly"},
    {"path": "intelligence-desk/", "priority": "0.8", "changefreq": "weekly"},
    {"path": "registri/", "priority": "0.8", "changefreq": "weekly"},
    {"path": "sadrzaj/", "priority": "0.8", "changefreq": "weekly"},
    {"path": "teme/", "priority": "0.8", "changefreq": "daily"},
]

PAGES = [
    {"path": "kontakt/", "file": "kontakt/index.html", "title": "Kontakt | GNK ASG d.o.o. | Nermin Sefić | IT osobni digitalni asistent", "description": "Službena kontakt stranica GNK ASG d.o.o.: kontakt forma, info@gnk-asg.hr, IT osobni digitalni asistent, WhatsApp kanal i službena poslovna komunikacija.", "keywords": "kontakt GNK ASG, GNK ASG kontakt, info@gnk-asg.hr, contact@gnk-asg.hr, IT osobni digitalni asistent, assistant@gnk-asg.hr, Nermin Sefić, Nermin Sefic, službena komunikacija, poslovni upit", "type": "ContactPage", "priority": "0.8", "changefreq": "weekly", "lang": "hr"},
    {"path": "legal.html", "file": "legal.html", "title": "Legal | Impresum, privatnost i uvjeti korištenja | GNK ASG d.o.o.", "description": "Pravna dokumentacija portala GNK ASG d.o.o.: impresum, politika privatnosti, kolačići, uvjeti korištenja, pravna napomena, status podataka i AI napomena.", "keywords": "GNK ASG legal, GNK ASG impresum, politika privatnosti, kolačići, uvjeti korištenja, pravna napomena, status podataka, AI napomena, GDPR, GNK ASG d.o.o.", "type": "WebPage", "priority": "0.7", "changefreq": "monthly", "lang": "hr"},
    {"path": "insights-hr/", "file": "insights-hr/index.html", "title": "Objave autora | GNK ASG Intelligence Desk | Nermin Sefić", "description": "Arhiva autorskih dnevnih objava GNK ASG Intelligence Desk: poslovne teme, tehnologija, tržišta, AI, javne informacije i urednička odgovornost Nermina Sefića.", "keywords": "GNK ASG Intelligence Desk, autorske objave, dnevne objave, Nermin Sefić, Nermin Sefic, GNK ASG d.o.o., GNK DINAMO Ltd., poslovne teme, tržišta, AI, tehnologija", "type": "CollectionPage", "priority": "0.9", "changefreq": "daily", "lang": "hr"},
    {"path": "insights-hr/daily/", "file": "insights-hr/daily/index.html", "title": "Dnevne poslovne objave | GNK ASG | Nermin Sefić", "description": "Dnevne autorske poslovne i ekonomske objave autora Nermina Sefića s vlastitim URL-om, slikom, canonical URL-om i strukturiranim podacima.", "keywords": "GNK ASG Intelligence Desk, dnevne objave, poslovne objave, Nermin Sefić, Nermin Sefic, GNK ASG d.o.o., GNK DINAMO Ltd., gospodarstvo, tržišta, kapital", "type": "CollectionPage", "priority": "0.9", "changefreq": "daily", "lang": "hr"},
    {"path": "aplikacija/", "file": "aplikacija/index.html", "title": "GNK ASG aplikacija | Mobilna i desktop verzija | Funkcije za posjetitelje", "description": "Javna mobilna i desktop GNK ASG aplikacija: tržišni monitori, poslovne vijesti, autorske objave, AI asistent, kontakt forma, WhatsApp kanal, legal informacije i instalacija.", "keywords": "GNK ASG aplikacija, mobilna aplikacija, desktop aplikacija, instalacija, AI asistent, tržišni monitor, kontakt forma, WhatsApp kanal, poslovne vijesti, autorske objave, Nermin Sefić", "type": "SoftwareApplication", "priority": "0.8", "changefreq": "weekly", "lang": "hr"},
    {"path": "status/", "file": "status/index.html", "title": "Status Center | GNK ASG d.o.o. | Portal, kontakt, mail, tržišta i AI", "description": "GNK ASG Status Center prikazuje javni status portala, kontakt forme, mail modula, poslovnih vijesti, tržišnih podataka, AI asistenta i aplikacijskog sloja.", "keywords": "GNK ASG status, status center, kontakt forma status, mail status, market data status, poslovne vijesti status, AI asistent status, LIVE SNAPSHOT DELAYED FALLBACK", "type": "WebPage", "priority": "0.8", "changefreq": "daily", "lang": "hr"},
]


def load_matrix() -> dict:
    try:
        return json.loads(MATRIX_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {}


def load_daily_log() -> dict:
    try:
        data = json.loads(DAILY_LOG_PATH.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {"published": []}
    except Exception:
        return {"published": []}


def visible_daily_entries() -> list[dict]:
    items = []
    for entry in load_daily_log().get("published", []):
        if not isinstance(entry, dict) or entry.get("hidden"):
            continue
        local_url = str(entry.get("local_url") or "").strip()
        if not local_url or not local_url.startswith("daily/"):
            continue
        items.append({"path": "insights-hr/" + local_url, "priority": "0.8", "changefreq": "monthly"})
    return items


def page_url(page: dict) -> str:
    return SITE + page["path"]


def focus_schema(page: dict, matrix: dict) -> dict:
    u = page_url(page)
    about_entities = [
        {"@type": "Organization", "name": "GNK ASG d.o.o.", "url": SITE, "taxID": "75227917632"},
        {"@type": "Organization", "name": "GNK DINAMO Ltd.", "url": SITE},
        {"@type": "Person", "name": "Nermin Sefić", "alternateName": ["Nermin Sefic", "Sefić Nermin", "Sefic Nermin"], "jobTitle": "Direktor / zakonski zastupnik / UBO", "worksFor": {"@type": "Organization", "name": "GNK ASG d.o.o."}},
    ]
    return {"@context": "https://schema.org", "@type": page["type"], "@id": u + "#focused-seo", "url": u, "name": page["title"], "description": page["description"], "keywords": page["keywords"], "inLanguage": page["lang"], "isPartOf": {"@type": "WebSite", "name": "GNK ASG d.o.o. | GNK DINAMO Ltd. | Nermin Sefić", "url": SITE}, "about": about_entities, "mentions": about_entities, "mainEntity": about_entities[2] if "nermin" in page["keywords"].lower() or page["path"].startswith("insights-hr") else about_entities[0], "knowsAbout": (matrix.get("core_topics_hr") or [])[:18]}


def seo_block(page: dict, matrix: dict) -> str:
    u = page_url(page)
    schema = json.dumps(focus_schema(page, matrix), ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    return "\n".join([
        "<!-- SEO:FOCUS:BEGIN generated by scripts/enhance_seo_focus.py -->",
        f'  <meta name="keywords" content="{escape(page["keywords"])}">',
        '  <meta name="author" content="GNK ASG d.o.o.; GNK DINAMO Ltd.; Nermin Sefić">',
        '  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">',
        '  <meta name="theme-color" content="#07162d">',
        f'  <link rel="canonical" href="{u}">',
        f'  <meta property="og:title" content="{escape(page["title"])}">',
        f'  <meta property="og:description" content="{escape(page["description"])}">',
        '  <meta property="og:type" content="website">',
        f'  <meta property="og:url" content="{u}">',
        '  <meta property="og:site_name" content="GNK ASG d.o.o. | GNK DINAMO Ltd. | Nermin Sefić">',
        '  <meta property="og:locale" content="hr_HR">',
        f'  <meta property="og:image" content="{SITE}assets/gnk-asg-social-card.png">',
        '  <meta name="twitter:card" content="summary_large_image">',
        f'  <meta name="twitter:title" content="{escape(page["title"])}">',
        f'  <meta name="twitter:description" content="{escape(page["description"])}">',
        f'  <script type="application/ld+json">{schema}</script>',
        "<!-- SEO:FOCUS:END -->",
    ])


def enhance_page(page: dict, matrix: dict) -> None:
    path = ROOT / page["file"]
    if not path.exists():
        return
    content = path.read_text(encoding="utf-8")
    content = re.sub(r"\s*<!-- SEO:FOCUS:BEGIN generated by scripts/enhance_seo_focus\.py -->.*?<!-- SEO:FOCUS:END -->\s*", "\n", content, flags=re.S)
    content = re.sub(r"<title>.*?</title>", "<title>" + page["title"] + "</title>", content, count=1, flags=re.S)
    if re.search(r'<meta\s+name="description"\s+content="[^"]*"\s*/?>', content):
        content = re.sub(r'<meta\s+name="description"\s+content="[^"]*"\s*/?>', '<meta name="description" content="' + page["description"] + '">', content, count=1)
    else:
        content = content.replace("</head>", '<meta name="description" content="' + page["description"] + '">\n</head>', 1)
    content = content.replace("</head>", "\n" + seo_block(page, matrix) + "\n</head>", 1)
    path.write_text(content, encoding="utf-8")


def sitemap_entries() -> str:
    all_pages = BASE_SITEMAP_PAGES + PAGES + visible_daily_entries()
    entries = []
    seen = set()
    for page in all_pages:
        url = SITE + page["path"]
        if url in seen:
            continue
        seen.add(url)
        entries.append("\n".join(["  <url>", "    <loc>" + escape(url) + "</loc>", "    <lastmod>" + TODAY + "</lastmod>", "    <changefreq>" + page.get("changefreq", "monthly") + "</changefreq>", "    <priority>" + page.get("priority", "0.7") + "</priority>", "  </url>"]))
    return "\n".join(entries)


def update_sitemap() -> None:
    content = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + sitemap_entries() + "\n</urlset>\n"
    SITEMAP_PATH.write_text(content, encoding="utf-8")


def update_robots() -> None:
    text = ROBOTS_PATH.read_text(encoding="utf-8") if ROBOTS_PATH.exists() else "User-agent: *\nAllow: /\n"
    if "Sitemap: " + SITE + "sitemap.xml" not in text:
        text += "\nSitemap: " + SITE + "sitemap.xml\n"
    ROBOTS_PATH.write_text(text, encoding="utf-8")


def write_llms(matrix: dict) -> None:
    lines = ["# GNK ASG d.o.o. — public AI/search context", "", "Official site: https://gnk-asg.hr/", "Company: GNK ASG d.o.o.", "Registered office: Zagrebačka cesta 130, Zagreb, Croatia", "OIB: 75227917632", "MBS: 081512375", "Director / legal representative / UBO: Nermin Sefić (Nermin Sefic)", "Associated public framework: GNK DINAMO Ltd.", "", "Primary topics:"]
    for item in matrix.get("core_topics_en") or []:
        lines.append("- " + item)
    lines += ["", "Important public pages:"]
    for page in BASE_SITEMAP_PAGES + PAGES:
        lines.append("- " + SITE + page["path"])
    for page in visible_daily_entries()[:10]:
        lines.append("- " + SITE + page["path"])
    LLMS_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> int:
    matrix = load_matrix()
    for page in PAGES:
        enhance_page(page, matrix)
    update_sitemap()
    update_robots()
    write_llms(matrix)
    print("focused SEO enhanced")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
