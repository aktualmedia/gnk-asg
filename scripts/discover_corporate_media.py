#!/usr/bin/env python3
"""Discover and automatically publish current public corporate-media results.

The public GNK ASG portal publishes matching Google News RSS results for the
configured corporate subjects. Authorised removals are persisted in a block
list so an excluded URL cannot be automatically re-added on the next run.
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
PUBLIC_ITEMS = DATA / "media_approved.json"
REMOVED = DATA / "media_removed.json"
STATUS = DATA / "media_monitor_status.json"
UA = "GNK-ASG-Public-Media-Monitor/4.0"


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


def publication_time(raw_date: str) -> str:
    try:
        return email.utils.parsedate_to_datetime(raw_date).astimezone(timezone.utc).replace(microsecond=0).isoformat()
    except Exception:
        return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def removed_urls(value) -> set[str]:
    urls: set[str] = set()
    if not isinstance(value, list):
        return urls
    for item in value:
        url = item if isinstance(item, str) else item.get("url", "") if isinstance(item, dict) else ""
        url = str(url).strip()
        if url:
            urls.add(url)
    return urls


def fetch_feed(query: str, subject: str, discovered_at: str) -> list[dict]:
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
        source_node = row.find("source")
        source = clean(source_node.text if source_node is not None and source_node.text else "Google News")
        results.append({
            "id": hashlib.sha256(link.encode("utf-8")).hexdigest()[:18],
            "title": title,
            "summary": f"Automatski pronađena javna objava povezana sa subjektom {subject}.",
            "url": link,
            "source": source,
            "published_at": publication_time(clean(row.findtext("pubDate", ""))),
            "subject": subject,
            "discovered_at": discovered_at,
            "approval": "automatic_public_monitor"
        })
    return results


def main() -> None:
    config = load(CONFIG, {})
    current = load(PUBLIC_ITEMS, [])
    excluded = removed_urls(load(REMOVED, []))
    checked_queries = 0
    errors: list[str] = []
    timestamp = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    discovered: dict[str, dict] = {}

    for subject in config.get("subjects", []):
        subject_name = str(subject.get("name", "")).strip()
        for base_query in subject.get("queries", []):
            query = str(base_query).strip() + " when:30d"
            checked_queries += 1
            try:
                for item in fetch_feed(query, subject_name, timestamp):
                    if item["url"] not in excluded:
                        discovered[item["url"]] = item
            except Exception as error:
                errors.append(f"{subject_name}: {str(error)[:100]}")

    visible: dict[str, dict] = {}
    if isinstance(current, list):
        for item in current:
            if isinstance(item, dict):
                url = str(item.get("url", "")).strip()
                if url and url not in excluded and item.get("approval") == "manual":
                    visible[url] = item
    visible.update(discovered)
    published = sorted(visible.values(), key=lambda item: str(item.get("published_at", "")), reverse=True)
    try:
        limit = max(1, int(config.get("max_pending_items", 1000)))
    except (TypeError, ValueError):
        limit = 1000
    published = published[:limit]
    save(PUBLIC_ITEMS, published)

    public_status = {
        "status": "ok" if not errors else "partial",
        "updated_at": timestamp,
        "checked_queries": checked_queries,
        "public_results_detected": len(discovered),
        "published_public": len(published),
        "removed_urls": len(excluded),
        "public_display_policy": "automatic_publication_with_authorized_removal",
        "privacy_notice": "Matching public corporate-media results are published automatically; authorised removals remain excluded.",
        "errors_count": len(errors)
    }
    save(STATUS, public_status)
    print(json.dumps(public_status, ensure_ascii=False))


if __name__ == "__main__":
    main()
