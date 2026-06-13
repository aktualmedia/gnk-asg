# Contact & Mail Routing — V13

## Što radi odmah
Kontakt forma na `/kontakt/` radi i bez backenda:
- korisnik odabere primatelja,
- upiše podatke,
- klikne “Otvori mail za slanje”,
- preglednik otvara e-mail klijent s popunjenim primateljem, predmetom i porukom.

## Što radi kada se spoji backend
Cloudflare Worker endpoint:
- `/contact-send`

Tada portal može:
- primiti upit,
- spremiti ga u KV/D1,
- klasificirati rizik,
- pripremiti auto-ack,
- poslati poruku prema odjelu preko Resend/Brevo,
- poslati potvrdu primitka korisniku.

## Kontakt lista
Datoteka:
- `/data/contacts.json`

Javni kontakti:
- info@gnk-asg.hr
- assistant@gnk-asg.hr
- it@gnk-asg.hr
- media@gnk-asg.hr
- legal@gnk-asg.hr
- investor@gnk-asg.hr

Status/command adresa:
- status@gnk-asg.hr
nije javna za goste.

## Pravila
- medijski, pravni, financijski i investitorski odgovori traže ručni pregled,
- auto-ack je dopušten kao potvrda primitka,
- stvarno outbound slanje ide samo server-side,
- nema secrets u frontendu.
