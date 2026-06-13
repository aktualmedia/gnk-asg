# GNK ASG — komunikacijski sloj: domena mail, kontakt forma, WhatsApp i AL odgovori

Datum: 2026-06-12
Status: pripremljeno za jedan zajednički ručni ciklus s već spremljenim SEO/mobile patchom.

## Cilj

Postaviti komunikacijski sustav portala GNK ASG tako da portal može:

1. Primati e-mailove na adresama s domene `gnk-asg.hr`.
2. Slati e-mailove s domene `gnk-asg.hr`.
3. Imati javnu kontakt formu s anti-spam zaštitom i GDPR privolom.
4. Imati WhatsApp chat u prvoj fazi kao floating link, a u drugoj fazi kao WhatsApp Business Cloud API webhook.
5. Omogućiti da AL čita samo odobrene ulazne poruke iz komunikacijskog inboxa, klasificira ih i priprema odgovore.
6. Spriječiti da AL automatski šalje osjetljive, pravne, financijske, osobne ili sporne odgovore bez ljudske potvrde.

## Preporučeni model

### Faza 1 — stabilno i brzo

- Cloudflare Email Routing / Email Worker za primanje poruka.
- Kontakt forma šalje podatke na Cloudflare Worker endpoint `/api/contact`.
- Worker sprema upite u D1/KV/R2 log i šalje obavijest na korisnikovu kontrolnu adresu.
- Outbound slanje preko Resend ili Brevo, nakon verifikacije domene i DNS zapisa.
- AL priprema nacrt odgovora, ali ne šalje samostalno osim generičke potvrde primitka.
- WhatsApp floating button ostaje aktivan s predefiniranom porukom.

### Faza 2 — puna automatizacija

- `it@gnk-asg.hr` ili `assistant@gnk-asg.hr` prima poruke.
- Email Worker parsira poruku, sprema metapodatke i tekst u inbox bazu.
- AL klasificira poruku: opći upit, kontakt, mediji, pravno, financije, tehnički problem, spam, hitno.
- AL generira nacrt odgovora i status: `draft`, `needs_approval`, `safe_ack_sent`, `blocked_sensitive`.
- WhatsApp Business Cloud API webhook prima poruke i šalje samo sigurne generičke odgovore ili traži ljudsku potvrdu.

## E-mail adrese za domenu

Predložene adrese:

- `info@gnk-asg.hr` — opći upiti
- `contact@gnk-asg.hr` — kontakt forma
- `it@gnk-asg.hr` — IT / Osobni digitalni asistent
- `assistant@gnk-asg.hr` — AL / AI asistent
- `legal@gnk-asg.hr` — pravne obavijesti i zahtjevi
- `privacy@gnk-asg.hr` — GDPR / privatnost
- `media@gnk-asg.hr` — medijski upiti
- `no-reply@gnk-asg.hr` — sistemske potvrde, bez primanja odgovora

## DNS i autentifikacija domene

Za slanje mailova s domene treba pripremiti:

- SPF zapis prema odabranom outbound pružatelju.
- DKIM zapise prema odabranom outbound pružatelju.
- DMARC zapis s početnim režimom `p=none`, kasnije `quarantine` ili `reject` nakon testiranja.
- MX zapise ako se koristi Cloudflare Email Routing ili drugi mail provider.

Početni DMARC prijedlog:

```txt
_dmarc.gnk-asg.hr TXT "v=DMARC1; p=none; rua=mailto:privacy@gnk-asg.hr; adkim=s; aspf=s"
```

Kasnije, nakon testiranja:

```txt
_dmarc.gnk-asg.hr TXT "v=DMARC1; p=quarantine; rua=mailto:privacy@gnk-asg.hr; adkim=s; aspf=s"
```

## Cloudflare inbound model

Datoteke koje će se dodati u sljedećem ciklusu:

- `workers/email-router/src/index.ts`
- `workers/contact-api/src/index.ts`
- `workers/whatsapp-webhook/src/index.ts`
- `data/communications_policy.json`
- `data/contact_form_schema.json`
- `data/ai_mail_rules.json`
- `kontakt/index.html` dopuna ili nova kontakt forma
- `legal.html` dopuna privatnosti za kontakt formu, e-mail i WhatsApp

## Email Worker logika

Ulazna poruka:

- čita `from`, `to`, `subject`, `message-id`, `date`, veličinu i osnovni tekst
- odbija ili označava spam / automatizirane poruke
- sprema zapis u D1/KV
- prosljeđuje kopiju na ljudsku adresu
- šalje samo generičku potvrdu primitka ako je sigurno
- AL-u daje samo očišćeni tekst i metapodatke

### Sigurnosno pravilo

AL ne smije samostalno slati odgovore za:

- pravne sporove
- financijske odluke
- porezna pitanja
- kaznene/sudske predmete
- privatne medicinske/osobne podatke
- lozinke, tokene, bankovne podatke
- medijske izjave koje mogu biti službeni stav
- zahtjeve za brisanje, izmjenu ili otkrivanje podataka
- bilo koju poruku koja traži preuzimanje obveze u ime društva

Za takve poruke status mora biti:

```json
{
  "status": "needs_human_approval",
  "reason": "sensitive_or_official_response"
}
```

## Kontakt forma

Polja:

- ime i prezime / naziv
- e-mail
- telefon, opcionalno
- tema
- vrsta upita: opći, poslovni, medijski, pravni, privatnost/GDPR, tehnički, drugo
- poruka
- privola za obradu podataka
- Turnstile token

Javna poruka ispod forme:

```text
Podatci uneseni u kontakt formu koriste se isključivo radi zaprimanja i obrade upita. Poruka ne predstavlja automatsko prihvaćanje obveze, ponude ili pravnog odnosa. Za osjetljive pravne, financijske i osobne upite odgovor daje ovlaštena osoba nakon provjere.
```

## Kontakt forma endpoint

Endpoint:

```text
/api/contact
```

Metoda:

```text
POST
```

Obvezno:

- Turnstile server-side provjera
- rate limit po IP-u / e-mailu
- osnovna spam detekcija
- D1/KV zapis
- outbound potvrda korisniku
- outbound obavijest administratoru

## Outbound slanje

Preporuka za prvu verziju:

- Resend ili Brevo za slanje
- `no-reply@gnk-asg.hr` za potvrde
- `it@gnk-asg.hr` ili `assistant@gnk-asg.hr` samo za potpis asistenta
- `legal@gnk-asg.hr` i `privacy@gnk-asg.hr` ne koristiti za automatske odgovore osim potvrde primitka

Predloženi potpis:

```text
IT – Osobni digitalni asistent
GNK ASG d.o.o.
Korporativni portal: https://gnk-asg.hr/

Ova poruka je informativna automatska potvrda. Ne predstavlja pravni, financijski, porezni, investicijski ni službeni poslovni savjet. Za službeni odgovor potrebna je ljudska provjera.
```

## WhatsApp

### Faza 1 — odmah

- Floating WhatsApp button prema broju korisnika.
- Predloženi tekst poruke:

```text
Pozdrav, kontaktiram GNK ASG d.o.o. putem portala u vezi teme:
```

### Faza 2 — WhatsApp Business Cloud API

Potrebno pripremiti:

- Meta Business račun
- WhatsApp Business Account
- Phone Number ID
- Access token
- Webhook verify token
- Webhook URL: `/api/whatsapp/webhook`
- Pravila automatskih odgovora

Automatski WhatsApp odgovori smiju biti samo:

- potvrda primitka
- upućivanje na legal/kontakt stranicu
- opći odgovor iz javnih informacija portala
- obavijest da je upit proslijeđen ljudskoj osobi

Ne smiju biti:

- pravni odgovor
- financijski savjet
- medijska izjava
- odgovor o sporu
- odgovor koji stvara obvezu

## AL čita e-mailove

AL ne čita privatni mailbox korisnika.

AL smije čitati samo:

- poruke zaprimljene kroz `contact@gnk-asg.hr`, `info@gnk-asg.hr`, `assistant@gnk-asg.hr` ili kontakt formu
- očišćeni tekst poruke
- osnovne metapodatke
- status obrade
- javni kontekst portala

AL ne smije čitati:

- privatne e-mailove iz osobnog računa
- lozinke, tokene, bankovne podatke
- privitke bez odobrenja
- poruke označene kao pravno/financijski/sudsko osjetljive bez ručne potvrde

## AI workflow statusi

```json
{
  "received": "poruka zaprimljena",
  "classified": "poruka klasificirana",
  "safe_ack_sent": "poslana generička potvrda primitka",
  "draft_ready": "AL je pripremio nacrt odgovora",
  "needs_approval": "potrebna ljudska potvrda",
  "blocked_sensitive": "automatski odgovor blokiran zbog osjetljivosti",
  "sent_by_human": "odgovor poslan nakon ljudske potvrde"
}
```

## Minimalni `communications_policy.json`

```json
{
  "version": "2026-06-12",
  "default_language": "hr",
  "assistant_name": "IT – Osobni digitalni asistent",
  "company": "GNK ASG d.o.o.",
  "domain": "gnk-asg.hr",
  "allowed_auto_replies": [
    "generic_acknowledgement",
    "public_portal_information",
    "contact_routing",
    "privacy_request_received",
    "technical_issue_received"
  ],
  "blocked_auto_replies": [
    "legal_advice",
    "financial_advice",
    "tax_advice",
    "investment_advice",
    "media_statement",
    "court_or_criminal_matter",
    "contractual_commitment",
    "bank_or_password_or_token_data",
    "personal_sensitive_data"
  ],
  "human_approval_required": true,
  "generic_acknowledgement_hr": "Poštovani, potvrđujemo primitak Vaše poruke. Upit je zaprimljen kroz komunikacijski sustav portala GNK ASG d.o.o. Ako se upit odnosi na pravna, financijska, osobna ili druga osjetljiva pitanja, odgovor će dati ovlaštena osoba nakon provjere.",
  "generic_acknowledgement_en": "Dear sender, we confirm receipt of your message. Your inquiry has been received through the GNK ASG d.o.o. portal communication system. If the inquiry concerns legal, financial, personal or other sensitive matters, an authorized person will review it before any substantive response."
}
```

## Redoslijed kad sjednemo za računalo

1. GitHub: otvoriti već spremljeni SEO/mobile patch.
2. Primijeniti mobilni CSS i SEO/memory izmjene.
3. Cloudflare: provjeriti DNS i Email Routing.
4. Cloudflare: dodati e-mail adrese i routeove.
5. Outbound provider: verificirati domenu za slanje.
6. GitHub: dodati Worker datoteke i kontakt formu.
7. Cloudflare: postaviti secrets.
8. Testirati kontakt formu.
9. Testirati inbound e-mail.
10. Testirati generičku potvrdu primitka.
11. Testirati AL nacrt odgovora bez automatskog slanja.
12. Tek nakon toga aktivirati WhatsApp Business webhook ako je Meta račun spreman.

## Secrets koje treba pripremiti

```text
TURNSTILE_SECRET_KEY=
TURNSTILE_SITE_KEY=
RESEND_API_KEY=
CONTACT_NOTIFY_EMAIL=
CONTACT_FROM_EMAIL=no-reply@gnk-asg.hr
ASSISTANT_FROM_EMAIL=it@gnk-asg.hr
AL_REPLY_MODE=draft_only
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
OPENAI_API_KEY= ili WORKERS_AI_BINDING=
```

## Testovi

- kontakt forma šalje upit
- Turnstile blokira prazne/spam zahtjeve
- e-mail potvrda dolazi korisniku
- admin obavijest dolazi korisniku
- AL priprema nacrt odgovora
- AL ne šalje pravne/financijske odgovore automatski
- WhatsApp floating link radi
- WhatsApp webhook radi tek kada Meta konfiguracija bude spremna

## Pravilo za produkciju

Prva produkcijska verzija mora biti `draft_only` za AL odgovore.

Dozvoljeno automatski poslati samo generičku potvrdu primitka. Svaki sadržajni odgovor, osobito pravni, financijski, medijski ili službeni, mora ići na ljudsku potvrdu.
