#!/usr/bin/env python3
from __future__ import annotations
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / 'data' / 'news_config_v2.json'
ORIGINAL = CONFIG.read_text(encoding='utf-8')

try:
    settings = json.loads(ORIGINAL)
    settings['max_items'] = 1000
    settings['queries'] = [item for item in settings.get('queries', []) if item.get('group') != 'mentions']
    CONFIG.write_text(json.dumps(settings, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    subprocess.check_call([sys.executable, str(ROOT / 'scripts' / 'update_feeds_v2.py')])
finally:
    CONFIG.write_text(ORIGINAL, encoding='utf-8')
