#!/usr/bin/env python3
"""Limit the active news archive to the latest 400 entries.

The public list remains controlled by the refresh engine at 500 entries. This
post-processing step keeps only the 400 newest overflow entries in the active
archive JSON used by the public portal.
"""
from __future__ import annotations

import datetime as dt
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data'
ARCHIVE_LIMIT = 400

archive_path = DATA / 'news_archive.json'
status_path = DATA / 'update_status.json'

archive = json.loads(archive_path.read_text(encoding='utf-8')) if archive_path.exists() else []
if not isinstance(archive, list):
    archive = []

archive = sorted(
    [item for item in archive if isinstance(item, dict)],
    key=lambda item: item.get('published_at', ''),
    reverse=True,
)
removed_count = max(0, len(archive) - ARCHIVE_LIMIT)
kept_archive = archive[:ARCHIVE_LIMIT]
archive_path.write_text(json.dumps(kept_archive, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

status = json.loads(status_path.read_text(encoding='utf-8')) if status_path.exists() else {}
news = status.setdefault('news', {})
news['archive_items'] = len(kept_archive)
news['max_archive_items'] = ARCHIVE_LIMIT
news['archive_policy'] = 'latest_400_overflow_items_retained_in_active_archive'
news['trimmed_archive_overflow_items_this_cycle'] = removed_count
news['archive_trimmed_at'] = dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat()
status_path.write_text(json.dumps(status, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'Active archive retained={len(kept_archive)} removed={removed_count}')
