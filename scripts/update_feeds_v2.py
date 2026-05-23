#!/usr/bin/env python3
"""Refresh classified public news on an hourly cadence.

Fast-moving market tables are maintained separately by update_fast_market.py so
an hourly news run never overwrites newer five-minute quote observations.
"""
from __future__ import annotations
import datetime as dt
import email.utils
import hashlib
import json
import re
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data'
NOW = dt.datetime.now(dt.timezone.utc).replace(microsecond=0)
UA = 'GNK-ASG-News-Monitor/3.0'

def read_json(name, default):
    try:
        return json.loads((DATA / name).read_text(encoding='utf-8'))
    except Exception:
        return default

def save(name, value):
    (DATA / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'application/xml,application/rss+xml,*/*'})
    with urllib.request.urlopen(req, timeout=28) as reply:
        return reply.read()

def clean(raw):
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', raw or '').replace('&nbsp;', ' ')).strip()

def parsedate(raw):
    try:
        return email.utils.parsedate_to_datetime(raw).astimezone(dt.timezone.utc)
    except Exception:
        return None

def rss_rows(xml, source, group, category, cutoff):
    rows = []
    root = ET.fromstring(xml)
    for item in root.findall('.//item')[:30]:
        full = clean(item.findtext('title')); url = clean(item.findtext('link'))
        date = parsedate(clean(item.findtext('pubDate')))
        if not full or not url or not date or date < cutoff:
            continue
        headline, publisher = (full.rsplit(' - ', 1) if ' - ' in full else (full, source))
        uid = hashlib.sha256((headline + url).encode('utf-8')).hexdigest()[:18]
        rows.append({'id':uid,'title':headline,'url':url,'summary':clean(item.findtext('description'))[:240],'source':publisher,'region':source,'group':group,'category':category,'published_at':date.isoformat()})
    return rows

def gnews(q):
    return 'https://news.google.com/rss/search?q=' + urllib.parse.quote(q) + '&hl=hr&gl=HR&ceid=HR:hr'

def blocked(row, rules):
    title = row.get('title','').lower(); url = row.get('url','').lower()
    return any(str(v).lower() in title for v in rules.get('title_terms',[]) if v) or any(str(v).lower() in url for v in rules.get('urls',[]) if v)

def update_news():
    conf = read_json('news_config_v2.json', {'retention_days':30,'max_items':1000,'sources':[],'queries':[]})
    cutoff = NOW - dt.timedelta(days=int(conf.get('retention_days',30)))
    rules = read_json('blocked_news.json', {'urls':[],'title_terms':[]})
    items, errors = [], []
    for src in conf.get('sources', []):
        try:
            items.extend(rss_rows(fetch(src['url']), src['name'], src['group'], src['category'], cutoff))
        except Exception as exc:
            errors.append({'source':src.get('name','RSS'),'error':str(exc)[:80]})
    for src in conf.get('queries', []):
        try:
            items.extend(rss_rows(fetch(gnews(src['q'])), src['name'], src['group'], src['category'], cutoff))
        except Exception as exc:
            errors.append({'source':src.get('name','Query'),'error':str(exc)[:80]})
    unique = {}
    for row in items:
        if not blocked(row, rules):
            unique.setdefault(row['id'], row)
    selected = sorted(unique.values(), key=lambda row: row['published_at'], reverse=True)[:int(conf.get('max_items',1000))]
    save('news.json', selected)
    counts = {}
    for row in selected:
        counts[row['group']] = counts.get(row['group'], 0) + 1
    return {'updated_at': NOW.isoformat(), 'cadence': 'hourly', 'public_items':len(selected),'by_group':counts,'errors':errors}

def main():
    status = read_json('update_status.json', {})
    status['updated_at'] = NOW.isoformat()
    try:
        status['news'] = update_news()
    except Exception as exc:
        status['news'] = {'updated_at': NOW.isoformat(), 'cadence': 'hourly', 'error':str(exc)[:130]}
    save('update_status.json', status)
    print(json.dumps({'updated_at': NOW.isoformat(), 'news': status['news']}, ensure_ascii=False))
    if status['news'].get('error'):
        raise SystemExit('Satno osvježavanje vijesti nije završilo uredno.')
if __name__ == '__main__':
    main()
