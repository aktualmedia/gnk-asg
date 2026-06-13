# Backup produkcijske naslovnice prije kandidata

Datum: 2026-06-13
Repozitorij: aktualmedia/gnk-asg
Datoteka: index.html
Produkcijski index SHA: 4804eb83923c7a42e1a0b4c8889d63113dc50b7a

## Svrha

Ovaj zapis čuva kontrolnu točku postojeće produkcijske naslovnice prije moguće buduće zamjene kandidatom iz `/home-candidate/`.

## Trenutačno stanje

- Produkcijska `/` stranica nije zamijenjena.
- Kandidat nove naslovnice nalazi se na `/home-candidate/`.
- Kandidat je `noindex,nofollow` i nije za indeksiranje dok ne postane produkcija.
- Novi HR/EN slojevi postoje kroz `/front/`, `/en/front/`, `/news/`, `/en/news/`, `/downloads/`, `/en/downloads/`, `/locations/`, `/en/locations/`, `/assistant/`, `/en/assistant/`, `/media-kit/`, `/en/media-kit/`, `/documentation/`, `/en/documentation/`.

## Kontrole prije zamjene

Prije zamjene `/` mora se provjeriti:

- `/operator/frontend-health/`
- `/operator/release-check/`
- `/operator/route-map/`
- `/data/release_checklist.json`
- `/data/route_map.json`
- `/sitemap-corporate.xml`
- `/robots.txt`

## Rollback pravilo

Ako nova naslovnica nakon zamjene pokaže grešku, vratiti `index.html` na sadržaj iz produkcijskog SHA-a:

`4804eb83923c7a42e1a0b4c8889d63113dc50b7a`

Ovaj backup zapis nije sama HTML kopija, nego kontrolna referenca na Git blob SHA postojeće naslovnice.
