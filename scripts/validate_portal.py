#!/usr/bin/env python3
"""Validate GNK ASG public portal structure, 3D network and refreshed datasets."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
ERRORS: list[str] = []
PASSED: list[str] = []


def ok(label: str) -> None:
    PASSED.append(label)
    print(f"PASS: {label}")


def fail(label: str) -> None:
    ERRORS.append(label)
    print(f"FAIL: {label}", file=sys.stderr)


def read_json(path: Path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        fail(f"JSON nije moguće učitati: {path.relative_to(ROOT)} ({exc})")
        return None


def require_file(path: str) -> Path:
    file_path = ROOT / path
    if file_path.exists() and file_path.stat().st_size > 0:
        ok(f"Datoteka postoji: {path}")
    else:
        fail(f"Nedostaje datoteka: {path}")
    return file_path


def check_structure() -> None:
    required = [
        "index.html", "en/index.html", "admin/index.html", "sw.js", "manifest.webmanifest",
        "assets/app.js", "assets/group-network.js", "assets/network-motion.js", "assets/network-motion.css",
        "assets/group-globe-3d.js", "assets/group-globe-3d.css", "assets/admin-status-only.js",
        "data/group_network.json", "data/group_network_geo.json", "data/media_approved.json",
        "data/media_monitor_status.json", "scripts/update_feeds_v2.py", "scripts/update_macro_data.py",
        "scripts/discover_corporate_media.py", "scripts/generate_seo.py",
        ".github/workflows/hourly-data-update.yml", ".github/workflows/daily-seo-refresh.yml",
        ".github/workflows/media-monitor-status.yml", ".github/workflows/manage-approved-media.yml",
    ]
    for item in required:
        require_file(item)
    forbidden = [
        "data/corporate_review_queue.json", "data/corporate_review_decisions.json",
        ".github/workflows/queue-item-action.yml", ".github/workflows/review-queue-refresh.yml",
        "scripts/apply_review_decision.py", "assets/admin-console.js",
    ]
    for item in forbidden:
        if ROOT.joinpath(item).exists():
            fail(f"Javni/zastarjeli adminsko-redni artefakt nije uklonjen: {item}")
        else:
            ok(f"Uklonjeno iz javne verzije: {item}")
    app = (ROOT / "assets/app.js").read_text(encoding="utf-8")
    for asset in ("group-globe-3d.css", "group-globe-3d.js", "network-motion.js"):
        if asset in app:
            ok(f"Aplikacija učitava: {asset}")
        else:
            fail(f"Aplikacija ne učitava: {asset}")
    admin = (ROOT / "admin/index.html").read_text(encoding="utf-8")
    if "media-monitor-status.yml" in admin and "review-queue-refresh.yml" not in admin:
        ok("Admin izravno vodi na aktivni statusni workflow")
    else:
        fail("Admin poveznica na statusni workflow nije izravno ispravljena")


def check_network() -> None:
    network = read_json(DATA / "group_network.json") or {}
    geo = read_json(DATA / "group_network_geo.json") or {}
    nodes = network.get("nodes", [])
    expected = network.get("counts", {}).get("expanded_total")
    total = len(nodes) + (1 if network.get("center") else 0)
    if total == expected == 45:
        ok("Mreža sadrži 45 lokacija (33 postojeće + 12 planiranih)")
    else:
        fail(f"Mreža lokacija nije potpuna: pronađeno {total}, očekivano {expected or 45}")
    geo_nodes = geo.get("nodes", {})
    missing = [node.get("id") for node in nodes if node.get("id") not in geo_nodes]
    if geo.get("center", {}).get("id") == network.get("center", {}).get("id") and not missing:
        ok("Sve lokacije imaju geografske koordinate za 3D globus")
    else:
        fail(f"Nedostaju koordinate za: {', '.join(missing) or 'središte'}")
    invalid = []
    for node_id, point in {"boulder": geo.get("center", {}), **geo_nodes}.items():
        lat, lng = point.get("lat"), point.get("lng")
        if not isinstance(lat, (int, float)) or not isinstance(lng, (int, float)) or not (-90 <= lat <= 90) or not (-180 <= lng <= 180):
            invalid.append(node_id)
    if invalid:
        fail("Neispravne geografske koordinate: " + ", ".join(invalid))
    else:
        ok("Geografske koordinate su u valjanom rasponu")
    valid_ids = {"boulder", *(node.get("id") for node in nodes)}
    broken_links = [pair for pair in network.get("peer_links", []) if len(pair) != 2 or pair[0] not in valid_ids or pair[1] not in valid_ids]
    if broken_links:
        fail(f"Neispravne međudruštvene veze: {broken_links[:3]}")
    else:
        ok("Sve međudruštvene veze upućuju na postojeće čvorove")


def check_generated_files(post_fetch: bool) -> None:
    news = read_json(DATA / "news.json")
    market = read_json(DATA / "market.json")
    btc = read_json(DATA / "btc_chart.json")
    macro = read_json(DATA / "macro_market.json")
    status = read_json(DATA / "update_status.json")
    monitor = read_json(DATA / "media_monitor_status.json")
    if isinstance(news, list) and 0 < len(news) <= 1000:
        ok(f"Vijesti su dostupne i unutar limita: {len(news)} stavki")
    else:
        fail("Vijesti nedostaju ili prelaze limit od 1000 stavki")
    coins = market.get("coins", []) if isinstance(market, dict) else []
    if len(coins) >= 8:
        ok(f"Digital Assets Monitor sadrži {len(coins)} valuta")
    else:
        fail(f"Digital Assets Monitor nema očekivanih 8 valuta: {len(coins)}")
    points = btc.get("prices", []) if isinstance(btc, dict) else []
    if len(points) >= 7:
        ok(f"BTC graf sadrži podatkovne točke: {len(points)}")
    else:
        fail("BTC graf nema dovoljno podatkovnih točaka")
    assets = macro.get("assets", {}) if isinstance(macro, dict) else {}
    if all(key in assets for key in ("btc", "gold", "oil", "usd")):
        ok("Makro graf sadrži BTC, zlato, Brent i USD/EUR")
    else:
        fail("Makro graf nema sva četiri očekivana tržišna pokazatelja")
    if post_fetch:
        news_status = status.get("news", {}) if isinstance(status, dict) else {}
        market_status = status.get("market", {}) if isinstance(status, dict) else {}
        if "error" not in news_status and news_status.get("public_items", 0) > 0:
            ok("Stvarno povlačenje vijesti završilo je s javnim stavkama")
        else:
            fail("Stvarno povlačenje vijesti nije završilo uredno")
        if "error" not in market_status and market_status.get("coins", 0) >= 8:
            ok("Stvarno povlačenje digitalne imovine završilo je uredno")
        else:
            fail("Stvarno povlačenje digitalne imovine nije završilo uredno")
        if isinstance(macro, dict) and not macro.get("errors"):
            ok("Stvarno povlačenje makro tržišnih podataka završilo je uredno")
        else:
            fail("Makro tržišni dohvat ima pogreške")
        if isinstance(monitor, dict) and monitor.get("status") in {"ok", "partial"} and monitor.get("public_display_policy") == "manual_approval_only":
            ok("Medijski monitor čuva politiku ručnog odobravanja")
        else:
            fail("Medijski monitor nema očekivani status ili politiku odobravanja")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--post-fetch", action="store_true", help="Validate output after live fetch scripts have executed")
    args = parser.parse_args()
    check_structure()
    check_network()
    check_generated_files(args.post_fetch)
    print(f"\nRezultat: {len(PASSED)} provjera prošlo; {len(ERRORS)} provjera nije prošlo.")
    if ERRORS:
        for error in ERRORS:
            print(" - " + error, file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
