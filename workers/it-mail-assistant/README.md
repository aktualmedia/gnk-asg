# GNK ASG IT Mail Assistant Worker

Cloudflare Email Routing Worker za adresu `it@gnk-asg.hr`.

## Svrha

1. Primiti dolazni mail na `it@gnk-asg.hr`.
2. Poslati kopiju/obavijest na `rht@gmx.com`.
3. Klasificirati sadržaj poruke.
4. Automatski poslati samo siguran opći odgovor.
5. Osjetljive poruke označiti za ljudski pregled i ne slati sadržajni automatski odgovor.

## Sigurnosni režim

Automatski odgovori dopušteni su samo za:

- potvrdu primitka,
- opće informacije o portalu,
- link na objave autora,
- opće tržišne napomene,
- uputu na kontakt formu.

Ljudski pregled potreban je za:

- pravne teme,
- financijske/porezne teme,
- ugovorne teme,
- medijske upite,
- sudske/sporne teme,
- osobne podatke,
- povjerljive dokumente,
- prigovore i pritiske,
- nejasne poruke.

## Potrebne Cloudflare varijable/secrets

```text
RESEND_API_KEY=...
# ili
BREVO_API_KEY=...

IT_REPLY_FROM=it@gnk-asg.hr
IT_NOTIFY_TO=rht@gmx.com
IT_AUTO_REPLY_ENABLED=true
```

## Preporučeni KV binding

```text
IT_MAIL_LOG_KV
```

## Napomena

Cloudflare Email Routing sam po sebi prima/prosljeđuje mail. Za slanje odgovora koristi se outbound provider, npr. Resend ili Brevo, preko server-side secreta. API ključevi ne idu u frontend.
