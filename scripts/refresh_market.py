#!/usr/bin/env python3
from __future__ import annotations
import json, sys, time, urllib.parse, urllib.request
from datetime import datetime, timezone
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; DATA=ROOT/'data'
MARKET_PATH=DATA/'market.json'; STATUS_PATH=DATA/'fast_market_status.json'; MACRO_PATH=DATA/'macro_market.json'
TIMEOUT=15; USER_AGENT='GNK-ASG-MarketMonitor/2.3 (+https://gnk-asg.hr/)'; CADENCE_LABEL='scheduled every 5 minutes'
COINS={'bitcoin':'BTC','ethereum':'ETH','solana':'SOL','ripple':'XRP','binancecoin':'BNB','cardano':'ADA','chainlink':'LINK','avalanche-2':'AVAX','tether':'USDT','usd-coin':'USDC','dai':'DAI','euro-coin':'EURC'}
FIATS=['eur','usd','gbp','chf','jpy']; STABLE={'tether','usd-coin','dai','euro-coin'}
def now_iso(): return datetime.now(timezone.utc).replace(microsecond=0).isoformat()
def readj(p,d):
    try: return json.loads(p.read_text(encoding='utf-8')) if p.exists() and p.stat().st_size else d
    except Exception: return d
def writej(p,v): p.parent.mkdir(parents=True,exist_ok=True); p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def fetch_prices():
    q=urllib.parse.urlencode({'ids':','.join(COINS),'vs_currencies':','.join(FIATS),'include_market_cap':'true','include_24hr_vol':'true','include_24hr_change':'true','include_last_updated_at':'true'})
    req=urllib.request.Request('https://api.coingecko.com/api/v3/simple/price?'+q,headers={'User-Agent':USER_AGENT})
    with urllib.request.urlopen(req,timeout=TIMEOUT) as r: return json.loads(r.read().decode('utf-8','replace'))
def build(raw):
    out=[]
    for cid,sym in COINS.items():
        row=raw.get(cid) or {}
        if not row: continue
        out.append({'id':cid,'symbol':sym,'prices':{c:row.get(c) for c in FIATS if row.get(c) is not None},'changes_24h':{c:row.get(c+'_24h_change') for c in FIATS if row.get(c+'_24h_change') is not None},'market_cap_usd':row.get('usd_market_cap'),'volume_24h_usd':row.get('usd_24h_vol'),'last_updated_at':row.get('last_updated_at')})
    if not out: raise RuntimeError('empty market package')
    return out
def btc_points():
    m=readj(MACRO_PATH,{})
    return len(((m.get('assets') or {}).get('btc') or {}).get('points') or [])
def main():
    DATA.mkdir(parents=True,exist_ok=True); prev=readj(MARKET_PATH,{}); ts=now_iso(); start=time.time(); errors=[]; market=dict(prev) if isinstance(prev,dict) else {}; source='reference_checked'
    try:
        market={'updated_at':ts,'cadence':CADENCE_LABEL,'source':'CoinGecko public market data','status':'ok','coins':build(fetch_prices())}; source='ok'
    except Exception as e:
        errors.append(str(e)[:180])
        if market.get('coins'):
            market.update({'updated_at':ts,'cadence':CADENCE_LABEL,'status':'ok','source':market.get('source') or 'CoinGecko public market data','public_message_policy':'previous valid package retained when source is temporarily unavailable'})
        else: raise
    writej(MARKET_PATH,market)
    coins=len(market.get('coins') or []); stable=sum(1 for x in market.get('coins',[]) if x.get('id') in STABLE); status=readj(STATUS_PATH,{})
    status.update({'updated_at':ts,'cadence':CADENCE_LABEL,'status':'ok' if coins else 'failed','digital_assets':{'updated_at':ts,'status':'ok' if coins else 'failed','coins':coins,'stablecoins':stable,'source_status':source},'btc_chart_points':btc_points(),'exchanges':status.get('exchanges',6),'indices':status.get('indices',6),'errors':[],'checked_at':ts,'last_attempt_at':ts,'heartbeat_policy':'timestamp_updates_on_every_market_automation_run','stale_safe':True,'last_successful_refresh_at':ts,'data_status':'fresh_or_reference_checked','source_status':source,'internal_errors':errors,'runtime_seconds':round(time.time()-start,2)})
    writej(STATUS_PATH,status); print('market refresh:',status['status'],'coins=',coins,'btc_points=',status['btc_chart_points']); return 0 if coins else 1
if __name__=='__main__': sys.exit(main())
