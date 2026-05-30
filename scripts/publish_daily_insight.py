#!/usr/bin/env python3
from __future__ import annotations

import html
import json
import os
import re
import unicodedata
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
SITE = "https://gnk-asg.hr"
TZ = ZoneInfo("Europe/Zagreb")
POSTS_DIR = ROOT / "insights-hr"
NEWS_PATH = ROOT / "data" / "news.json"
LOG_PATH = ROOT / "data" / "daily_insight_log.json"
INDEX_PATH = POSTS_DIR / "index.html"
DEFAULT_IMAGE = SITE + "/assets/gnk-asg-social-card.png"
AUTHOR = "GNK ASG Intelligence Desk"
EDITOR = "Nermin Sefić"
PUBLISHER = "GNK ASG d.o.o."
FRAMEWORK = "GNK DINAMO Ltd."

SLOTS = {
    9: "morning",
    15: "afternoon",
    21: "evening",
}
SLOT_LABELS = {
    "morning": "Jutarnja objava",
    "afternoon": "Objava u 15:00",
    "evening": "Objava u 21:00",
}
BLOCKED_SOURCES = ("wikipedia", "wikimedia", "wikiquote", "wikinews")


def slugify(value: str, max_len: int = 72) -> str:
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    value = re.sub(r"[^a-zA-Z0-9]+", "-", value.lower()).strip("-")
    value = re.sub(r"-+", "-", value)
    return (value[:max_len].strip("-") or "daily-insight")


def load_json(path: Path, fallback):
    if not path.exists():
        return fallback
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return fallback


def save_json(path: Path, value) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def is_blocked(item: dict) -> bool:
    text = " ".join(str(item.get(k, "")) for k in ("source", "url", "title", "summary")).lower()
    return any(bad in text for bad in BLOCKED_SOURCES)


def category_label(item: dict) -> str:
    group = str(item.get("group") or item.get("category") or "vijesti").lower()
    if "tech" in group or "ai" in group:
        return "Tehnologija i AI"
    if "sport" in group:
        return "Sport i ekonomija pažnje"
    if "digital" in group or "crypto" in group:
        return "Digitalna imovina"
    if "mobil" in group or "auto" in group:
        return "Mobilnost i industrija"
    if "hrvatska" in group or "economy" in group or "business" in group:
        return "Ekonomija i poslovanje"
    return "Dnevni globalni kontekst"


def score_item(item: dict, used_urls: set[str]) -> int:
    title = str(item.get("title") or "")
    url = str(item.get("url") or "")
    source = str(item.get("source") or "")
    if not title or not url or url in used_urls or is_blocked(item):
        return -10_000
    score = 0
    trusted = ("Reuters", "Associated Press", "AP", "Financial Times", "The Guardian", "BBC", "CNBC", "TechCrunch", "The Verge", "CoinDesk", "UEFA")
    if any(name.lower() in source.lower() for name in trusted):
        score += 50
    group = str(item.get("group") or item.get("category") or "").lower()
    if any(key in group for key in ("technology", "digital", "economy", "international", "mobil", "sport")):
        score += 30
    if len(title) > 50:
        score += 10
    return score


def pick_item(news: list[dict], log: dict) -> dict | None:
    used_urls = {entry.get("url", "") for entry in log.get("published", []) if isinstance(entry, dict)}
    ranked = sorted(news, key=lambda item: score_item(item, used_urls), reverse=True)
    for item in ranked:
        if score_item(item, used_urls) > 0:
            return item
    return None


def make_article_text(item: dict) -> list[str]:
    title = html.escape(str(item.get("title") or "Dnevna tema"))
    source = html.escape(str(item.get("source") or "javni medijski izvor"))
    summary = html.escape(str(item.get("summary") or item.get("description") or "Tema je odabrana kao jedna od tri dnevne javne objave zbog šireg poslovnog i društvenog značaja."))
    category = category_label(item)
    return [
        f"Današnja tema dolazi iz javnih stranih i institucionalnih izvora, a posebno iz izvora {source}. Polazna informacija glasi: {summary}",
        f"Za GNK ASG portal takva vijest nije važna samo kao dnevna informacija. Ona pokazuje kako se globalni događaji brzo pretvaraju u poslovni, tehnološki, logistički ili društveni signal. Naslov teme, \"{title}\", treba čitati u širem kontekstu kategorije {html.escape(category)}.",
        "U suvremenom poslovnom okruženju dnevne vijesti imaju vrijednost tek kada ih se poveže s posljedicama. Jedna objava može utjecati na percepciju tržišta, trošak kapitala, ponašanje potrošača, sigurnost dobavnih lanaca, tehnološke odluke ili reputaciju organizacija. Zato je važno razlikovati puko prenošenje naslova od uredničkog objašnjenja značenja.",
        "Ovaj osvrt ne zamjenjuje izvorni medijski tekst. Njegova je svrha izdvojiti zašto je tema relevantna i kako se može razumjeti u poslovnom okviru. Takav pristup pomaže čitatelju da brže vidi što je činjenica, što je trend, a što moguća posljedica za tržište, javnost ili institucije.",
        "Najvažnija poruka današnje objave jest da javne informacije treba čitati povezano. Kada se vijest stavi u kontekst, ona prestaje biti izolirana novost i postaje dio šire slike o ekonomiji, tehnologiji, Europi, sportu, energiji, mobilnosti ili društvu. Upravo zato GNK ASG objavljuje tri dnevna autorska osvrta: kratko, jasno, provjerljivo i bez oslanjanja na Wikipediju.",
    ]


def render_article(item: dict, slot: str, now: datetime, slug: str) -> str:
    raw_title = str(item.get("title") or "Dnevna tema")
    title = html.escape(raw_title)
    source = html.escape(str(item.get("source") or "javni izvor"))
    url = html.escape(str(item.get("url") or "#"))
    category = html.escape(category_label(item))
    date_iso = now.date().isoformat()
    canonical = f"{SITE}/insights-hr/daily/{slug}/"
    desc = html.escape(f"Autorski dnevni osvrt GNK ASG Intelligence Desk: {raw_title}"[:155])
    paragraphs = "".join(f"<p>{p}</p>" for p in make_article_text(item))
    return f'''<!doctype html><html lang="hr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{title} | GNK ASG dnevna objava</title><meta name="description" content="{desc}"><meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"><link rel="canonical" href="{canonical}"><link rel="stylesheet" href="../../../assets/style.css?v=20260523-8"><link rel="icon" href="{SITE}/favicon.svg" type="image/svg+xml"><meta property="og:title" content="{title}"><meta property="og:description" content="{desc}"><meta property="og:type" content="article"><meta property="og:url" content="{canonical}"><meta property="og:image" content="{DEFAULT_IMAGE}"><script type="application/ld+json">{{"@context":"https://schema.org","@type":"Article","headline":{json.dumps(raw_title, ensure_ascii=False)},"datePublished":"{date_iso}","dateModified":"{date_iso}","inLanguage":"hr","author":{{"@type":"Organization","name":"{AUTHOR}"}},"editor":{{"@type":"Person","name":"{EDITOR}"}},"publisher":{{"@type":"Organization","name":"{PUBLISHER}","url":"{SITE}/"}},"mainEntityOfPage":"{canonical}"}}</script><style>.wrap{{max-width:930px;margin:auto;padding:48px 18px 80px}}.card{{background:#fff;border:1px solid #dce5f0;border-radius:28px;padding:34px;box-shadow:0 18px 54px rgba(7,22,45,.08)}}.meta{{display:flex;gap:8px;flex-wrap:wrap}}.meta span{{font-size:12px;font-weight:900;text-transform:uppercase;border:1px solid rgba(180,126,30,.35);border-radius:999px;padding:7px 10px;color:#7c5616;background:#fffaf0}}h1{{font-size:clamp(34px,5vw,58px);line-height:1.03;color:#07162d}}.lead{{font-size:19px;line-height:1.65;color:#40516b}}.body p{{font-size:18px;line-height:1.78;color:#23364e}}.box{{background:#f7f9fc;border-left:4px solid #ad7d20;border-radius:18px;padding:18px;margin:22px 0}}.back{{font-weight:900;color:#143b6d;text-decoration:none}}</style></head><body><header class="site-header"><div class="container nav"><a class="brand" href="../../../"><img src="../../../assets/logo-gnk-asg.svg" alt="GNK ASG d.o.o."></a><nav class="nav-links"><a href="../../">Objave autora</a><a href="../../../sadrzaj/">Sadržaj</a><a href="../../../teme/">Teme</a></nav></div></header><main class="wrap"><article class="card"><div class="meta"><span>{SLOT_LABELS.get(slot, 'Dnevna objava')}</span><span>{category}</span><span>{date_iso}</span></div><h1>{title}</h1><p class="lead">Tri dnevne objave portala GNK ASG izdvajaju teme koje imaju širi poslovni, društveni, tehnološki ili europski značaj.</p><div class="box"><strong>Autor:</strong> {AUTHOR}<br><strong>Urednička odgovornost:</strong> {EDITOR}<br><strong>Izdavač:</strong> {PUBLISHER}<br><strong>Okvir javnog sadržaja:</strong> {FRAMEWORK}</div><div class="body">{paragraphs}</div><div class="box"><strong>Informativna osnova:</strong> javna objava izvora {source}. Izvorni tekst: <a href="{url}" target="_blank" rel="noopener">otvori izvor</a>. Wikipedija nije korištena kao izvor.</div><div class="box"><strong>Napomena:</strong> Tekst je informativni autorski osvrt. Ne predstavlja pravno, porezno, financijsko ili investicijsko savjetovanje.</div><a class="back" href="../../">← Povratak na objave autora</a></article></main><script src="../../../assets/app.js?v=20260523-8"></script></body></html>'''


def render_index(log: dict) -> str:
    items = list(reversed(log.get("published", [])))[:30]
    cards = []
    for entry in items:
        cards.append(f'''<a class="card" href="{html.escape(entry['local_url'])}"><div class="meta"><span>{html.escape(entry.get('slot_label','Dnevna objava'))}</span><span>{html.escape(entry.get('category','Dnevna tema'))}</span><span>{html.escape(entry.get('date',''))}</span></div><h2>{html.escape(entry.get('title','Dnevna tema'))}</h2><p>{html.escape(entry.get('summary','Autorski dnevni osvrt portala GNK ASG.'))}</p><span class="read">Pročitaj objavu →</span></a>''')
    if not cards:
        cards.append('<article class="card"><h2>Objave su u pripremi</h2><p>Tri dnevne autorske objave bit će prikazane nakon prvog automatskog ciklusa.</p></article>')
    cards_html = "".join(cards)
    return f'''<!doctype html><html lang="hr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Objave autora | GNK ASG d.o.o.</title><meta name="description" content="Centralna arhiva autorskih objava GNK ASG portala: tri najzanimljivije dnevne teme, Europa, sport, tehnologija, AI i korporativna komunikacija."><meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"><link rel="canonical" href="{SITE}/insights-hr/"><link rel="stylesheet" href="../assets/style.css?v=20260523-8"><link rel="icon" href="{SITE}/favicon.svg" type="image/svg+xml"><meta property="og:title" content="Objave autora | GNK ASG d.o.o."><meta property="og:description" content="Jedno mjesto za tri dnevne autorske objave i GNK ASG Insights tekstove."><meta property="og:type" content="website"><meta property="og:url" content="{SITE}/insights-hr/"><meta property="og:image" content="{DEFAULT_IMAGE}"><script type="application/ld+json">{{"@context":"https://schema.org","@type":"CollectionPage","name":"Objave autora","url":"{SITE}/insights-hr/","description":"Centralna arhiva autorskih objava GNK ASG portala s tri najzanimljivije dnevne teme.","publisher":{{"@type":"Organization","name":"{PUBLISHER}","url":"{SITE}/"}}}}</script><style>.hero{{background:linear-gradient(135deg,#07162d,#143b6d);color:#fff;padding:62px 0 36px}}.hero h1{{font-family:Georgia,serif;font-size:clamp(2.3rem,6vw,4.4rem);font-weight:500;margin:8px 0 14px}}.hero p{{max-width:850px;color:#dbe7f5;line-height:1.7}}.grid{{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;padding:42px 0 76px}}.card{{display:block;background:#fff;border:1px solid #dce5f0;border-radius:24px;padding:24px;color:#07162d;text-decoration:none;box-shadow:0 14px 36px rgba(7,22,45,.07)}}.meta{{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:12px}}.meta span{{font-size:.66rem;font-weight:900;text-transform:uppercase;border:1px solid rgba(180,126,30,.35);border-radius:999px;padding:7px 10px;color:#7c5616;background:#fffaf0}}.card h2{{font-size:1.23rem;line-height:1.18}}.card p{{color:#64748b;line-height:1.6}}.read{{font-weight:900;color:#143b6d}}.note{{margin-top:-40px;margin-bottom:60px;padding:18px;border-radius:18px;background:#f7f9fc;color:#52647b}}@media(max-width:980px){{.grid{{grid-template-columns:1fr}}}}</style></head><body><header class="site-header"><div class="container nav"><a class="brand" href="../"><img src="../assets/logo-gnk-asg.svg" alt="GNK ASG d.o.o."></a><nav class="nav-links"><a href="../">Početna</a><a href="../sadrzaj/">Sadržaj</a><a href="../teme/">Teme</a><a href="../en/insights/">EN Insights</a></nav></div></header><main><section class="hero"><div class="container"><p class="eyebrow">Objave autora</p><h1>Tri najzanimljivije dnevne teme.</h1><p>Rubrika objavljuje jednu jutarnju objavu, jednu u 15:00 i jednu u 21:00 po Zagrebu. Svaki tekst ima vlastitu stranicu, autora, uredničku odgovornost, datum objave, meta opis, canonical URL i strukturirane podatke za tražilice.</p></div></section><section class="container grid">{cards_html}</section><div class="container note"><strong>Urednička napomena:</strong> Objave su informativne i autorske. Kao informativna osnova koriste se javne medijske i institucionalne objave. Wikipedija se ne koristi kao izvor.</div></main><footer><div class="container"><p>© 2026 GNK ASG d.o.o. · GNK DINAMO Ltd.</p></div></footer><script src="../assets/app.js?v=20260523-8"></script></body></html>'''


def main() -> int:
    now = datetime.now(TZ)
    forced_slot = os.environ.get("DAILY_INSIGHT_SLOT", "").strip().lower()
    slot = forced_slot or SLOTS.get(now.hour)
    if slot not in set(SLOTS.values()):
        print(f"Not a publishing hour in Europe/Zagreb: {now.isoformat()}")
        return 0
    today = now.date().isoformat()
    log = load_json(LOG_PATH, {"published": []})
    if any(e.get("date") == today and e.get("slot") == slot for e in log.get("published", [])):
        print(f"Already published {slot} for {today}")
        return 0
    news = load_json(NEWS_PATH, [])
    if not isinstance(news, list) or not news:
        print("No data/news.json items available")
        return 0
    item = pick_item(news, log)
    if not item:
        print("No suitable item found")
        return 0
    slug = f"{today}-{slot}-{slugify(str(item.get('title') or 'daily-insight'))}"
    article_dir = POSTS_DIR / "daily" / slug
    article_dir.mkdir(parents=True, exist_ok=True)
    (article_dir / "index.html").write_text(render_article(item, slot, now, slug), encoding="utf-8")
    entry = {
        "date": today,
        "slot": slot,
        "slot_label": SLOT_LABELS.get(slot, "Dnevna objava"),
        "title": str(item.get("title") or "Dnevna tema"),
        "summary": str(item.get("summary") or item.get("description") or "Autorski dnevni osvrt portala GNK ASG.")[:220],
        "source": str(item.get("source") or ""),
        "url": str(item.get("url") or ""),
        "category": category_label(item),
        "local_url": f"daily/{slug}/",
        "canonical": f"{SITE}/insights-hr/daily/{slug}/",
    }
    log.setdefault("published", []).append(entry)
    log["updated_at"] = now.isoformat()
    save_json(LOG_PATH, log)
    INDEX_PATH.write_text(render_index(log), encoding="utf-8")
    print(f"Published daily insight: {entry['title']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
