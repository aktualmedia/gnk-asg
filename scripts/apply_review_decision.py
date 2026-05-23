#!/usr/bin/env python3
"""Apply one authorized decision to an automatically discovered public-source item."""
from __future__ import annotations
import json
import os
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
QUEUE = DATA / "corporate_review_queue.json"
DECISIONS = DATA / "corporate_review_decisions.json"
APPROVED = DATA / "media_approved.json"


def load(path: Path) -> list[dict]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
        return value if isinstance(value, list) else []
    except (OSError, json.JSONDecodeError):
        return []


def save(path: Path, value: list[dict]) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    action = os.environ.get("REVIEW_ACTION", "").strip().lower()
    finding_id = os.environ.get("REVIEW_ITEM_ID", "").strip()
    if action not in {"approve", "reject", "delete"}:
        raise SystemExit("Permitted actions: approve, reject, delete")
    if not finding_id:
        raise SystemExit("Missing review item id")
    queue = load(QUEUE)
    item = next((entry for entry in queue if entry.get("id") == finding_id), None)
    if not item:
        raise SystemExit("Review item does not exist in the current queue")
    timestamp = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    decisions = [entry for entry in load(DECISIONS) if entry.get("id") != finding_id]
    decision_name = "approved" if action == "approve" else ("rejected" if action == "reject" else "deleted")
    decisions.insert(0, {"id": finding_id, "decision": decision_name, "subject": item.get("subject", ""), "url": item.get("url", ""), "decided_at": timestamp})
    approved = [entry for entry in load(APPROVED) if entry.get("url") != item.get("url")]
    if action == "approve":
        approved.insert(0, {
            "id": finding_id,
            "title": item.get("title", ""),
            "summary": item.get("summary", ""),
            "url": item.get("url", ""),
            "source": item.get("source", ""),
            "published_at": item.get("published_at", ""),
            "subject": item.get("subject", ""),
            "approved_at": timestamp,
            "approval": "manual"
        })
    queue = [entry for entry in queue if entry.get("id") != finding_id]
    save(QUEUE, queue)
    save(DECISIONS, decisions[:2000])
    save(APPROVED, approved[:1000])
    print(json.dumps({"item": finding_id, "decision": decision_name, "remaining": len(queue), "approved": len(approved)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
