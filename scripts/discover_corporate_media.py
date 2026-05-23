#!/usr/bin/env python3
"""Discover public media mentions without publishing unapproved results.

The candidate list is written to a workflow artifact path, not to public site
JSON. Only a minimal monitor-health status is safe for the public portal.
Approved publications remain managed separately by an authorized workflow.
"""
from __future__ import annotations

import email.utils
import hashlib
import json
import os
import re
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
CONFIG = DATA / "media_queries.json"
APPROVED = DATA / "media_approved.json"
OUTPUT = ROOT / os.environ.get("MEDIA_CANDIDATE_OUTPUT", "_private_review/candidates.json")
STATUS = ROOT / os.environ.get("MEDIA_PUBLIC_STATUS_OUTPUT", "data/media_monitor_status.json")
UA = "GNK-ASG-Public-Media-Monitor/2.0"


def load(path: Path, default):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return default


def save(path: Path, value) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
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
    rows: list[dict] = []
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
        rows.append({
            "id": item_id(link),
            "title": title,
            "source": source,
            "url": link,
            "published_at": parsed,
            "summary": clean(row.findtext("description", ""))[:420],
            "origin": "Google News public RSS",
        })
    return rows


def main() -> None:
    config = load(CONFIG, {})
    approved_urls = {str(entry.get("url", "")).strip() for entry in load(APPROVED, []) if entry.get("url")}
    candidates: dict[str, dict] = {}
    errors: list[str] = []
    discovered_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat()

    for subject in config.get("subjects", []):
        for base_query in subject.get("queries", []):
            for period in config.get("period_queries", [""]):
                query = base_query + period
                try:
                    for item in fetch_feed(query):
                        if item["url"] in approved_urls:
                            continue
                        item.update({"subject": subject.get("name", ""), "query": query, "discovered_at": discovered_at, "status": "requires_authorized_review"})
                        candidates.setdefault(item["id"], item)
                except Exception as error:
                    errors.append(f"{query}: {str(error)[:110]}")

    queue = sorted(candidates.values(), key=lambda item: item.get("published_at", ""), reverse=True)
    queue = queue[: int(config.get("max_pending_items", 1000))]
    save(OUTPUT, queue)
    public_status = {
        "status": "ok" if not errors else "partial",
        "updated_at": discovered_at,
        "review_access": "authorized_github_actions_artifact",
        "public_display_policy": "manual_approval_only",
        "errors_count": len(errors),
    }
    save(STATUS, public_status)
    print(json.dumps({**public_status, "private_candidates": len(queue)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
