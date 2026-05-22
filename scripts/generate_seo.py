#!/usr/bin/env python3
from datetime import datetime, timezone
from pathlib import Path
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parents[1]
SITE = 'https://aktualmedia.github.io/gnk-asg/'
TODAY = datetime.now(timezone.utc).date().isoformat()
PAGES = ['', 'index.html']

def entry(path):
    return '  <url>\n    <loc>' + escape(SITE + path) + '</loc>\n    <lastmod>' + TODAY + '</lastmod>\n  </url>'

sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + '\n'.join(entry(path) for path in PAGES) + '\n</urlset>\n'
(ROOT / 'sitemap.xml').write_text(sitemap, encoding='utf-8')
(ROOT / 'robots.txt').write_text('User-agent: *\nAllow: /\n\nSitemap: ' + SITE + 'sitemap.xml\n', encoding='utf-8')
print('Generated sitemap.xml and robots.txt for GNK ASG portal.')
