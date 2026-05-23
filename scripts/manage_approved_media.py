#!/usr/bin/env python3
"""Manage only publicly approved corporate media links.

This script is intended to be invoked by an authorized GitHub Actions workflow.
No pending or rejected items are stored in the public repository.
"""
from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
APPROVED = ROOT / "data" / "media_approved.json"


def value(name: str) -> str:
    return os.environ.get(name, "").strip()


def valid_public_url(url: str) -> bool:
    parsed = urlparse(url)
    return parsed.scheme in {"http", "https"} and bool(parsed.netloc)


def load_items() -> list[dict]:
    try:
        items = json.loads(APPROVED.read_text(encoding="utf-8"))
        return items if isinstance(items, list) else []
    except (OSError, json.JSONDecodeError):
        return []


def main() -> None:
    action = value("MEDIA_ACTION").lower()
    url = value("MEDIA_URL")
    if action not in {"approve", "remove"}:
        raise SystemExit("Action must be approve or remove.")
    if not valid_public_url(url):
        raise SystemExit("A valid public http/https source URL is required.")

    items = load_items()
    items = [item for item in items if str(item.get("url", "")).strip() != url]

    if action == "approve":
        title = value("MEDIA_TITLE")
        source = value("MEDIA_SOURCE")
        published_at = value("MEDIA_DATE")
        summary = value("MEDIA_SUMMARY")
        subject = value("MEDIA_SUBJECT") or "GNK ASG d.o.o."
        if not title or not source:
            raise SystemExit("Title and source are required for approval.")
        if published_at:
            try:
                datetime.fromisoformat(published_at.replace("Z", "+00:00"))
            except ValueError as exc:
                raise SystemExit("Published date must be ISO format, for example 2026-05-23.") from exc
        else:
            published_at = datetime.now(timezone.utc).date().isoformat()
        items.append({
            "title": title,
            "summary": summary,
            "url": url,
            "source": source,
            "published_at": published_at,
            "subject": subject,
            "approved_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
            "approval": "manual"
        })

    items.sort(key=lambda item: str(item.get("published_at", "")), reverse=True)
    APPROVED.write_text(json.dumps(items, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{action}: {url}; public approved items: {len(items)}")


if __name__ == "__main__":
    main()
