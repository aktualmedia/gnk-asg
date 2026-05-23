#!/usr/bin/env python3
"""Collect public-news search results concerning moderated corporate subjects.

Items are written to the review queue only; they are never made public in the
portal media section until a separate authorized approval decision is recorded.
"""
from __future__ import annotations

import email.utils
import hashlib
import json
import re
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
CONFIG = DATA / "media_queries.json"
QUEUE = DATA / "corporate_review_queue.json"
DECISIONS = DATA / "corporate_review_decisions.json"
APPROVED = DATA / "media_approved.json"
UA = "GNK-ASG-Public-Media-Monitor/1.0"


def load(path: Path, default):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return default


def save(path: Path, value) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def clean(text: str) -> str:
    text = re.sub(r"<[^>]+>", " ", text or "")
    return re.sub(r"\s+", " ", text).strip()


def item_id(url: str) -> str:
    return hashlib.sha256(url.encode("utf-8")).hexdigest()[:20]


def fetch_feed(query: str) -> list[dict]:
    encoded = urllib.parse.quote_plus(query)
    url = f"https://news.google.com/rss/search?q={encoded}&hl=hr&gl=HR&ceid=HR:hr"
    request = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(request, timeout=25) as response:
        root = ET.fromstring(response.read())
    results: list[dict] = []
    for row in root.findall("./channel/item"):
        link = clean(row.findtext("link", ""))
        title = clean(row.findtext("title", ""))
        if not link or not title:
            continue
        raw_date = clean(row.findtext("pubDate", ""))
        try:
            parsed = email.utils.parsedate_to_datetime(raw_date).astimezone(timezone.utc).isoformat()
        except Exception:
            parsed = raw_date
        source_node = row.find("source")
        source = clean(source_node.text if source_node is not None and source_node.text else "Google News")
        description = clean(row.findtext("description", ""))
        results.append({
            "id": item_id(link),
            "title": title,
            "source": source,
            "url": link,
            "published_at": parsed,
            "summary": description[:420],
            "discovered_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
            "origin": "Google News public RSS"
        })
    return results


def main() -> None:
    config = load(CONFIG, {})
    existing = load(QUEUE, [])
    decisions = {entry.get("id"): entry.get("decision") for entry in load(DECISIONS, []) if entry.get("id")}
    approved_urls = {entry.get("url") for entry in load(APPROVED, []) if entry.get("url")}
    known = {entry.get("id"): entry for entry in existing if entry.get("id")}
    errors: list[str] = []

    for subject in config.get("subjects", []):
        for base_query in subject.get("queries", []):
            for period in config.get("period_queries", [""]):
                query = base_query + period
                try:
                    for item in fetch_feed(query):
                        item["subject"] = subject.get("name", "")
                        item["query"] = query
                        if item["url"] in approved_urls or decisions.get(item["id"]) in {"rejected", "deleted"}:
                            continue
                        prior = known.get(item["id"], {})
                        item["discovered_at"] = prior.get("discovered_at", item["discovered_at"])
                        item["status"] = "pending_review"
                        known[item["id"]] = item
                except Exception as error:
                    errors.append(f"{query}: {str(error)[:110]}")

    queue = sorted(known.values(), key=lambda entry: entry.get("published_at", ""), reverse=True)
    queue = [entry for entry in queue if entry.get("url") not in approved_urls and decisions.get(entry.get("id")) not in {"rejected", "deleted"}]
    queue = queue[: int(config.get("max_pending_items", 1000))]
    save(QUEUE, queue)
    status = load(DATA / "update_status.json", {})
    status["corporate_media_monitor"] = {
        "status": "ok" if not errors else "partial",
        "pending_review": len(queue),
        "approved_public": len(approved_urls),
        "updated_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "errors": errors[:4]
    }
    save(DATA / "update_status.json", status)
    print(json.dumps(status["corporate_media_monitor"], ensure_ascii=False))


if __name__ == "__main__":
    main()
