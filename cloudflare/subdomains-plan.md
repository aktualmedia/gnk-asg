# GNK ASG — plan poddomena i lagane arhitekture

Cilj: naslovnica `gnk-asg.hr` ostaje lagana, dok se veći moduli izdvajaju na poddomene ili zasebne rute.

## Preporučene poddomene

1. `media.gnk-asg.hr` — media kit, brand materijali, fact sheetovi, press paket i download zona.
2. `news.gnk-asg.hr` — vijesti, Auto Editor objave, arhiva, news sitemap.
3. `status.gnk-asg.hr` — javni status: market/news/SEO/data refresh, bez admin ovlasti.
4. `operator.gnk-asg.hr` — zaštićeni operator/admin sloj preko Cloudflare Accessa.
5. `data.gnk-asg.hr` ili `api.gnk-asg.hr` — javni read-only JSON sloj i kasniji Worker endpointi.
6. `assistant.gnk-asg.hr` — javni AI pomoćnik samo za javne podatke.

## Cloudflare DNS osnova

Za početak otvoriti DNS zapise kao proxied CNAME ili Worker route, ovisno o konačnom modelu:

- `media` → Cloudflare Pages / Worker koji servira media kit
- `news` → Cloudflare Pages / Worker koji servira news sloj
- `status` → Worker read-only status
- `operator` → Worker + Cloudflare Access
- `data` ili `api` → Worker read-only JSON/API
- `assistant` → javni AI sloj bez admin ovlasti

## Sigurnost

`operator.gnk-asg.hr` ne smije biti javno indeksiran i mora ići preko Cloudflare Accessa ili sigurnosnog koda. Javni AI, media kit, news i status nemaju admin ovlasti.

## Faza sada

GitHub priprema preview strukturu. Javna aktivacija ide tek nakon odobrenja izgleda i Cloudflare DNS/routing potvrde.
