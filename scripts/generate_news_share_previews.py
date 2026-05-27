#!/usr/bin/env python3
"""Generate controlled Open Graph preview pages and PNG cards for currently displayed news.

The source article remains the destination for reading. The local share page exists solely
so social networks receive the selected headline, description and branded preview image.
"""
from __future__ import annotations
import html
import json
import shutil
import textwrap
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data'
SHARE_ROOT = ROOT / 'podijeli' / 'vijest'
IMAGE_ROOT = ROOT / 'assets' / 'news-preview'
SITE = 'https://gnk-asg.hr'
MAX_PREVIEWS = 80
W, H = 1200, 630


def font(size: int, bold: bool = False):
    paths = [
        '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf' if bold else '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
        '/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf' if bold else '/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf',
    ]
    for path in paths:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def clean(value: str | None) -> str:
    return ' '.join(str(value or '').split()).strip()


def cropped(value: str, length: int) -> str:
    value = clean(value)
    return value if len(value) <= length else value[:length - 1].rstrip() + '…'


def make_image(row: dict, target: Path) -> None:
    image = Image.new('RGB', (W, H), '#061326')
    draw = ImageDraw.Draw(image, 'RGBA')
    for y in range(H):
        ratio = y / H
        draw.line((0, y, W, y), fill=(6 + int(5 * ratio), 19 + int(16 * ratio), 38 + int(31 * ratio), 255))
    draw.ellipse((840, -100, 1250, 310), fill=(33, 105, 177, 42))
    draw.ellipse((930, 20, 1160, 250), fill=(212, 175, 55, 34))
    gold, white, muted = '#d4af37', '#ffffff', '#bdcede'
    group = cropped(str(row.get('group', 'news')).upper(), 18)
    source = cropped(row.get('source', 'Javni izvor'), 52)
    title = cropped(row.get('title', 'Business & Technology News'), 120)
    summary = cropped(row.get('summary', ''), 130)
    draw.rounded_rectangle((70, 56, 215, 113), radius=28, fill=(212, 175, 55, 28), outline=gold, width=2)
    draw.text((94, 75), 'NEWS', font=font(18, True), fill=gold)
    draw.text((72, 168), f'GNK ASG  •  {group}', font=font(18, True), fill=gold)
    wrapped = textwrap.wrap(title, width=39)[:3]
    y = 219
    for line in wrapped:
        draw.text((72, y), line, font=font(40, True), fill=white)
        y += 53
    if summary:
        draw.text((74, min(y + 21, 442)), textwrap.shorten(summary, width=88, placeholder='…'), font=font(17), fill=muted)
    draw.line((74, 515, 660, 515), fill=gold, width=2)
    draw.text((74, 542), source, font=font(17), fill='#a9bfd4')
    draw.text((933, 540), 'gnk-asg.hr', font=font(17, True), fill=gold)
    target.parent.mkdir(parents=True, exist_ok=True)
    image.save(target, format='PNG', optimize=True)


def page_html(row: dict, image_url: str, share_url: str) -> str:
    title = cropped(clean(row.get('title')), 160)
    summary = cropped(clean(row.get('summary')) or 'Otvorite izvor za cjelovitu objavu.', 240)
    source = cropped(clean(row.get('source')) or 'Javni izvor', 80)
    original = clean(row.get('url'))
    title_e = html.escape(title, quote=True)
    summary_e = html.escape(summary, quote=True)
    source_e = html.escape(source, quote=True)
    original_e = html.escape(original, quote=True)
    return f'''<!doctype html><html lang="hr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{title_e} | GNK ASG Business News</title><meta name="description" content="{summary_e}"><meta name="robots" content="noindex,follow"><link rel="canonical" href="{original_e}"><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><meta property="og:type" content="article"><meta property="og:title" content="{title_e}"><meta property="og:description" content="{summary_e}"><meta property="og:url" content="{share_url}"><meta property="og:site_name" content="GNK ASG Business &amp; Technology News"><meta property="og:image" content="{image_url}"><meta property="og:image:type" content="image/png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{title_e}"><meta name="twitter:description" content="{summary_e}"><meta name="twitter:image" content="{image_url}"><style>body{{font-family:Arial,sans-serif;background:#07162d;color:#fff;display:grid;place-items:center;min-height:100vh;margin:0}}.card{{max-width:700px;padding:34px;border:1px solid rgba(212,175,55,.4);border-radius:22px}}small{{color:#d4af37;font-weight:800;letter-spacing:.12em}}h1{{font-family:Georgia,serif;font-weight:500;font-size:1.7rem}}p{{color:#c2d0e2;line-height:1.6}}a{{display:inline-flex;margin-top:12px;background:#d4af37;color:#07162d;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:800}}</style></head><body><main class="card"><small>{source_e}</small><h1>{title_e}</h1><p>{summary_e}</p><a href="{original_e}" target="_blank" rel="noopener nofollow">Otvori izvor →</a></main></body></html>'''


def main() -> None:
    rows = json.loads((DATA / 'news.json').read_text(encoding='utf-8'))
    if SHARE_ROOT.exists(): shutil.rmtree(SHARE_ROOT)
    if IMAGE_ROOT.exists(): shutil.rmtree(IMAGE_ROOT)
    SHARE_ROOT.mkdir(parents=True, exist_ok=True)
    IMAGE_ROOT.mkdir(parents=True, exist_ok=True)
    generated = set()
    for row in rows[:MAX_PREVIEWS]:
        uid = clean(row.get('id'))
        if not uid or uid in generated: continue
        generated.add(uid)
        share_path = f'/podijeli/vijest/{uid}/'
        row['share_url'] = share_path
        image_rel = f'/assets/news-preview/{uid}.png'
        make_image(row, IMAGE_ROOT / f'{uid}.png')
        folder = SHARE_ROOT / uid
        folder.mkdir(parents=True, exist_ok=True)
        (folder / 'index.html').write_text(page_html(row, SITE + image_rel, SITE + share_path), encoding='utf-8')
    (DATA / 'news.json').write_text(json.dumps(rows, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Generated {len(generated)} individual social previews for public news.')


if __name__ == '__main__':
    main()
