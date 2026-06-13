# GNK ASG — sljedeći ručni patch: SEO, memorija dnevnih objava i mobilna verzija

Datum: 2026-06-12
Status: pripremljeno za ručni unos kroz GitHub UI.

## Cilj

Kada korisnik sjedne za računalo, odraditi sve u jednom ciklusu:

1. Pojačati dnevne objave za Google SEO i meta.
2. Zaključati pravilo da svaki tekst ima najmanje 300 riječi.
3. Dodati memoriju objavljenih tekstova kako se ne bi ponavljali isti naslovi i isti izvori.
4. Poboljšati mobilnu verziju portala, legal stranice, menija, AI/AL plutajućeg gumba i kartica.

## Već dovršeno prije ovog patcha

- `legal.html` postoji i radi.
- Legal je dodan u sitemap.
- AL asistent je naučen za legal, privatnost, kolačiće, status podataka, LIVE/SNAPSHOT/DELAYED/FALLBACK i AI napomenu.
- `assets/portal-navigation.js` sada ima Legal u kompaktnom portalu.
- `assets/floating-intelligence.js` sada ima legal znanje i Legal link u AL panelu.
- Postoji workflow `daily-insights.yml` za tri dnevne objave.

## Ručni patch A — dnevne objave, SEO i memorija

Datoteke:

- `scripts/publish_daily_insight.py`
- `.github/workflows/daily-insights.yml`

Što treba napraviti:

1. U `publish_daily_insight.py` dodati `import hashlib`.
2. Dodati `MEMORY_PATH = ROOT / "data" / "daily_insight_memory.json"`.
3. Dodati `MIN_WORDS = 300`.
4. Dodati funkcije za `text_hash`, `word_count_text` i `memory_used`.
5. Funkciju `pick_item(news, log)` promijeniti u `pick_item(news, log, memory)`.
6. U `pick_item` zabraniti ponavljanje URL-a iz memorije i ponavljanje hashiranog naslova.
7. U `main()` učitati memoriju iz `data/daily_insight_memory.json`.
8. Svakom `entry` dodati:
   - `word_count`
   - `title_hash`
   - `source_hash`.
9. Nakon objave spremiti memorijski zapis u `data/daily_insight_memory.json`.
10. Funkciju `make_article_text` pojačati tako da tekst ne može biti kraći od 300 riječi.
11. U `.github/workflows/daily-insights.yml` zamijeniti git add liniju tako da dodaje i:
   - `assets/insights/daily`
   - `data/daily_insight_memory.json`
   - `sitemap.xml`.

Ciljna git add linija:

`git add insights-hr assets/insights/daily data/daily_insight_log.json data/daily_insight_memory.json sitemap.xml 2>/dev/null || true`

## Ručni patch B — Google SEO/meta pojačanje

U `render_article` za dnevne objave dodatno provjeriti da svaka objava ima:

- `meta name="author"`
- `meta name="googlebot" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"`
- `article:published_time`
- `article:modified_time`
- `article:section`
- `BreadcrumbList` JSON-LD
- `Article` JSON-LD
- `ImageObject` s caption, creditText i copyrightNotice.

## Ručni patch C — mobilna verzija

Datoteka:

- `assets/mobile-stability.css`

Dodati na kraj datoteke nova pravila za:

1. Sticky header na mobitelu.
2. Čitljiv i skrolabilan mobilni menu.
3. Legal menu horizontalno skrolabilan.
4. Legal tablice s horizontalnim skrolom.
5. AI/AL plutajući gumb desno dolje.
6. Home plutajući gumb lijevo dolje.
7. AI panel da ne izlazi iz ekrana.
8. Kartice i tablice da ne probijaju širinu ekrana.
9. Kontakt kartice u jedan stupac.
10. Hero gumbe u jedan stupac na vrlo malim ekranima.

Minimalni CSS koji treba dodati na kraj:

`@media(max-width:820px){html{scroll-padding-top:92px}.site-header{position:sticky;top:0;z-index:120;background:rgba(255,255,255,.96);backdrop-filter:blur(12px)}.brand img{max-width:152px;height:auto}.menu-toggle{min-height:44px;min-width:96px;border-radius:999px}.nav-links.open a{display:flex!important;align-items:center;min-height:46px;padding:0 13px;border-radius:12px;background:#f7f9fc;border:1px solid #e6edf5;color:#07162d!important;text-decoration:none;font-weight:850}.portal-navigation{display:grid!important;grid-template-columns:1fr!important;gap:7px;width:100%}.portal-navigation a{justify-content:space-between}.portal-navigation a:after{content:'›';color:#ad7d20;font-weight:900}.hero,.legal-hero{padding-top:36px!important;padding-bottom:30px!important}.hero h1,.legal-hero h1{font-size:clamp(2rem,10vw,3.1rem)!important;line-height:1.05}.kpi-grid,.tech-grid,.group-kpis,.legal-grid,.official-contact{grid-template-columns:1fr!important}.kpi,.card,.tech-card,.group-card,.legal-doc,.contact-card,.news-card,.coin,.doc{box-sizing:border-box;max-width:100%;overflow-wrap:anywhere}.legal-doc{padding:22px!important;border-radius:20px!important}.legal-menu{display:flex!important;overflow-x:auto!important;flex-wrap:nowrap!important;padding-bottom:8px;scrollbar-width:none}.legal-doc table{display:block;max-width:100%;overflow-x:auto}.float-home:not(.mobile-home){left:14px!important;right:auto!important;bottom:calc(78px + env(safe-area-inset-bottom))!important;width:50px!important;height:50px!important;z-index:104!important}.ai-mini{left:10px!important;right:10px!important;bottom:calc(142px + env(safe-area-inset-bottom))!important;max-height:calc(100dvh - 166px);overflow-y:auto}.ai-mini-links{display:grid!important;grid-template-columns:1fr 1fr!important}.market-toolbar,.converter{display:grid!important;grid-template-columns:1fr!important;gap:10px}}`

`@media(max-width:430px){.brand img{max-width:135px}.hero-actions{display:grid!important;grid-template-columns:1fr!important}.btn{width:100%;box-sizing:border-box;text-align:center}.ai-fab{width:46px!important;height:46px!important}.ai-mini{left:8px!important;right:8px!important;bottom:calc(132px + env(safe-area-inset-bottom))!important;width:auto!important;border-radius:20px!important}.ai-mini-links{grid-template-columns:1fr!important}.legal-doc h2{font-size:1.55rem!important}.profile-board,.contact-card{padding:22px!important}}`

## Ručni test nakon patcha

Otvoriti na mobitelu ili DevTools mobile view:

- `/`
- `/legal.html`
- `/kontakt/`
- `/trzista/`
- `/insights-hr/`
- zadnju objavu u `/insights-hr/daily/.../`

Provjeriti:

- nema horizontalnog scrolla
- menu se otvara i skrola
- Legal link postoji
- AL gumb postoji i otvara panel
- home gumb ne prekriva AL gumb
- tekstovi su čitljivi
- tablice ne probijaju ekran
- dnevni tekst ima najmanje 300 riječi
- objava je u sitemapu ili barem ima canonical i robots index/follow.
