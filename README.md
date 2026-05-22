# GNK ASG d.o.o. — Corporate Technology Portal

Official corporate website of **GNK ASG d.o.o.** — Sport, Technology, Finance & Governance.

## Javni portal

Predviđena GitHub Pages adresa:

`https://aktualmedia.github.io/gnk-asg/`

## Ugrađeni moduli

- korporativni profil GNK ASG d.o.o. i vizualni identitet
- revidirani financijski pokazatelji za FY 2025
- GNK DINAMO Ltd. Group Overview s odvojenom napomenom o osnovi grupnih podataka
- Technology & Artificial Intelligence odjeljak
- Digital Assets Monitor s indikativnim cijenama i valutnim konverterom
- Business & Technology News rubrike za Hrvatsku, Sloveniju, Srbiju, BiH i međunarodne izvore
- FINA Info.BIZ / RGFI panel s javnim službenim poveznicama
- GNK ASG AI Assistant u plutajućem prozoru i unutar stranice
- PWA manifest i network-first service worker

## Automatski workflowi

### `Hourly Business and Market Update`

Datoteka: `.github/workflows/hourly-data-update.yml`

- izvršava se svaki sat u 17. minuti;
- moguće ga je pokrenuti ručno kroz karticu **Actions**;
- pokreće `scripts/update_data.py`;
- ažurira `data/news.json`, `data/market.json`, `data/update_status.json` i `data/mentions_found.json`;
- promjene automatski sprema u repozitorij.

### `Daily SEO Refresh`

Datoteka: `.github/workflows/daily-seo-refresh.yml`

- izvršava se dnevno;
- moguće ga je pokrenuti ručno;
- generira `sitemap.xml` i `robots.txt` za indeksiranje javne stranice.

## Kontrola prikaza vijesti

Datoteka `data/blocked_news.json` služi za uklanjanje neželjenih URL-ova ili naslova iz javnog prikaza. Nakon izmjene blok-liste, sadržaj se prilagođava kod sljedećeg automatskog ažuriranja.

## Podatkovna osnova

Korporativni podatci GNK ASG d.o.o. i financijski pokazatelji za FY 2025 temelje se na dostavljenim financijskim dokumentima i izvješću neovisnog revizora. Podatci o GNK DINAMO Ltd. grupnom okviru prikazuju se odvojeno, uz jasnu napomenu o osnovi i statusu grupnog dokumenta.
