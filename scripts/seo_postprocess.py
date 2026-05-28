#!/usr/bin/env python3
"""Apply durable, visible identity SEO links after metadata generation.

This step supplements structured data with normal, user-visible internal links.
It intentionally avoids hidden keyword stuffing: every identity form appears in
legitimate public-profile context associated with published portal content.
"""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

HR_PROFILE = '<p class="seo-profile-link">Povezani javni profil: <a href="/nermin-sefic/">Nermin Sefić</a> (Nermin Sefic; Sefić Nermin; Sefic Nermin).</p>'
EN_PROFILE = '<p class="seo-profile-link">Related public profile: <a href="/en/nermin-sefic/">Nermin Sefić</a> (Nermin Sefic; Sefić Nermin; Sefic Nermin).</p>'
PROFILE_META = (
    '  <meta property="profile:first_name" content="Nermin">\n'
    '  <meta property="profile:last_name" content="Sefić">\n'
)
HR_HUB_CARD = '<article class="item feature seo-identity-card"><span class="tag">Javni profil</span><h2>Nermin Sefić</h2><p>Nermin Sefić, Nermin Sefic, Sefić Nermin i Sefic Nermin — profil povezan s javnim sadržajem o GNK ASG d.o.o. i GNK DINAMO Ltd.</p><a href="../nermin-sefic/">Otvori javni profil →</a></article>'
PERSON_OLD = '"name":"Nermin Sefić","alternateName":["Nermin Sefic","Sefić Nermin","Sefic Nermin"]'
PERSON_NEW = '"name":"Nermin Sefić","givenName":"Nermin","familyName":"Sefić","alternateName":["Nermin Sefic","Sefić Nermin","Sefic Nermin"]'

HR_PAGES = [
    'financije/index.html', 'registri/index.html', 'tehnologija/index.html',
    'trzista/index.html', 'intelligence-desk/index.html', 'teme/index.html',
    'sadrzaj/index.html'
]
EN_PAGES = [
    'en/finance/index.html', 'en/registries/index.html',
    'en/technology/index.html', 'en/markets/index.html',
    'en/intelligence-desk/index.html'
]
ALL_PUBLIC_PAGES = [
    'index.html', 'en/index.html', 'nermin-sefic/index.html',
    'en/nermin-sefic/index.html', *HR_PAGES, *EN_PAGES,
    'instalacija/index.html'
]


def read(path: str) -> tuple[Path, str]:
    target = ROOT / path
    return target, target.read_text(encoding='utf-8')


def write_if_changed(target: Path, original: str, updated: str) -> None:
    if updated != original:
        target.write_text(updated, encoding='utf-8')


def ensure_home_links(path: str, english: bool = False) -> None:
    target, text = read(path)
    original = text
    if english:
        replacements = [
            ('<a href="#dokumenti">Documents</a></nav>', '<a href="#dokumenti">Documents</a><a href="nermin-sefic/">Nermin Sefić</a></nav>'),
            ('<small>Director</small><strong>Nermin Sefić</strong>', '<small>Director</small><strong><a href="nermin-sefic/">Nermin Sefić</a></strong>'),
            ('<dt>Director</dt><dd>Nermin Sefić</dd>', '<dt>Director</dt><dd><a href="nermin-sefic/">Nermin Sefić</a></dd>'),
            ('<dt>Authorised representative</dt><dd>Nermin Sefić</dd>', '<dt>Authorised representative</dt><dd><a href="nermin-sefic/">Nermin Sefić</a></dd>'),
        ]
    else:
        replacements = [
            ('<a href="#dokumenti">Dokumenti</a></nav>', '<a href="#dokumenti">Dokumenti</a><a href="nermin-sefic/">Nermin Sefić</a></nav>'),
            ('<small>Direktor</small><strong>Nermin Sefić</strong>', '<small>Direktor</small><strong><a href="nermin-sefic/">Nermin Sefić</a></strong>'),
            ('<dt>Direktor</dt><dd>Nermin Sefić</dd>', '<dt>Direktor</dt><dd><a href="nermin-sefic/">Nermin Sefić</a></dd>'),
            ('<dt>Ovlašteni predstavnik</dt><dd>Nermin Sefić</dd>', '<dt>Ovlašteni predstavnik</dt><dd><a href="nermin-sefic/">Nermin Sefić</a></dd>'),
        ]
    for old, new in replacements:
        if old in text and new not in text:
            text = text.replace(old, new, 1)
    write_if_changed(target, original, text)


def ensure_contextual_link(path: str, paragraph: str, exact_link: str) -> None:
    target, text = read(path)
    if exact_link not in text:
        text = text.replace('</footer>', paragraph + '</footer>', 1)
        target.write_text(text, encoding='utf-8')


def ensure_profile_meta(path: str) -> None:
    target, text = read(path)
    original = text
    if 'property="profile:first_name"' not in text:
        anchor = '  <meta property="og:type" content="profile">\n'
        if anchor in text:
            text = text.replace(anchor, anchor + PROFILE_META, 1)
        else:
            text = text.replace('</head>', PROFILE_META + '</head>', 1)
    write_if_changed(target, original, text)


def ensure_person_properties(path: str) -> None:
    target, text = read(path)
    if PERSON_OLD in text and PERSON_NEW not in text:
        target.write_text(text.replace(PERSON_OLD, PERSON_NEW), encoding='utf-8')


def ensure_profile_hub_card() -> None:
    target, text = read('sadrzaj/index.html')
    if 'seo-identity-card' not in text:
        marker = '<section><div class="container cards">'
        text = text.replace(marker, marker + HR_HUB_CARD, 1)
        target.write_text(text, encoding='utf-8')


def main() -> None:
    ensure_home_links('index.html')
    ensure_home_links('en/index.html', english=True)
    for page in HR_PAGES:
        ensure_contextual_link(page, HR_PROFILE, '<a href="/nermin-sefic/">Nermin Sefić</a>')
    for page in EN_PAGES:
        ensure_contextual_link(page, EN_PROFILE, '<a href="/en/nermin-sefic/">Nermin Sefić</a>')
    ensure_profile_meta('nermin-sefic/index.html')
    ensure_profile_meta('en/nermin-sefic/index.html')
    ensure_profile_hub_card()
    for page in ALL_PUBLIC_PAGES:
        ensure_person_properties(page)


if __name__ == '__main__':
    main()
