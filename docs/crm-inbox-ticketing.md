# CRM / Inbox / Ticketing — V14

## Cilj
Svaki upit iz forme, maila ili WhatsAppa ne ostaje samo poruka, nego postaje:
- inquiry,
- ticket,
- lead,
- draft odgovor,
- audit događaj.

## Statusi
- new
- triaged
- draft_prepared
- waiting_approval
- answered
- closed
- spam

## Prioriteti
- low
- medium
- high
- critical

## Lead pipeline
- new_lead
- qualified
- nda_needed
- data_room
- meeting
- proposal
- closed_won
- closed_lost

## Pravila
- low: auto-ack dopušten
- medium: draft + pregled
- high: ručni pregled
- critical: karantena ili eskalacija

## Backend
Endpoint:
- `/crm-event`

Koristi se za evidentiranje:
- klasifikacije,
- generiranja drafta,
- zahtjeva za odobrenje,
- slanja,
- zatvaranja,
- exporta,
- brisanja.

## GDPR
- consent obvezan,
- minimizacija podataka,
- default retention 12 mjeseci osim ako postoji pravni/ugovorni razlog,
- export/delete request kroz ručni review.
