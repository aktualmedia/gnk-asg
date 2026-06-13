# GNK ASG contact API worker

Status: priprema za Cloudflare Workers.

Planirani endpoint:

```text
POST /api/contact
```

Funkcije:

1. Validirati obvezna polja kontakt forme.
2. Provjeriti Cloudflare Turnstile token server-side.
3. Spremiti upit u D1 ili KV log.
4. Poslati generičku potvrdu primitka korisniku preko outbound mail providera.
5. Poslati obavijest administratoru.
6. Ostaviti AL-u samo nacrt odgovora i klasifikaciju poruke.

Sigurnosno pravilo:

- Automatski se smije poslati samo potvrda primitka.
- Pravni, financijski, medijski, sudski, osobni i osjetljivi odgovori idu na ljudsku potvrdu.

Potrebni Cloudflare secrets:

```text
TURNSTILE_SECRET_KEY=
RESEND_API_KEY=
CONTACT_NOTIFY_EMAIL=
CONTACT_FROM_EMAIL=no-reply@gnk-asg.hr
ASSISTANT_FROM_EMAIL=it@gnk-asg.hr
AL_REPLY_MODE=draft_only
```
