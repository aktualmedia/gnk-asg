# GNK ASG Content Publish API

Cloudflare Worker za admin objave i sadržaj.

## Endpointi

```text
POST /api/operator/content/publish
GET  /api/operator/content/list
```

## Namjena

- primiti paket iz `/operator/post-compose/`,
- validirati obvezna polja,
- spremiti paket u KV kao `draft` ili `ready_to_publish`,
- vratiti strukturirani JSON odgovor admin aplikaciji,
- voditi log i operator identitet.

## Važno

Ovaj Worker u prvoj fazi ne mijenja statički javni portal i ne piše u GitHub. On sprema sadržaj u Cloudflare KV kao kontrolirani backend sloj. Javno objavljivanje statičke stranice zahtijeva odvojeni, zaštićeni publish/deploy proces.

## Binding

```text
CONTENT_DRAFT_KV
```

## Sigurnost

- Cloudflare Access za `/api/operator/content/*`.
- `OPERATOR_ALLOW_NO_ACCESS=true` samo za kontrolirani test.
- Nema API ključeva u frontendu.
- Osjetljive objave moraju imati ljudski pregled.
