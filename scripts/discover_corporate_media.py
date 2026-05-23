#!/usr/bin/env python3
"""Verify public-media search availability without publishing unapproved results.

The public GNK ASG portal exposes only monitor health and manually approved
publications. Candidate results are deliberately not written into this public
repository because the portal is hosted on GitHub Pages.
"""
from __future__ import annotations

import email.utils
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
APPROVED = DATA / "media_approved.json"
STATUS = DATA / "media_monitor_status.json"
UA = "GNK-ASG-Public-Media-Monitor/3.0"


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


def fetch_feed(query: str) -> int:
    encoded = urllib.parse.quote_plus(query)
    url = f"https://news.google.com/rss/search?q={encoded}&hl=hr&gl=HR&ceid=HR:hr"
    request = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(request, timeout=25) as response:
        root = ET.fromstring(response.read())
    usable = 0
    for row in root.findall("./channel/item"):
        link = clean(row.findtext("link", ""))
        title = clean(row.findtext("title", ""))
        raw_date = clean(row.findtext("pubDate", ""))
        if not link or not title:
            continue
        if raw_date:
            try:
                email.utils.parsedate_to_datetime(raw_date).astimezone(timezone.utc)
            except Exception:
                pass
        usable += 1
    return usable


def main() -> None:
    config = load(CONFIG, {})
    approved = load(APPROVED, [])
    checked_queries = 0
    available_results = 0
    errors: list[str] = []
    for subject in config.get("subjects", []):
        for base_query in subject.get("queries", []):
            query = base_query + " when:30d"
            checked_queries += 1
            try:
                available_results += fetch_feed(query)
            except Exception as error:
                errors.append(f"{subject.get('name', '')}: {str(error)[:100]}")
    timestamp = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    public_status = {
        "status": "ok" if not errors else "partial",
        "updated_at": timestamp,
        "checked_queries": checked_queries,
        "public_results_detected": available_results,
        "approved_public": len(approved) if isinstance(approved, list) else 0,
        "public_display_policy": "manual_approval_only",
        "privacy_notice": "Unapproved search results are not stored or displayed by the public portal.",
        "errors_count": len(errors)
    }
    save(STATUS, public_status)
    status = load(DATA / "update_status.json", {})
    status["corporate_media_monitor"] = public_status
    save(DATA / "update_status.json", status)
    print(json.dumps(public_status, ensure_ascii=False))


if __name__ == "__main__":
    main()
