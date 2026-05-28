#!/usr/bin/env python3
"""Refresh public news and preserve the overflow archive for the GNK ASG portal.

Public presentation policy:
- data/news.json contains at most the 500 newest unique public articles;
- data/news_archive.json stores all older unique articles removed from that
  public window because newer articles entered above them;
- overflow articles are archived, not deleted.
"""
from __future__ import annotations

import datetime as dt
import email.utils
import hashlib
import html
import json
import re
import unicodedata
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data'
NOW = dt.datetime.now(dt.timezone.utc).replace(microsecond=0)
UA = 'GNK-ASG-News-Monitor/3.7'
MAX_PUBLIC_ITEMS = 500
DEFAULT_SOURCE_LIMIT = 60
N1_ECONOMY = 'https://' + 'n1info.ba/vijesti/ekonomija/'
N1_MONTHS = {'januar':1,'februar':2,'mart':3,'april':4,'maj':5,'juni':6,'juli':7,'august':8,'septembar':9,'oktobar':10,'novembar':11,'decembar':12}


def read_json(name, default):
    try:
        return json.loads((DATA / name).read_text(encoding='utf-8'))
    except Exception:
        return default


def save(name, value):
    (DATA / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'text/html,application/xml,application/rss+xml,*/*'})
    with urllib.request.urlopen(req, timeout=28) as reply:
        return reply.read()


def clean(raw):
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', html.unescape(raw or '')).replace('&nbsp;', ' ')).strip()


def parsedate(raw):
    try:
        return email.utils.parsedate_to_datetime(raw).astimezone(dt.timezone.utc)
    except Exception:
        try:
            return dt.datetime.fromisoformat(str(raw).replace('Z', '+00:00')).astimezone(dt.timezone.utc)
        except Exception:
            return None


def rss_rows(xml, source, group, category, cutoff, source_limit):
    rows = []
    root = ET.fromstring(xml)
    for item in root.findall('.//item')[:source_limit]:
        full = clean(item.findtext('title'))
        url = clean(item.findtext('link'))
        date = parsedate(clean(item.findtext('pubDate')))
        if not full or not url or not date or date < cutoff:
            continue
        headline, publisher = (full.rsplit(' - ', 1) if ' - ' in full else (full, source))
        uid = hashlib.sha256((headline + url).encode('utf-8')).hexdigest()[:18]
        rows.append({'id': uid, 'title': headline, 'url': url, 'summary': clean(item.findtext('description'))[:240], 'source': publisher, 'region': source, 'group': group, 'category': category, 'published_at': date.isoformat()})
    return rows


def page_meta(page, name):
    text = page.decode('utf-8', 'ignore')
    esc = re.escape(name)
    patterns = [rf'<meta[^>]+(?:property|name)=["\']{esc}["\'][^>]+content=["\']([^"\']+)', rf'<meta[^>]+content=["\']([^"\']+)["\'][^>]+(?:property|name)=["\']{esc}["\']']
    for pattern in patterns:
        found = re.search(pattern, text, re.I)
        if found:
            return clean(found.group(1))
    return ''


def n1_visible_date(page):
    text = clean(page.decode('utf-8', 'ignore')).lower()
    match = re.search(r'(\d{1,2})\.\s*(januar|februar|mart|april|maj|juni|juli|august|septembar|oktobar|novembar|decembar)\.?\s*(\d{4})\.?\s*(\d{1,2}):(\d{2})', text)
    if not match:
        return None
    day, month, year, hour, minute = match.groups()
    local = dt.datetime(int(year), N1_MONTHS[month], int(day), int(hour), int(minute), tzinfo=dt.timezone(dt.timedelta(hours=2)))
    return local.astimezone(dt.timezone.utc)


def n1_bih_rows(cutoff, source_limit):
    listing = fetch(N1_ECONOMY).decode('utf-8', 'ignore')
    links = []
    for href in re.findall(r'href=["\']([^"\']+)["\']', listing, re.I):
        url = urllib.parse.urljoin(N1_ECONOMY, html.unescape(href))
        if not url.startswith(N1_ECONOMY) or url.rstrip('/') == N1_ECONOMY.rstrip('/'):
            continue
        if url not in links:
            links.append(url)
    rows = []
    for url in links[:source_limit]:
        try:
            article = fetch(url)
            title = page_meta(article, 'og:title')
            summary = page_meta(article, 'og:description')
            date = parsedate(page_meta(article, 'article:published_time') or page_meta(article, 'datePublished')) or n1_visible_date(article)
            if not title or not date or date < cutoff:
                continue
            uid = hashlib.sha256((title + url).encode('utf-8')).hexdigest()[:18]
            rows.append({'id': uid, 'title': title, 'url': url, 'summary': summary[:240], 'source': 'N1 Bosna i Hercegovina', 'region': 'BiH', 'group': 'bih', 'category': 'economy', 'published_at': date.isoformat()})
        except Exception:
            continue
    return rows


def gnews(query):
    return 'https://news.google.com/rss/search?q=' + urllib.parse.quote(query) + '&hl=hr&gl=HR&ceid=HR:hr'


def blocked(row, rules):
    title = row.get('title', '').lower()
    url = row.get('url', '').lower()
    return any(str(term).lower() in title for term in rules.get('title_terms', []) if term) or any(str(value).lower() in url for value in rules.get('urls', []) if value)


def normalized_title(value):
    value = unicodedata.normalize('NFKD', clean(value)).encode('ascii', 'ignore').decode('ascii').lower()
    value = re.sub(r'\s+[-|–—]\s+(n1|klix|akta|capital|biznis|poslovni|cnbc|techcrunch).*$', '', value)
    return re.sub(r'[^a-z0-9]+', ' ', value).strip()


def canonical_url(value):
    parsed = urllib.parse.urlsplit(value or '')
    host = parsed.netloc.lower().removeprefix('www.')
    path = parsed.path.rstrip('/').lower()
    return f'{host}{path}' if host and path else (value or '').strip().lower()


def valid_saved_rows(rows):
    valid = []
    invalid = 0
    if not isinstance(rows, list):
        return valid, invalid
    for row in rows:
        if not isinstance(row, dict) or not row.get('title') or not row.get('url') or not parsedate(row.get('published_at', '')):
            invalid += 1
            continue
        valid.append(row)
    return valid, invalid


def deduplicate(rows, rules):
    selected = []
    seen_ids, seen_urls, seen_signatures = set(), set(), set()
    blocked_or_duplicate = 0
    for row in rows:
        if blocked(row, rules):
            blocked_or_duplicate += 1
            continue
        identity = row.get('id', '')
        url_key = canonical_url(row.get('url', ''))
        signature = (row.get('group', ''), row.get('category', ''), normalized_title(row.get('title', '')))
        if identity in seen_ids or (url_key and url_key in seen_urls) or (signature[2] and signature in seen_signatures):
            blocked_or_duplicate += 1
            continue
        selected.append(row)
        seen_ids.add(identity)
        if url_key:
            seen_urls.add(url_key)
        if signature[2]:
            seen_signatures.add(signature)
    return selected, blocked_or_duplicate


def update_news():
    conf = read_json('news_config_v2.json', {'retention_days': 30, 'max_items': MAX_PUBLIC_ITEMS, 'max_per_source': DEFAULT_SOURCE_LIMIT, 'sources': [], 'queries': []})
    fetch_days = max(1, int(conf.get('retention_days', 30)))
    source_limit = max(30, min(100, int(conf.get('max_per_source', DEFAULT_SOURCE_LIMIT))))
    cutoff = NOW - dt.timedelta(days=fetch_days)
    rules = read_json('blocked_news.json', {'urls': [], 'title_terms': []})
    fetched, errors = [], []
    for src in conf.get('sources', []):
        try:
            fetched.extend(rss_rows(fetch(src['url']), src['name'], src['group'], src['category'], cutoff, source_limit))
        except Exception as exc:
            errors.append({'source': src.get('name', 'RSS'), 'error': str(exc)[:80]})
    try:
        fetched.extend(n1_bih_rows(cutoff, source_limit))
    except Exception as exc:
        errors.append({'source': 'N1 Bosna i Hercegovina - Ekonomija', 'error': str(exc)[:80]})
    for src in conf.get('queries', []):
        try:
            fetched.extend(rss_rows(fetch(gnews(src['q'])), src['name'], src['group'], src['category'], cutoff, source_limit))
        except Exception as exc:
            errors.append({'source': src.get('name', 'Query'), 'error': str(exc)[:80]})
    prior_public, invalid_public = valid_saved_rows(read_json('news.json', []))
    prior_archive, invalid_archive = valid_saved_rows(read_json('news_archive.json', []))
    ordered_candidates = sorted(fetched + prior_public + prior_archive, key=lambda row: row.get('published_at', ''), reverse=True)
    unique_items, removed_duplicates = deduplicate(ordered_candidates, rules)
    public_limit = min(MAX_PUBLIC_ITEMS, max(1, int(conf.get('max_items', MAX_PUBLIC_ITEMS))))
    public_items = unique_items[:public_limit]
    archived_items = unique_items[public_limit:]
    previous_archive_urls = {canonical_url(row.get('url', '')) for row in prior_archive}
    newly_archived_items = sum(1 for row in archived_items if canonical_url(row.get('url', '')) not in previous_archive_urls)
    save('news.json', public_items)
    save('news_archive.json', archived_items)
    counts = {}
    for row in public_items:
        counts[row['group']] = counts.get(row['group'], 0) + 1
    return {
        'updated_at': NOW.isoformat(),
        'cadence': 'scheduled refresh',
        'storage_policy': 'public_latest_500_overflow_preserved_in_archive',
        'public_items': len(public_items),
        'max_public_items': MAX_PUBLIC_ITEMS,
        'archive_items': len(archived_items),
        'newly_archived_items': newly_archived_items,
        'max_per_source': source_limit,
        'fetched_candidates': len(fetched),
        'previous_public_items': len(prior_public),
        'previous_archive_items': len(prior_archive),
        'invalid_saved_items_removed': invalid_public + invalid_archive,
        'duplicates_or_blocked_removed': removed_duplicates,
        'by_group': counts,
        'errors': errors
    }


def main():
    status = read_json('update_status.json', {})
    for obsolete in ('market', 'fast_market', 'corporate_media_monitor'):
        status.pop(obsolete, None)
    status['updated_at'] = NOW.isoformat()
    try:
        status['news'] = update_news()
    except Exception as exc:
        status['news'] = {'updated_at': NOW.isoformat(), 'cadence': 'scheduled refresh', 'error': str(exc)[:130]}
    save('update_status.json', status)
    print(json.dumps({'updated_at': NOW.isoformat(), 'news': status['news']}, ensure_ascii=False))
    if status['news'].get('error'):
        raise SystemExit('Osvježavanje vijesti nije završilo uredno.')


if __name__ == '__main__':
    main()
