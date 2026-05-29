#!/usr/bin/env python3
"""Reliable public news refresh for the GNK ASG portal.

Policy:
- data/news.json exposes at most the newest 500 unique articles;
- data/news_archive.json preserves all older unique overflow articles;
- failed sources do not block publication from healthy sources;
- remote RSS requests run concurrently with strict time limits.
"""
from __future__ import annotations

import concurrent.futures
import datetime as dt
import email.utils
import hashlib
import html
import json
import os
import re
import tempfile
import unicodedata
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
NOW = dt.datetime.now(dt.timezone.utc).replace(microsecond=0)
UA = "GNK-ASG-News-Monitor/4.0"
PUBLIC_LIMIT = 500
TIMEOUT_SECONDS = 6
WORKERS = 10


def read_json(name: str, default):
    try:
        return json.loads((DATA / name).read_text(encoding="utf-8"))
    except Exception:
        return default


def atomic_save(name: str, value) -> None:
    target = DATA / name
    fd, temporary = tempfile.mkstemp(prefix=target.name + ".", suffix=".tmp", dir=str(DATA))
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            json.dump(value, handle, ensure_ascii=False, indent=2)
            handle.write("\n")
        os.replace(temporary, target)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def clean(raw: str | None) -> str:
    value = html.unescape(raw or "").replace("&nbsp;", " ")
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", value)).strip()


def parse_date(raw: str | None):
    try:
        value = email.utils.parsedate_to_datetime(raw or "")
        if not value.tzinfo:
            value = value.replace(tzinfo=dt.timezone.utc)
        return value.astimezone(dt.timezone.utc)
    except Exception:
        try:
            return dt.datetime.fromisoformat(str(raw).replace("Z", "+00:00")).astimezone(dt.timezone.utc)
        except Exception:
            return None


def fetch(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/rss+xml,application/xml,text/xml,*/*"})
    with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS) as response:
        return response.read()


def gnews(query: str) -> str:
    return "https://news.google.com/rss/search?q=" + urllib.parse.quote(query) + "&hl=hr&gl=HR&ceid=HR:hr"


def rss_rows(payload: bytes, source: dict, cutoff: dt.datetime, per_source: int) -> list[dict]:
    rows = []
    for item in ET.fromstring(payload).findall(".//item")[:per_source]:
        full_title = clean(item.findtext("title"))
        url = clean(item.findtext("link"))
        published = parse_date(clean(item.findtext("pubDate")))
        if not full_title or not url or not published or published < cutoff:
            continue
        title, publisher = (full_title.rsplit(" - ", 1) if " - " in full_title else (full_title, source["name"]))
        identifier = hashlib.sha256((title + url).encode("utf-8")).hexdigest()[:18]
        rows.append({
            "id": identifier,
            "title": title,
            "url": url,
            "summary": clean(item.findtext("description"))[:240],
            "source": publisher,
            "region": source["name"],
            "group": source["group"],
            "category": source["category"],
            "published_at": published.isoformat(),
        })
    return rows


def load_source(source: dict, cutoff: dt.datetime, per_source: int):
    target = source.get("url") or gnews(source["q"])
    try:
        return rss_rows(fetch(target), source, cutoff, per_source), None
    except Exception as exc:
        return [], {"source": source.get("name", "RSS"), "error": str(exc)[:100]}


def normalize_title(value: str) -> str:
    value = unicodedata.normalize("NFKD", clean(value)).encode("ascii", "ignore").decode("ascii").lower()
    value = re.sub(r"\s+[-|–—]\s+(n1|klix|akta|capital|biznis|poslovni|cnbc|techcrunch).*$", "", value)
    return re.sub(r"[^a-z0-9]+", " ", value).strip()


def canonical_url(value: str) -> str:
    parsed = urllib.parse.urlsplit(value or "")
    host = parsed.netloc.lower().removeprefix("www.")
    path = parsed.path.rstrip("/").lower()
    return f"{host}{path}" if host and path else (value or "").strip().lower()


def saved_rows(value) -> list[dict]:
    if not isinstance(value, list):
        return []
    return [row for row in value if isinstance(row, dict) and row.get("title") and row.get("url") and parse_date(row.get("published_at"))]


def is_blocked(row: dict, rules: dict) -> bool:
    title = row.get("title", "").lower()
    url = row.get("url", "").lower()
    return any(str(x).lower() in title for x in rules.get("title_terms", []) if x) or any(str(x).lower() in url for x in rules.get("urls", []) if x)


def unique_rows(rows: list[dict], rules: dict):
    selected, removed = [], 0
    ids, urls, signatures = set(), set(), set()
    for row in rows:
        identifier = row.get("id", "")
        url = canonical_url(row.get("url", ""))
        signature = (row.get("group", ""), row.get("category", ""), normalize_title(row.get("title", "")))
        if is_blocked(row, rules) or identifier in ids or (url and url in urls) or (signature[2] and signature in signatures):
            removed += 1
            continue
        selected.append(row)
        ids.add(identifier)
        if url:
            urls.add(url)
        if signature[2]:
            signatures.add(signature)
    return selected, removed


def main() -> None:
    config = read_json("news_config_v2.json", {})
    retention = max(1, int(config.get("retention_days", 30)))
    per_source = max(20, min(100, int(config.get("max_per_source", 60))))
    cutoff = NOW - dt.timedelta(days=retention)
    sources = list(config.get("sources", [])) + list(config.get("queries", []))
    fetched, errors = [], []
    with concurrent.futures.ThreadPoolExecutor(max_workers=WORKERS) as pool:
        futures = [pool.submit(load_source, source, cutoff, per_source) for source in sources]
        for future in concurrent.futures.as_completed(futures):
            rows, error = future.result()
            fetched.extend(rows)
            if error:
                errors.append(error)
    previous_public = saved_rows(read_json("news.json", []))
    previous_archive = saved_rows(read_json("news_archive.json", []))
    candidates = sorted(fetched + previous_public + previous_archive, key=lambda row: row.get("published_at", ""), reverse=True)
    unique, removed = unique_rows(candidates, read_json("blocked_news.json", {"urls": [], "title_terms": []}))
    limit = min(PUBLIC_LIMIT, max(1, int(config.get("max_items", PUBLIC_LIMIT))))
    public = unique[:limit]
    archive = unique[limit:]
    previous_urls = {canonical_url(row.get("url", "")) for row in previous_archive}
    newly_archived = sum(1 for row in archive if canonical_url(row.get("url", "")) not in previous_urls)
    groups = {}
    for row in public:
        groups[row["group"]] = groups.get(row["group"], 0) + 1
    status = read_json("update_status.json", {})
    status["updated_at"] = NOW.isoformat()
    status["news"] = {
        "updated_at": NOW.isoformat(),
        "engine": "resilient_parallel_v4",
        "cadence": "scheduled refresh with stale-data fallback",
        "storage_policy": "public_latest_500_overflow_preserved_in_archive",
        "public_items": len(public),
        "max_public_items": PUBLIC_LIMIT,
        "archive_items": len(archive),
        "newly_archived_items": newly_archived,
        "fetched_candidates": len(fetched),
        "previous_public_items": len(previous_public),
        "previous_archive_items": len(previous_archive),
        "network_workers": WORKERS,
        "request_timeout_seconds": TIMEOUT_SECONDS,
        "duplicates_or_blocked_removed": removed,
        "by_group": groups,
        "errors": errors,
    }
    atomic_save("news.json", public)
    atomic_save("news_archive.json", archive)
    atomic_save("update_status.json", status)
    print(json.dumps(status["news"], ensure_ascii=False))


if __name__ == "__main__":
    main()
