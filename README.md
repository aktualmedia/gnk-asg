# GNK ASG d.o.o. — Corporate Technology Portal

Službeni korporativni portal **GNK ASG d.o.o.** — Sport, Technology, Finance & Governance.

## Javni portal

GitHub Pages adresa:

`https://aktualmedia.github.io/gnk-asg/`

## Ugrađeni moduli

- korporativni profil GNK ASG d.o.o. i vizualni identitet
- revidirani financijski pokazatelji za FY 2025
- GNK DINAMO Ltd. Group Overview s odvojenom napomenom o osnovi grupnih podataka
- interaktivna globalna mreža grupe: 33 postojeća društva i 12 planiranih pozicija, filtri, zumiranje i premium animirani tokovi povezanosti
- Technology & Artificial Intelligence odjeljak
- Digital Assets Monitor s indikativnim cijenama, valutnim konverterom i tržišnim grafovima
- ASG Gold Reference informativni pre-launch prikaz
- Business & Technology News rubrike za Hrvatsku, Sloveniju, Srbiju, BiH i međunarodne izvore
- FINA Info.BIZ / RGFI panel sa službenim poveznicama za provjeru
- GNK ASG Intelligence Desk kao informativno korisničko sučelje nad javnim podatcima portala
- PWA manifest, mobilna navigacija i network-first service worker

## Sigurnosni model medijskih objava

Portal je javna statična stranica. Zato se vjerodajnice, privatni administrativni redovi i neodobreni rezultati pretrage ne spremaju u javno sučelje niti u javne podatkovne datoteke portala.

- javna rubrika `GNK ASG u medijima` čita samo `data/media_approved.json`;
- objava ulazi u javni prikaz samo kroz autorizirani ručni workflow `manage-approved-media.yml`;
- status dostupnosti medijskog monitoringa zapisuje se u `data/media_monitor_status.json`;
- administrativna stranica prikazuje samo javno odobrene objave i status monitoringa.

## Automatski workflowi

### `Hourly Business and Market Update`

Datoteka: `.github/workflows/hourly-data-update.yml`

- izvršava se svaki sat u 17. minuti;
- moguće ga je pokrenuti ručno kroz karticu **Actions**;
- pokreće `scripts/update_feeds_v2.py` i `scripts/update_macro_data.py`;
- ažurira `data/news.json`, `data/market.json`, `data/btc_chart.json`, `data/macro_market.json` i `data/update_status.json`;
- promjene automatski sprema u repozitorij.

### `Media Monitor Status`

Datoteka: `.github/workflows/media-monitor-status.yml`

- provjerava dostupnost javnih pretraga za relevantne korporativne pojmove;
- ne sprema niti javno prikazuje neodobrene rezultate;
- ažurira samo javni status monitoringa.

### `Approve Corporate Media Publication`

Datoteka: `.github/workflows/manage-approved-media.yml`

- ovlaštenom korisniku omogućuje ručno odobriti ili ukloniti provjerenu javnu objavu;
- mijenja samo javnu listu odobrenih poveznica.

### `Daily SEO Refresh`

Datoteka: `.github/workflows/daily-seo-refresh.yml`

- izvršava se dnevno;
- moguće ga je pokrenuti ručno;
- generira `sitemap.xml` i `robots.txt` za javne stranice, bez indeksiranja administratorskog ulaza.

## Kontrola prikaza vijesti

Datoteka `data/blocked_news.json` služi za uklanjanje neželjenih URL-ova ili izraza iz naslova u javnom prikazu. Nakon izmjene blok-liste, sadržaj se prilagođava pri sljedećem automatskom ažuriranju.

## Podatkovna osnova

Korporativni podatci GNK ASG d.o.o. i financijski pokazatelji za FY 2025 temelje se na dostavljenim financijskim dokumentima i izvješću neovisnog revizora. Podatci o GNK DINAMO Ltd. grupnom okviru prikazuju se odvojeno, uz jasnu napomenu o osnovi i statusu grupnog dokumenta.
