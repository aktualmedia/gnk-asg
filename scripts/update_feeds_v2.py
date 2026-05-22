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
UA = 'GNK-ASG-Portal/2.0'

def read_json(name, default):
    try: return json.loads((DATA / name).read_text(encoding='utf-8'))
    except Exception: return default

def save(name, value):
    (DATA / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'application/xml,application/rss+xml,application/json,*/*'})
    with urllib.request.urlopen(req, timeout=28) as reply: return reply.read()

def clean(raw):
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', raw or '').replace('&nbsp;', ' ')).strip()

def parsedate(raw):
    try: return email.utils.parsedate_to_datetime(raw).astimezone(dt.timezone.utc)
    except Exception: return None

def rss_rows(xml, source, group, category, cutoff):
    rows = []
    root = ET.fromstring(xml)
    for item in root.findall('.//item')[:30]:
        full = clean(item.findtext('title')); url = clean(item.findtext('link'))
        date = parsedate(clean(item.findtext('pubDate')))
        if not full or not url or not date or date < cutoff: continue
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
    conf = read_json('news_config_v2.json', {'retention_days':30,'max_items':500,'sources':[],'queries':[]})
    cutoff = NOW - dt.timedelta(days=int(conf.get('retention_days',30)))
    rules = read_json('blocked_news.json', {'urls':[],'title_terms':[]})
    items, errors = [], []
    for src in conf.get('sources', []):
        try: items.extend(rss_rows(fetch(src['url']), src['name'], src['group'], src['category'], cutoff))
        except Exception as e: errors.append({'source':src.get('name','RSS'),'error':str(e)[:80]})
    for src in conf.get('queries', []):
        try: items.extend(rss_rows(fetch(gnews(src['q'])), src['name'], src['group'], src['category'], cutoff))
        except Exception as e: errors.append({'source':src.get('name','Query'),'error':str(e)[:80]})
    unique = {}
    for row in items:
        if not blocked(row, rules): unique.setdefault(row['id'], row)
    selected = sorted(unique.values(), key=lambda row: row['published_at'], reverse=True)[:int(conf.get('max_items',500))]
    save('news.json', selected)
    counts = {}
    for row in selected: counts[row['group']] = counts.get(row['group'], 0) + 1
    return {'public_items':len(selected),'by_group':counts,'errors':errors}

def update_market():
    ids = 'bitcoin,ethereum,solana,ripple,binancecoin,tether,usd-coin,cardano'
    fiats = 'eur,usd,gbp,chf,jpy'
    simple = 'https://api.coingecko.com/api/v3/simple/price?ids=' + ids + '&vs_currencies=' + fiats + '&include_24hr_change=true'
    raw = json.loads(fetch(simple).decode('utf-8'))
    symbols = {'bitcoin':'BTC','ethereum':'ETH','solana':'SOL','ripple':'XRP','binancecoin':'BNB','tether':'USDT','usd-coin':'USDC','cardano':'ADA'}
    coins = [{'id':key,'symbol':value,'prices':{f:raw[key].get(f) for f in fiats.split(',')},'changes_24h':{f:raw[key].get(f+'_24h_change') for f in fiats.split(',')}} for key,value in symbols.items() if key in raw]
    save('market.json', {'updated_at':NOW.isoformat(),'source':'CoinGecko public market data','status':'ok','coins':coins})
    chart = 'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=eur&days=7'
    values = json.loads(fetch(chart).decode('utf-8')).get('prices', [])
    save('btc_chart.json', {'updated_at':NOW.isoformat(),'currency':'EUR','days':7,'source':'CoinGecko public market data','prices':values})
    return {'coins':len(coins),'btc_chart_points':len(values)}

def main():
    status = {'updated_at':NOW.isoformat()}
    try: status['news'] = update_news()
    except Exception as e: status['news'] = {'error':str(e)[:130]}
    try: status['market'] = update_market()
    except Exception as e: status['market'] = {'error':str(e)[:130]}
    save('update_status.json', status)
    print(json.dumps(status, ensure_ascii=False))
if __name__ == '__main__': main()
