#!/usr/bin/env python3
"""
GNK ASG Auto Editor publisher.

Publishes informational articles from existing public portal data.
No legal, financial or investment advice is generated.
"""
from __future__ import annotations

import datetime as dt
import hashlib
import json
import os
import re
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
TZ = ZoneInfo("Europe/Zagreb")
TARGET_HOURS = {9: "morning", 13: "midday", 18: "evening"}
SLOT_LABELS = {
    "morning": "Jutarnji poslovni i tržišni pregled",
    "midday": "Dnevni tehnološki i financijski uvid",
    "evening": "Večernji market intelligence sažetak",
}
CATEGORY = {
    "morning": "Business / Market",
    "midday": "Technology / AI / Finance",
    "evening": "Market Intelligence",
}


def load_json(name: str, fallback):
    path = DATA / name
    if not path.exists():
        return fallback
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return fallback


def save_json(name: str, value):
    path = DATA / name
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def slugify(text: str) -> str:
    text = text.lower()
    text = text.replace("č", "c").replace("ć", "c").replace("š", "s").replace("ž", "z").replace("đ", "d")
    text = re.sub(r"[^a-z0-9]+", "-", text).strip("-")
    return text[:80] or "auto-editor"


def now_zagreb() -> dt.datetime:
    return dt.datetime.now(TZ).replace(microsecond=0)


def requested_slot(now: dt.datetime):
    force = os.getenv("AUTO_EDITOR_FORCE", "false").lower() == "true"
    manual = (os.getenv("AUTO_EDITOR_SLOT") or "auto").strip().lower()
    if manual in SLOT_LABELS:
        return manual, force
    if now.minute == 30 and now.hour in TARGET_HOURS:
        return TARGET_HOURS[now.hour], True
    return None, force


def normalized_news_items(raw):
    if isinstance(raw, list):
        items = raw
    elif isinstance(raw, dict) and isinstance(raw.get("items"), list):
        items = raw["items"]
    else:
        items = []
    clean = []
    for item in items:
        if not isinstance(item, dict):
            continue
        title = str(item.get("title") or "").strip()
        if not title:
            continue
        clean.append({
            "title": title,
            "summary": str(item.get("summary") or item.get("description") or "").strip(),
            "source": str(item.get("source") or item.get("category") or item.get("group") or "javni izvor").strip(),
            "url": str(item.get("url") or item.get("share_url") or "").strip(),
            "published_at": str(item.get("published_at") or item.get("date") or "").strip(),
            "group": str(item.get("group") or item.get("category") or "").strip(),
        })
    return clean[:12]


def market_lines(market):
    coins = market.get("coins") if isinstance(market, dict) else []
    if not isinstance(coins, list):
        return []
    lines = []
    for coin in coins[:8]:
        if not isinstance(coin, dict):
            continue
        symbol = str(coin.get("symbol") or coin.get("id") or "").upper()
        prices = coin.get("prices") if isinstance(coin.get("prices"), dict) else {}
        changes = coin.get("changes_24h") if isinstance(coin.get("changes_24h"), dict) else {}
        eur = prices.get("eur")
        change = changes.get("eur")
        if symbol and eur is not None:
            try:
                eur_text = f"{float(eur):,.2f} EUR".replace(",", "X").replace(".", ",").replace("X", ".")
            except Exception:
                eur_text = str(eur)
            try:
                ch_text = f"{float(change):+.2f}%" if change is not None else "n/d"
            except Exception:
                ch_text = "n/d"
            lines.append(f"{symbol}: {eur_text} ({ch_text} / 24 h)")
    return lines


def pick_news(news, slot):
    if slot == "morning":
        preferred = ["economy", "business", "hrvatska", "international"]
    elif slot == "midday":
        preferred = ["technology", "digital-assets", "ai", "finance"]
    else:
        preferred = ["market", "digital-assets", "international", "economy"]
    selected = []
    for key in preferred:
        selected.extend([n for n in news if key in (n.get("group", "") + " " + n.get("source", "")).lower()])
    selected.extend(news)
    dedup = []
    seen = set()
    for item in selected:
        marker = item["title"].lower()
        if marker in seen:
            continue
        seen.add(marker)
        dedup.append(item)
    return dedup[:5]


def build_body(slot, news, market, status):
    label = SLOT_LABELS[slot]
    market_summary = market_lines(market)
    source_success = None
    if isinstance(status, dict):
        source_success = status.get("news", {}).get("source_success_ratio")
    news_text = "\n".join(f"- {n['title']} ({n['source']})" for n in news[:5]) or "- Nema dostupnih javnih vijesti u trenutnom podatkovnom sloju."
    market_text = "\n".join(f"- {line}" for line in market_summary[:6]) or "- Market snapshot trenutačno nije dostupan u podatkovnom sloju."
    reliability = ""
    if source_success is not None:
        reliability = f" Prema statusnom sloju, omjer uspješnosti javnih news izvora iznosi {source_success}."

    paragraphs = [
        f"{label} donosi informativni pregled javnih poslovnih, tehnoloških i tržišnih signala koje portal GNK ASG prati kroz vlastiti podatkovni sloj. Tekst je automatski sastavljen iz javno dostupnih zapisa portala, bez davanja pravnog, poreznog, financijskog ili investicijskog savjeta.",
        f"U fokusu su vijesti i tržišni podatci koji mogu biti korisni za razumijevanje šireg poslovnog okruženja. Portal prikazuje stanje kao snapshot, odnosno informativni presjek u trenutku zadnjeg dostupnog ažuriranja.{reliability}",
        "Odabrani javni news signali:\n" + news_text,
        "Odabrani tržišni snapshot:\n" + market_text,
        "Zaključno, Auto Editor ovu objavu označava kao informativni pregled. Podatci mogu kasniti, izvori mogu biti djelomično nedostupni, a svaki poslovni, regulatorni ili investicijski zaključak zahtijeva zasebnu stručnu provjeru i ljudsku odluku."
    ]
    return "\n\n".join(paragraphs)


def main():
    now = now_zagreb()
    slot, force = requested_slot(now)
    status = load_json("auto_editor_status.json", {})

    if not slot and not force:
        status.update({
            "engine": "auto_editor_publish_v1",
            "status": "skipped",
            "mode": "published",
            "timezone": "Europe/Zagreb",
            "last_run_at": now.isoformat(),
            "last_action": "outside_publication_time",
            "schedule_local": ["09:30", "13:30", "18:30"],
        })
        save_json("auto_editor_status.json", status)
        print("Auto Editor skipped: outside publication time.")
        return

    if not slot:
        slot = "morning"

    posts = load_json("auto_editor_posts.json", [])
    if not isinstance(posts, list):
        posts = []

    day_key = now.strftime("%Y-%m-%d")
    post_id = f"auto-editor-{day_key}-{slot}"
    if any(p.get("id") == post_id for p in posts):
        status.update({
            "engine": "auto_editor_publish_v1",
            "status": "ok",
            "mode": "published",
            "timezone": "Europe/Zagreb",
            "last_run_at": now.isoformat(),
            "last_action": "already_published",
            "last_slot": slot,
            "last_post_id": post_id,
            "schedule_local": ["09:30", "13:30", "18:30"],
        })
        save_json("auto_editor_status.json", status)
        print("Auto Editor already published for this slot.")
        return

    news_raw = load_json("news.json", [])
    market = load_json("market.json", {})
    update_status = load_json("update_status.json", {})
    news = pick_news(normalized_news_items(news_raw), slot)
    title = f"{SLOT_LABELS[slot]} — {now.strftime('%d.%m.%Y.')}"
    body = build_body(slot, news, market, update_status)
    slug = slugify(title)
    canonical = f"https://gnk-asg.hr/auto-editor/{slug}/"

    post = {
        "id": post_id,
        "status": "published",
        "type": "auto-editor",
        "mode": "informational",
        "data_status": "snapshot",
        "language": "hr",
        "slot": slot,
        "category": CATEGORY[slot],
        "title": title,
        "slug": slug,
        "canonical": canonical,
        "summary": "Automatski informativni pregled javnih poslovnih, tehnoloških i tržišnih podataka portala GNK ASG.",
        "seo_description": "GNK ASG Auto Editor objava: informativni pregled javnih vijesti, tržišnih podataka i poslovnih signala, bez financijskog ili pravnog savjeta.",
        "body": body,
        "sources": news[:5],
        "market_updated_at": market.get("updated_at") if isinstance(market, dict) else None,
        "created_at": now.isoformat(),
        "published_at": now.isoformat(),
        "disclaimer": "Informativno. Nije financijski, investicijski, porezni ni pravni savjet.",
    }

    posts.insert(0, post)
    posts = posts[:120]
    save_json("auto_editor_posts.json", posts)
    status.update({
        "engine": "auto_editor_publish_v1",
        "status": "ok",
        "mode": "published",
        "timezone": "Europe/Zagreb",
        "schedule_local": ["09:30", "13:30", "18:30"],
        "last_run_at": now.isoformat(),
        "last_published_at": now.isoformat(),
        "last_action": "published",
        "last_slot": slot,
        "last_post_id": post_id,
        "last_title": title,
        "post_count": len(posts),
    })
    save_json("auto_editor_status.json", status)
    print(f"Auto Editor published: {post_id}")


if __name__ == "__main__":
    main()
