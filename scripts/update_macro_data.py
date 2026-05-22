#!/usr/bin/env python3
"""Prepare comparative market data for the GNK ASG public dashboard.

The generated dataset is informational only. It stores delayed/latest available
public quote data for Bitcoin, gold, Brent crude oil and the USD/EUR rate, plus
normalised performance and basic correlation statistics for comparison.
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
UA = "GNK-ASG-Market-Dashboard/1.0"

ASSETS = {
    "btc": {"symbol": "BTC-USD", "label": "Bitcoin", "ticker": "BTC", "unit": "USD / BTC", "invert": False},
    "gold": {"symbol": "GC=F", "label": "Zlato", "ticker": "XAU", "unit": "USD / trojska unca", "invert": False},
    "oil": {"symbol": "BZ=F", "label": "Brent nafta", "ticker": "BRENT", "unit": "USD / barel", "invert": False},
    "usd": {"symbol": "EURUSD=X", "label": "Američki dolar", "ticker": "USD/EUR", "unit": "EUR / USD", "invert": True},
}


def save(payload: dict) -> None:
    (DATA / "macro_market.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def fetch_json(url: str) -> dict:
    request = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def yahoo_history(symbol: str, invert: bool) -> list[list[float]]:
    encoded = urllib.parse.quote(symbol, safe="")
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{encoded}?range=1mo&interval=1d&includePrePost=false&events=history"
    payload = fetch_json(url)
    result = payload.get("chart", {}).get("result", [None])[0] or {}
    times = result.get("timestamp", [])
    closes = ((result.get("indicators", {}).get("quote", [{}])[0] or {}).get("close", []))
    points = []
    for stamp, close in zip(times, closes):
        if close is None or not math.isfinite(float(close)):
            continue
        value = 1 / float(close) if invert else float(close)
        points.append([int(stamp) * 1000, round(value, 8)])
    return points[-31:]


def returns(points: list[list[float]]) -> list[float]:
    values = [float(row[1]) for row in points]
    return [(values[i] / values[i - 1]) - 1 for i in range(1, len(values)) if values[i - 1]]


def period_change(points: list[list[float]], days: int) -> float | None:
    if len(points) < 2:
        return None
    subset = points[-(days + 1):] if len(points) > days else points
    first, last = float(subset[0][1]), float(subset[-1][1])
    return round(((last / first) - 1) * 100, 2) if first else None


def normalise(points: list[list[float]]) -> list[list[float]]:
    if not points or not points[0][1]:
        return []
    first = float(points[0][1])
    return [[stamp, round((float(value) / first) * 100, 4)] for stamp, value in points]


def correlation(left: list[float], right: list[float]) -> float | None:
    count = min(len(left), len(right))
    if count < 3:
        return None
    a, b = left[-count:], right[-count:]
    avg_a, avg_b = sum(a) / count, sum(b) / count
    numerator = sum((x - avg_a) * (y - avg_b) for x, y in zip(a, b))
    variance_a = sum((x - avg_a) ** 2 for x in a)
    variance_b = sum((y - avg_b) ** 2 for y in b)
    denominator = math.sqrt(variance_a * variance_b)
    return round(numerator / denominator, 3) if denominator else None


def main() -> None:
    output = {
        "updated_at": NOW,
        "title": "BTC, zlato, Brent nafta i USD/EUR - statistička usporedba",
        "period": "posljednjih 30 dostupnih dnevnih tržišnih vrijednosti",
        "disclaimer": "Indikativni javni tržišni podatci; prikaz nije usluga trgovanja niti investicijski savjet.",
        "source": "Public market quote feed; hourly portal refresh",
        "assets": {},
        "correlations": {},
        "errors": []
    }
    series_returns: dict[str, list[float]] = {}
    for key, meta in ASSETS.items():
        try:
            points = yahoo_history(meta["symbol"], bool(meta["invert"]))
            if not points:
                raise ValueError("Nema dostupnih tržišnih točaka")
            values = [row[1] for row in points]
            output["assets"][key] = {
                **meta,
                "current": values[-1],
                "change_7d_percent": period_change(points, 7),
                "change_30d_percent": period_change(points, 30),
                "low_30d": min(values),
                "high_30d": max(values),
                "points": points,
                "indexed_points": normalise(points)
            }
            series_returns[key] = returns(points)
        except Exception as exc:
            output["errors"].append({"asset": key, "error": str(exc)[:140]})
    btc_returns = series_returns.get("btc", [])
    for key in ("gold", "oil", "usd"):
        output["correlations"][f"btc_{key}"] = correlation(btc_returns, series_returns.get(key, []))
    save(output)
    print(json.dumps({"updated_at": NOW, "assets": len(output["assets"]), "errors": output["errors"]}, ensure_ascii=False))


if __name__ == "__main__":
    main()
