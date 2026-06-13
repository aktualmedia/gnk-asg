# GNK ASG operator mail API worker

Status: priprema za Cloudflare Workers.

Planirani endpointi:

```text
GET  /api/operator/mail-batch/send
POST /api/operator/mail-batch/send
GET  /api/operator/mail-log/list
```

Funkcije:

1. Validirati operator sesiju kroz Cloudflare Access ili drugi odobreni zaštitni sloj.
2. Validirati pošiljatelja, predmet, tekst i do 30 primatelja.
3. Slati test ili batch mail preko outbound mail providera.
4. Spremiti službeni zapis u KV ili D1.
5. Vratiti operator dashboardu strukturirani JSON status.
6. Ne spremati API ključeve u frontend.

Sigurnosno pravilo:

- Test i batch slanje rade samo kroz autorizirani backend.
- Svako slanje mora imati zapis radnje.
- Masovno slanje ostaje ograničeno na 30 primatelja po paketu.
- Pravni, financijski, medijski, sudski, osobni i osjetljivi odgovori idu na ljudsku potvrdu.

Potrebni Cloudflare secrets / varijable:

```text
RESEND_API_KEY=
BREVO_API_KEY=
MAIL_FROM=it@gnk-asg.hr
MAIL_FROM_NAME=GNK ASG
OPERATOR_ALLOW_NO_ACCESS=false
```

Preporučeni binding:

```text
MAIL_LOG_KV=
```

Napomena:

Ako se koristi Resend, dovoljan je `RESEND_API_KEY`. Ako se koristi Brevo, dovoljan je `BREVO_API_KEY`. Nije potrebno imati oba providera.
