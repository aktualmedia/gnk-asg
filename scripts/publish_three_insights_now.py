#!/usr/bin/env python3
from __future__ import annotations

from datetime import datetime
from zoneinfo import ZoneInfo

import publish_daily_insight as p

TZ = ZoneInfo("Europe/Zagreb")
SLOTS = ["morning", "afternoon", "evening"]


def main() -> int:
    now = datetime.now(TZ)
    today = now.date().isoformat()
    log = p.load_json(p.LOG_PATH, {"published": []})
    news = p.load_json(p.NEWS_PATH, [])
    if not isinstance(news, list) or not news:
        print("No data/news.json items available")
        return 0

    published_count = 0
    for slot in SLOTS:
        if any(e.get("date") == today and e.get("slot") == slot for e in log.get("published", [])):
            print(f"Already published {slot} for {today}")
            continue
        item = p.pick_item(news, log)
        if not item:
            print(f"No suitable item for {slot}")
            continue
        slug = f"{today}-{slot}-{p.slugify(str(item.get('title') or 'daily-insight'))}"
        article_dir = p.POSTS_DIR / "daily" / slug
        article_dir.mkdir(parents=True, exist_ok=True)
        (article_dir / "index.html").write_text(p.render_article(item, slot, now, slug), encoding="utf-8")
        entry = {
            "date": today,
            "slot": slot,
            "slot_label": p.SLOT_LABELS.get(slot, "Dnevna objava"),
            "title": str(item.get("title") or "Dnevna tema"),
            "summary": str(item.get("summary") or item.get("description") or "Autorski dnevni osvrt portala GNK ASG.")[:220],
            "source": str(item.get("source") or ""),
            "url": str(item.get("url") or ""),
            "category": p.category_label(item),
            "local_url": f"daily/{slug}/",
            "canonical": f"{p.SITE}/insights-hr/daily/{slug}/",
            "image": f"{p.SITE}/assets/insights/daily/{slug}.svg",
            "editorial_responsibility": p.EDITOR,
            "editorial_responsibility_ascii": p.EDITOR_ASCII,
        }
        log.setdefault("published", []).append(entry)
        log["updated_at"] = now.isoformat()
        p.save_json(p.LOG_PATH, log)
        published_count += 1
        print(f"Published {slot}: {entry['title']}")

    p.INDEX_PATH.write_text(p.render_index(log), encoding="utf-8")
    print(f"Published count: {published_count}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
