#!/usr/bin/env python3
from datetime import datetime, timezone
from pathlib import Path
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parents[1]
SITE = 'https://aktualmedia.github.io/gnk-asg/'
TODAY = datetime.now(timezone.utc).date().isoformat()
PAGES = [
    {'path': '', 'changefreq': 'daily', 'priority': '1.0', 'alternates': True},
    {'path': 'en/', 'changefreq': 'weekly', 'priority': '0.9', 'alternates': True},
    {'path': 'sadrzaj/', 'changefreq': 'weekly', 'priority': '0.8'},
    {'path': 'financije/', 'changefreq': 'weekly', 'priority': '0.8'},
    {'path': 'tehnologija/', 'changefreq': 'weekly', 'priority': '0.8'},
    {'path': 'intelligence-desk/', 'changefreq': 'weekly', 'priority': '0.8'},
    {'path': 'registri/', 'changefreq': 'weekly', 'priority': '0.8'},
    {'path': 'instalacija/', 'changefreq': 'monthly', 'priority': '0.7'},
]


def entry(page: dict) -> str:
    lines = ['  <url>', '    <loc>' + escape(SITE + page['path']) + '</loc>']
    if page.get('alternates'):
        lines.extend([
            '    <xhtml:link rel="alternate" hreflang="hr" href="' + escape(SITE) + '" />',
            '    <xhtml:link rel="alternate" hreflang="en" href="' + escape(SITE + 'en/') + '" />',
            '    <xhtml:link rel="alternate" hreflang="x-default" href="' + escape(SITE) + '" />',
        ])
    lines.extend([
        '    <lastmod>' + TODAY + '</lastmod>',
        '    <changefreq>' + page['changefreq'] + '</changefreq>',
        '    <priority>' + page['priority'] + '</priority>',
        '  </url>',
    ])
    return '\n'.join(lines)


sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' + '\n'.join(entry(page) for page in PAGES) + '\n</urlset>\n'
(ROOT / 'sitemap.xml').write_text(sitemap, encoding='utf-8')
(ROOT / 'robots.txt').write_text('User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ' + SITE + 'sitemap.xml\n', encoding='utf-8')
print('Generated multilingual public sitemap.xml and robots.txt for GNK ASG portal.')
