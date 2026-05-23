#!/usr/bin/env python3
from __future__ import annotations
import datetime as dt, email.utils, hashlib, json, re, urllib.parse, urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data'
NOW = dt.datetime.now(dt.timezone.utc).replace(microsecond=0)
UA = 'GNK-ASG-Portal/3.1'

def load(name, default):
    try: return json.loads((DATA / name).read_text(encoding='utf-8'))
    except Exception: return default

def save(name, value):
    DATA.mkdir(parents=True, exist_ok=True)
    (DATA / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

def fetch(url):
    request = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'application/xml,application/rss+xml,application/json,*/*'})
    with urllib.request.urlopen(request, timeout=28) as response: return response.read()

def clean(text): return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', text or '').replace('&nbsp;', ' ')).strip()

def date(value):
    try: return email.utils.parsedate_to_datetime(value).astimezone(dt.timezone.utc)
    except Exception:
        try: return dt.datetime.fromisoformat(value.replace('Z', '+00:00')).astimezone(dt.timezone.utc)
        except Exception: return None

def gnews(query): return 'https://news.google.com/rss/search?q=' + urllib.parse.quote(query) + '&hl=hr&gl=HR&ceid=HR:hr'

def rows(xml, source, group, category, cutoff):
    output = []
    for item in ET.fromstring(xml).findall('.//item')[:40]:
        title, url, published = clean(item.findtext('title')), clean(item.findtext('link')), date(clean(item.findtext('pubDate')))
        if not title or not url or not published or published < cutoff: continue
        headline, publisher = title.rsplit(' - ', 1) if ' - ' in title else (title, source)
        key = hashlib.sha256((headline + url).encode()).hexdigest()[:18]
        output.append({'id': key, 'title': headline, 'url': url, 'summary': clean(item.findtext('description'))[:280], 'source': publisher, 'region': source, 'group': group, 'category': category, 'published_at': published.isoformat()})
    return output

def excluded(item, rules):
    title, url = item.get('title','').lower(), item.get('url','').lower()
    return any(str(v).lower() in title for v in rules.get('title_terms',[]) if v) or any(str(v).lower() in url for v in rules.get('urls',[]) if v)

def update_news():
    config = load('news_config_v2.json', {'retention_days':30, 'max_items':1000, 'sources':[], 'queries':[]})
    standard_cutoff = NOW - dt.timedelta(days=int(config.get('retention_days', 30)))
    corporate_cutoff = NOW - dt.timedelta(days=365)
    rules, collected, errors = load('blocked_news.json', {'urls':[], 'title_terms':[]}), [], []
    for source in config.get('sources', []):
        try: collected += rows(fetch(source['url']), source['name'], source['group'], source['category'], standard_cutoff)
        except Exception as error: errors.append({'source':source.get('name','RSS'), 'error':str(error)[:100]})
    queries = [q for q in config.get('queries', []) if q.get('group') != 'mentions'] + [
        {'name':'GNK ASG Monitor', 'group':'mentions', 'category':'mentions', 'q':'"GNK ASG" when:365d'},
        {'name':'GNK DINAMO Ltd Monitor', 'group':'mentions', 'category':'mentions', 'q':'"GNK DINAMO Ltd" when:365d'},
        {'name':'Nermin Sefic Monitor', 'group':'mentions', 'category':'mentions', 'q':'"Nermin Sefic" when:365d'}]
    for source in queries:
        cutoff = corporate_cutoff if source['group'] == 'mentions' else standard_cutoff
        try: collected += rows(fetch(gnews(source['q'])), source['name'], source['group'], source['category'], cutoff)
        except Exception as error: errors.append({'source':source.get('name','Query'), 'error':str(error)[:100]})
    existing = load('news.json', [])
    collected += [item for item in existing if item.get('group') == 'mentions']
    unique = {}
    for item in collected:
        published = date(item.get('published_at',''))
        cutoff = corporate_cutoff if item.get('group') == 'mentions' else standard_cutoff
        if published and published >= cutoff and not excluded(item, rules): unique[item['id']] = item
    ordered = sorted(unique.values(), key=lambda item: item['published_at'], reverse=True)
    public = ordered[:int(config.get('max_items',1000))]
    removed = ordered[int(config.get('max_items',1000)):]
    previous_archive = load('news_archive.json', [])
    archive = {item['id']: item for item in previous_archive + removed if item.get('id')}
    save('news.json', public)
    save('news_archive.json', sorted(archive.values(), key=lambda item: item.get('published_at',''), reverse=True)[:5000])
    groups = {}
    for item in public: groups[item['group']] = groups.get(item['group'], 0) + 1
    return {'public_items':len(public), 'capacity':int(config.get('max_items',1000)), 'archive_items':len(archive), 'by_group':groups, 'errors':errors}

def update_market():
    ids, currencies = 'bitcoin,ethereum,solana,ripple,binancecoin,tether,usd-coin,cardano', 'eur,usd,gbp,chf,jpy'
    simple = 'https://api.coingecko.com/api/v3/simple/price?ids=' + ids + '&vs_currencies=' + currencies + '&include_24hr_change=true'
    raw = json.loads(fetch(simple).decode())
    symbols = {'bitcoin':'BTC','ethereum':'ETH','solana':'SOL','ripple':'XRP','binancecoin':'BNB','tether':'USDT','usd-coin':'USDC','cardano':'ADA'}
    coins = [{'id':key,'symbol':symbol,'prices':{c:raw[key].get(c) for c in currencies.split(',')},'changes_24h':{c:raw[key].get(c+'_24h_change') for c in currencies.split(',')}} for key,symbol in symbols.items() if key in raw]
    save('market.json', {'updated_at':NOW.isoformat(),'source':'CoinGecko public market data','status':'ok','coins':coins})
    prices = json.loads(fetch('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=eur&days=7').decode()).get('prices', [])
    save('btc_chart.json', {'updated_at':NOW.isoformat(),'currency':'EUR','days':7,'source':'CoinGecko public market data','prices':prices})
    return {'coins':len(coins), 'btc_chart_points':len(prices)}

def main():
    result = {'updated_at':NOW.isoformat()}
    try: result['news'] = update_news()
    except Exception as error: result['news'] = {'error':str(error)[:180]}
    try: result['market'] = update_market()
    except Exception as error: result['market'] = {'error':str(error)[:180]}
    save('update_status.json', result)
    print(json.dumps(result, ensure_ascii=False))

if __name__ == '__main__': main()
