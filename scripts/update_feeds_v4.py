#!/usr/bin/env python3
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
UA = 'GNK-ASG-Portal/4.0'
PUBLIC_LIMIT = 1000
ARCHIVE_LIMIT = 5000


def load(name, default):
    try:
        return json.loads((DATA / name).read_text(encoding='utf-8'))
    except Exception:
        return default


def save(name, value):
    DATA.mkdir(parents=True, exist_ok=True)
    (DATA / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'application/xml,application/rss+xml,application/json,*/*'})
    with urllib.request.urlopen(req, timeout=28) as reply:
        return reply.read()


def clean(value):
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', value or '').replace('&nbsp;', ' ')).strip()


def parsedate(value):
    try:
        return email.utils.parsedate_to_datetime(value).astimezone(dt.timezone.utc)
    except Exception:
        try:
            return dt.datetime.fromisoformat(str(value).replace('Z', '+00:00')).astimezone(dt.timezone.utc)
        except Exception:
            return None


def gnews(query):
    return 'https://news.google.com/rss/search?q=' + urllib.parse.quote(query) + '&hl=hr&gl=HR&ceid=HR:hr'


def rss_rows(xml, source, group, category, cutoff):
    found = []
    root = ET.fromstring(xml)
    for item in root.findall('.//item')[:50]:
        title = clean(item.findtext('title'))
        url = clean(item.findtext('link'))
        published = parsedate(clean(item.findtext('pubDate')))
        if not title or not url or not published or published < cutoff:
            continue
        headline, publisher = title.rsplit(' - ', 1) if ' - ' in title else (title, source)
        uid = hashlib.sha256((headline + url).encode('utf-8')).hexdigest()[:18]
        found.append({'id': uid, 'title': headline, 'url': url, 'summary': clean(item.findtext('description'))[:280], 'source': publisher, 'region': source, 'group': group, 'category': category, 'published_at': published.isoformat()})
    return found


def excluded(item, rules):
    title = item.get('title', '').lower()
    url = item.get('url', '').lower()
    return any(str(term).lower() in title for term in rules.get('title_terms', []) if term) or any(str(term).lower() in url for term in rules.get('urls', []) if term)


def media_candidates(errors):
    cutoff = NOW - dt.timedelta(days=3650)
    searches = [
        ('GNK ASG Monitor', '"GNK ASG" when:3650d'),
        ('GNK ASG Company Monitor', '"GNK ASG d.o.o." when:3650d'),
        ('GNK DINAMO Ltd Monitor', '"GNK DINAMO Ltd" when:3650d'),
        ('Nermin Sefic Monitor', '"Nermin Sefic" when:3650d'),
        ('Nermin Sefic HR Monitor', '"Nermin Sefić" when:3650d')
    ]
    output = []
    for name, query in searches:
        try:
            output.extend(rss_rows(fetch(gnews(query)), name, 'mentions', 'mentions', cutoff))
        except Exception as error:
            errors.append({'source': name, 'error': str(error)[:100]})
    return output


def update_news():
    config = load('news_config_v2.json', {'retention_days': 30, 'max_items': PUBLIC_LIMIT, 'sources': [], 'queries': []})
    max_items = int(config.get('max_items', PUBLIC_LIMIT))
    standard_cutoff = NOW - dt.timedelta(days=int(config.get('retention_days', 30)))
    rules = load('blocked_news.json', {'urls': [], 'title_terms': []})
    errors, standard = [], []
    for source in config.get('sources', []):
        try:
            standard.extend(rss_rows(fetch(source['url']), source['name'], source['group'], source['category'], standard_cutoff))
        except Exception as error:
            errors.append({'source': source.get('name', 'RSS'), 'error': str(error)[:100]})
    for source in [entry for entry in config.get('queries', []) if entry.get('group') != 'mentions']:
        try:
            standard.extend(rss_rows(fetch(gnews(source['q'])), source['name'], source['group'], source['category'], standard_cutoff))
        except Exception as error:
            errors.append({'source': source.get('name', 'Query'), 'error': str(error)[:100]})
    previous_public = [item for item in load('news.json', []) if item.get('group') != 'mentions']
    standard.extend(previous_public)
    normal = {}
    for item in standard:
        published = parsedate(item.get('published_at', ''))
        if published and published >= standard_cutoff and not excluded(item, rules):
            normal[item['id']] = item

    approved = {item.get('id'): item for item in load('media_approved.json', []) if item.get('id')}
    queue_existing = {item.get('id'): item for item in load('media_review_queue.json', []) if item.get('id')}
    for item in media_candidates(errors):
        if item['id'] not in approved and not excluded(item, rules):
            item['review_status'] = 'pending_approval'
            item['detected_at'] = NOW.isoformat()
            queue_existing[item['id']] = item
    queue = sorted(queue_existing.values(), key=lambda item: item.get('published_at', ''), reverse=True)
    save('media_review_queue.json', queue[:1000])

    approved_public = []
    for item in approved.values():
        item['group'] = 'mentions'
        item['category'] = 'mentions'
        item['review_status'] = 'approved'
        approved_public.append(item)
    ordered = sorted(list(normal.values()) + approved_public, key=lambda item: item.get('published_at', ''), reverse=True)
    public = ordered[:max_items]
    removed = ordered[max_items:]
    archive_items = {item.get('id'): item for item in load('news_archive.json', []) + removed if item.get('id')}
    save('news.json', public)
    save('news_archive.json', sorted(archive_items.values(), key=lambda item: item.get('published_at', ''), reverse=True)[:ARCHIVE_LIMIT])
    counts = {}
    for item in public:
        counts[item.get('group', 'other')] = counts.get(item.get('group', 'other'), 0) + 1
    return {'public_items': len(public), 'capacity': max_items, 'archive_items': len(archive_items), 'pending_media_approval': len(queue), 'approved_media_public': len(approved_public), 'by_group': counts, 'errors': errors}


def update_market():
    ids = 'bitcoin,ethereum,solana,ripple,binancecoin,tether,usd-coin,cardano'
    fiats = 'eur,usd,gbp,chf,jpy'
    url = 'https://api.coingecko.com/api/v3/simple/price?ids=' + ids + '&vs_currencies=' + fiats + '&include_24hr_change=true'
    raw = json.loads(fetch(url).decode('utf-8'))
    symbols = {'bitcoin': 'BTC', 'ethereum': 'ETH', 'solana': 'SOL', 'ripple': 'XRP', 'binancecoin': 'BNB', 'tether': 'USDT', 'usd-coin': 'USDC', 'cardano': 'ADA'}
    coins = [{'id': key, 'symbol': symbol, 'prices': {fiat: raw[key].get(fiat) for fiat in fiats.split(',')}, 'changes_24h': {fiat: raw[key].get(fiat + '_24h_change') for fiat in fiats.split(',')}} for key, symbol in symbols.items() if key in raw]
    save('market.json', {'updated_at': NOW.isoformat(), 'source': 'CoinGecko public market data', 'status': 'ok', 'coins': coins})
    chart = json.loads(fetch('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=eur&days=7').decode('utf-8')).get('prices', [])
    save('btc_chart.json', {'updated_at': NOW.isoformat(), 'currency': 'EUR', 'days': 7, 'source': 'CoinGecko public market data', 'prices': chart})
    return {'coins': len(coins), 'btc_chart_points': len(chart)}


def main():
    result = {'updated_at': NOW.isoformat()}
    try:
        result['news'] = update_news()
    except Exception as error:
        result['news'] = {'error': str(error)[:180]}
    try:
        result['market'] = update_market()
    except Exception as error:
        result['market'] = {'error': str(error)[:180]}
    save('update_status.json', result)
    print(json.dumps(result, ensure_ascii=False))


if __name__ == '__main__':
    main()
