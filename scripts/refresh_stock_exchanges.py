#!/usr/bin/env python3
from __future__ import annotations

import json
import math
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
OUT = DATA / "stock_exchanges.json"
TIMEOUT = 12
USER_AGENT = "GNK-ASG-StockExchangeMonitor/1.0 (+https://gnk-asg.hr/)"

MARKETS = [
    {
        "id": "crobex",
        "exchange": "Zagrebačka burza",
        "name": "CROBEX",
        "symbol": "CBX",
        "region_hr": "Hrvatska",
        "region_en": "Croatia",
        "official_url": "https://zse.hr/hr/indeks/365?isin=HRZB00ICBEX6&tab=stock_info",
        "delay_hr": "Službeni ZSE prikaz · odgoda 15 min",
        "delay_en": "Official ZSE display · 15 min delay",
        "feed": None,
    },
    {
        "id": "crobex10",
        "exchange": "Zagrebačka burza",
        "name": "CROBEX10",
        "symbol": "CROBEX10",
        "region_hr": "Hrvatska",
        "region_en": "Croatia",
        "official_url": "https://zse.hr/hr/burzovni-indeksi/38",
        "delay_hr": "Službeni ZSE online prikaz",
        "delay_en": "Official ZSE online display",
        "feed": None,
    },
    {
        "id": "nyse",
        "exchange": "New York Stock Exchange",
        "name": "NYSE Composite",
        "symbol": "^NYA",
        "region_hr": "SAD",
        "region_en": "USA",
        "official_url": "https://www.nyse.com/quote/index/NYA",
        "delay_hr": "Javni informativni indeksni podatak; vrijednost može biti odgođena",
        "delay_en": "Public informational index data; value may be delayed",
        "feed": "^NYA",
    },
    {
        "id": "nasdaq",
        "exchange": "Nasdaq",
        "name": "Nasdaq Composite",
        "symbol": "^IXIC",
        "region_hr": "SAD",
        "region_en": "USA",
        "official_url": "https://www.nasdaq.com/market-activity/index/comp",
        "delay_hr": "Javni informativni indeksni podatak; vrijednost može biti odgođena",
        "delay_en": "Public informational index data; value may be delayed",
        "feed": "^IXIC",
    },
]


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def read_json(path: Path, default):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return default


def write_json(path: Path, payload) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def fetch_json(url: str):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as response:
        return json.loads(response.read().decode("utf-8", "replace"))


def yahoo_points(symbol: str):
    encoded = urllib.parse.quote(symbol, safe="")
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{encoded}?range=1mo&interval=1d&includePrePost=false"
    raw = fetch_json(url)
    result = (((raw or {}).get("chart") or {}).get("result") or [None])[0]
    if not result:
        raise RuntimeError(f"No chart result for {symbol}")
    timestamps = result.get("timestamp") or []
    quote = (((result.get("indicators") or {}).get("quote") or [None])[0] or {})
    closes = quote.get("close") or []
    points = []
    for ts, close in zip(timestamps, closes):
        if close is None:
            continue
        value = float(close)
        if math.isfinite(value) and value > 0:
            points.append([int(ts) * 1000, value])
    if len(points) < 2:
        raise RuntimeError(f"Insufficient points for {symbol}")
    return points[-31:]


def build_market(meta: dict, previous: dict, ts: str):
    base = {k: v for k, v in meta.items() if k != "feed"}
    base["checked_at"] = ts
    if not meta.get("feed"):
        base.update({
            "status": "official_source_link",
            "value": None,
            "change_percent": None,
            "points": [],
            "source_timestamp": None,
            "last_successful_refresh_at": previous.get("last_successful_refresh_at") or previous.get("checked_at"),
        })
        return base, False
    points = yahoo_points(meta["feed"])
    first = float(points[0][1])
    last = float(points[-1][1])
    base.update({
        "status": "public_market_feed",
        "value": round(last, 2),
        "change_percent": round(((last / first) - 1) * 100, 2) if first else None,
        "points": points,
        "currency": "USD",
        "source_timestamp": datetime.fromtimestamp(points[-1][0] / 1000, tz=timezone.utc).isoformat(),
        "last_successful_refresh_at": ts,
    })
    return base, True


def main() -> int:
    DATA.mkdir(parents=True, exist_ok=True)
    previous = read_json(OUT, {})
    previous_by_id = {item.get("id"): item for item in previous.get("markets", []) if isinstance(item, dict)}
    ts = now_iso()
    markets = []
    errors = []
    successful = 0
    started = time.time()
    for meta in MARKETS:
        try:
            item, ok = build_market(meta, previous_by_id.get(meta["id"], {}), ts)
            if ok:
                successful += 1
        except Exception as exc:
            old = previous_by_id.get(meta["id"], {})
            item = dict(old) if old else {k: v for k, v in meta.items() if k != "feed"}
            item.update({
                "checked_at": ts,
                "status": "public_market_feed_stale" if meta.get("feed") else "official_source_link",
                "last_attempt_at": ts,
            })
            errors.append({"market": meta["id"], "reason": str(exc)[:160]})
        markets.append(item)

    payload = {
        "checked_at": ts,
        "updated_at": ts,
        "status": "ok" if successful >= 1 else "reference_checked",
        "refresh_frequency": "Scheduled stock-exchange source check every 60 minutes",
        "refresh_frequency_hr": "Planirana provjera burzovnih izvora svakih 60 minuta",
        "refresh_frequency_en": "Scheduled stock-exchange source check every 60 minutes",
        "disclaimer_hr": "Informativni burzovni prikaz. Podatci mogu biti vremenski odgođeni; prije financijske odluke provjerite službeni izvor burze.",
        "disclaimer_en": "Informational stock-market display. Data may be delayed; verify the exchange official source before any financial decision.",
        "markets": markets,
        "errors": errors,
        "last_attempt_at": ts,
        "last_successful_refresh_at": ts if successful >= 1 else previous.get("last_successful_refresh_at"),
        "data_status": "fresh_public_feed_plus_official_links" if successful >= 1 else "official_links_only",
        "runtime_seconds": round(time.time() - started, 2),
    }
    write_json(OUT, payload)
    print(f"stock exchanges refresh: successful={successful}, markets={len(markets)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
