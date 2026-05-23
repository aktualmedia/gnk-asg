#!/usr/bin/env python3
"""Update public market intelligence datasets on a five-minute cadence.

Outputs are informational market observations only. They do not represent an
exchange service, issuance, stablecoin offering, investment advice or a price
guarantee by GNK ASG d.o.o. or GNK DINAMO Ltd.
"""
from __future__ import annotations

import datetime as dt
import json
import math
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
NOW = dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat()
UA = "GNK-ASG-Market-Intelligence/3.0"
FIATS = ["eur", "usd", "gbp", "chf", "jpy"]
COINS = {
    "bitcoin": "BTC", "ethereum": "ETH", "solana": "SOL", "ripple": "XRP",
    "binancecoin": "BNB", "cardano": "ADA", "chainlink": "LINK", "avalanche-2": "AVAX",
    "tether": "USDT", "usd-coin": "USDC", "dai": "DAI", "euro-coin": "EURC",
}
STABLECOINS = {
    "tether": {"symbol": "USDT", "peg": "usd", "issuer": "Tether"},
    "usd-coin": {"symbol": "USDC", "peg": "usd", "issuer": "Circle"},
    "dai": {"symbol": "DAI", "peg": "usd", "issuer": "Sky ecosystem"},
    "first-digital-usd": {"symbol": "FDUSD", "peg": "usd", "issuer": "First Digital"},
    "paypal-usd": {"symbol": "PYUSD", "peg": "usd", "issuer": "Paxos / PayPal"},
    "euro-coin": {"symbol": "EURC", "peg": "eur", "issuer": "Circle"},
}
INDEXES = {
    "sp500": {"symbol": "^GSPC", "label": "S&P 500", "region": "SAD"},
    "nasdaq": {"symbol": "^IXIC", "label": "Nasdaq Composite", "region": "SAD"},
    "stoxx50": {"symbol": "^STOXX50E", "label": "EURO STOXX 50", "region": "Europa"},
    "dax": {"symbol": "^GDAXI", "label": "DAX", "region": "Njemačka"},
    "ftse": {"symbol": "^FTSE", "label": "FTSE 100", "region": "UK"},
    "nikkei": {"symbol": "^N225", "label": "Nikkei 225", "region": "Japan"},
}
PREFERRED_EXCHANGES = {"Binance", "Coinbase Exchange", "Kraken", "OKX", "Bitstamp", "Crypto.com Exchange", "Bybit"}


def fetch_json(url: str) -> dict | list:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as reply:
        return json.loads(reply.read().decode("utf-8"))


def save(name: str, payload) -> None:
    (DATA / name).write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def read_json(name: str, default):
    try:
        return json.loads((DATA / name).read_text(encoding="utf-8"))
    except Exception:
        return default


def simple_prices(ids: list[str]) -> dict:
    query = urllib.parse.urlencode({
        "ids": ",".join(ids), "vs_currencies": ",".join(FIATS),
        "include_market_cap": "true", "include_24hr_vol": "true",
        "include_24hr_change": "true", "include_last_updated_at": "true",
    })
    return fetch_json("https://api.coingecko.com/api/v3/simple/price?" + query)


def update_coins_and_stablecoins() -> dict:
    ids = list(dict.fromkeys([*COINS.keys(), *STABLECOINS.keys()]))
    raw = simple_prices(ids)
    coins = []
    for coin_id, symbol in COINS.items():
        if coin_id not in raw:
            continue
        item = raw[coin_id]
        coins.append({
            "id": coin_id, "symbol": symbol,
            "prices": {currency: item.get(currency) for currency in FIATS},
            "changes_24h": {currency: item.get(currency + "_24h_change") for currency in FIATS},
            "market_cap_usd": item.get("usd_market_cap"), "volume_24h_usd": item.get("usd_24h_vol"),
            "last_updated_at": item.get("last_updated_at")
        })
    save("market.json", {
        "updated_at": NOW, "cadence": "scheduled every five minutes", "source": "CoinGecko public market data",
        "status": "ok", "coins": coins,
        "disclaimer": "Informativni tržišni prikaz; nije usluga trgovanja niti investicijski savjet."
    })
    stable = []
    for coin_id, meta in STABLECOINS.items():
        item = raw.get(coin_id)
        if not item or item.get(meta["peg"]) is None:
            continue
        price = float(item[meta["peg"]])
        deviation = round((price - 1.0) * 100, 4)
        stable.append({
            "id": coin_id, **meta, "price_peg_currency": price,
            "price_usd": item.get("usd"), "price_eur": item.get("eur"),
            "deviation_percent": deviation, "abs_deviation_percent": abs(deviation),
            "change_24h_percent": item.get(meta["peg"] + "_24h_change"),
            "market_cap_usd": item.get("usd_market_cap"), "volume_24h_usd": item.get("usd_24h_vol"),
            "last_updated_at": item.get("last_updated_at")
        })
    stable.sort(key=lambda row: row.get("abs_deviation_percent", 0), reverse=True)
    save("stablecoins.json", {
        "updated_at": NOW, "cadence": "scheduled every five minutes", "source": "CoinGecko public market data",
        "reference": "Observed market deviation from stated reference currency; not a reserve or redemption assessment.",
        "regulatory_notice": "GNK ASG d.o.o. ne izdaje niti nudi stablecoin kroz ovaj prikaz. Svaki budući token zahtijevao bi zasebnu pravnu, regulatornu i tehničku procjenu prije javne ponude.",
        "stablecoins": stable
    })
    return {"coins": len(coins), "stablecoins": len(stable)}


def update_btc_chart() -> int:
    url = "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=eur&days=7"
    values = fetch_json(url).get("prices", [])
    save("btc_chart.json", {"updated_at": NOW, "currency": "EUR", "days": 7, "source": "CoinGecko public market data", "prices": values})
    return len(values)


def update_exchanges() -> int:
    url = "https://api.coingecko.com/api/v3/coins/bitcoin/tickers?include_exchange_logo=true&depth=true&order=volume_desc&page=1"
    rows = fetch_json(url).get("tickers", [])
    result = []
    for row in rows:
        market = (row.get("market") or {}).get("name")
        if market not in PREFERRED_EXCHANGES or any(item["exchange"] == market for item in result):
            continue
        converted = row.get("converted_last") or {}
        volume = row.get("converted_volume") or {}
        result.append({
            "exchange": market, "pair": f"{row.get('base', '')}/{row.get('target', '')}",
            "last_usd": converted.get("usd"), "volume_usd": volume.get("usd"),
            "spread_percent": row.get("bid_ask_spread_percentage"), "trust_score": row.get("trust_score"),
            "timestamp": row.get("timestamp"), "trade_url": row.get("trade_url")
        })
    result.sort(key=lambda item: float(item.get("volume_usd") or 0), reverse=True)
    save("exchange_compare.json", {
        "updated_at": NOW, "cadence": "scheduled every five minutes", "asset": "Bitcoin",
        "source": "CoinGecko exchange ticker aggregation", "exchanges": result[:7],
        "disclaimer": "Usporedni informativni prikaz javno dostupnih ticker podataka; nije preporuka burze niti usluga izvršenja naloga."
    })
    return len(result[:7])


def yahoo_intraday(symbol: str) -> dict:
    encoded = urllib.parse.quote(symbol, safe="")
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{encoded}?range=5d&interval=5m&includePrePost=false&events=history"
    payload = fetch_json(url)
    result = (payload.get("chart", {}).get("result") or [None])[0] or {}
    meta = result.get("meta", {})
    closes = ((result.get("indicators", {}).get("quote", [{}])[0] or {}).get("close", []))
    values = [float(value) for value in closes if value is not None and math.isfinite(float(value))]
    current = values[-1] if values else meta.get("regularMarketPrice")
    previous = meta.get("chartPreviousClose") or meta.get("previousClose")
    change = round(((float(current) / float(previous)) - 1) * 100, 2) if current and previous else None
    return {"current": current, "previous_close": previous, "change_percent": change, "currency": meta.get("currency"), "market_time": meta.get("regularMarketTime")}


def update_indices() -> int:
    indices, errors = [], []
    for key, meta in INDEXES.items():
        try:
            quote = yahoo_intraday(meta["symbol"])
            indices.append({"id": key, **meta, **quote})
        except Exception as exc:
            errors.append({"id": key, "error": str(exc)[:120]})
    save("market_indices.json", {
        "updated_at": NOW, "cadence": "scheduled every five minutes", "source": "Public market quote feed",
        "indices": indices, "errors": errors,
        "disclaimer": "Indikativni tržišni podatci mogu biti odgođeni ili odražavati posljednju raspoloživu kotaciju."
    })
    return len(indices)


def update_status(summary: dict) -> None:
    status = read_json("update_status.json", {})
    status["fast_market"] = {"updated_at": NOW, **summary}
    save("update_status.json", status)


def main() -> None:
    summary, errors = {}, []
    for label, function in (
        ("digital_assets", update_coins_and_stablecoins), ("btc_chart_points", update_btc_chart),
        ("exchanges", update_exchanges), ("indices", update_indices),
    ):
        try:
            summary[label] = function()
        except Exception as exc:
            errors.append({"module": label, "error": str(exc)[:150]})
    summary["errors"] = errors
    update_status(summary)
    print(json.dumps({"updated_at": NOW, **summary}, ensure_ascii=False))
    if errors:
        raise SystemExit("Jedan ili više tržišnih modula nije uspješno dohvaćen.")


if __name__ == "__main__":
    main()
