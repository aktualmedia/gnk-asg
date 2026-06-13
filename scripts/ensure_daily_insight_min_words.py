#!/usr/bin/env python3
from __future__ import annotations

import json
import re
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
TZ = ZoneInfo("Europe/Zagreb")
POLICY = ROOT / "data" / "daily_insight_policy.json"
POSTS = ROOT / "insights-hr" / "daily"
TODAY = datetime.now(TZ).date().isoformat()

policy = json.loads(POLICY.read_text(encoding="utf-8")) if POLICY.exists() else {}
minimum = int(policy.get("minimum_word_count", 300))
extra = """
<p>Dodatni urednički okvir: ova dnevna autorska objava promatra temu kroz poslovni kontekst, a ne samo kao prolaznu vijest. Za javni korporativni portal važno je da svaki tekst objasni zašto je tema relevantna, kako se povezuje s tržištem, reputacijom, tehnologijom ili upravljanjem i zašto čitatelj može iz nje prepoznati širi smjer kretanja. Takav pristup čini razliku između kratke vijesti i korisnog poslovnog osvrta.</p>
""".strip()


def visible_words(html: str) -> int:
    text = re.sub(r"<script[\s\S]*?</script>", " ", html, flags=re.I)
    text = re.sub(r"<style[\s\S]*?</style>", " ", text, flags=re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    return len(re.findall(r"\w+", text, flags=re.UNICODE))

changed = 0
for path in POSTS.glob(f"{TODAY}-*/index.html"):
    html = path.read_text(encoding="utf-8")
    count = visible_words(html)
    if count >= minimum:
        print(f"OK {path}: {count} words")
        continue
    marker = "<div class=\"box\"><strong>Napomena:</strong>"
    if marker in html:
        html = html.replace(marker, extra + marker, 1)
    else:
        html = html.replace("</article>", extra + "</article>", 1)
    path.write_text(html, encoding="utf-8")
    changed += 1
    print(f"Extended {path}: {count} -> at least {minimum} words")

print(f"Daily insight minimum word guard finished; changed={changed}")
