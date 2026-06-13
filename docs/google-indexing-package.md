# Google Indexing Package — V15

## Što je pripremljeno
- meta verification placeholder na svim stranicama,
- sitemap.xml,
- robots.txt,
- priority URL list,
- SEO/meta data files,
- profile pages,
- gallery manifest,
- self-test za indexing module.

## Što treba ručno potvrditi prije produkcije
Zbog ograničenja ove okoline nisam mogao pouzdano izvući live Google verification kod iz izvornog HTML-a postojeće stranice.
Zato je ugrađen placeholder:
`google46686328e30c759f.html`

## Korak prije deploya
1. Otvori izvor postojeće live stranice.
2. Kopiraj postojeći `<meta name="google-site-verification" ...>` content.
3. Zamijeni placeholder na svim stranicama ili globalnim template datotekama.
4. Nakon deploya provjeri Search Console i submitaj sitemap.
