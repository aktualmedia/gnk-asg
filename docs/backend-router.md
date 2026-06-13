# Backend router — V10

Cloudflare Worker: `backend/worker.js`

Endpointi:
- `/__health`
- `/config`
- `/command`
- `/contact`
- `/email-inbound`
- `/email-send`
- `/public-chat`
- `/private-chat`
- `/whatsapp-webhook`
- `/whatsapp-send`

## Javni agent
Besplatni lokalni AI: nema API troška i nema tajnih ključeva.

## Privatni agent
Za izvršenje treba `OPERATOR_TOKEN`.

## Mail
Prima, čita envelope, klasificira, označava rizik, priprema draft. Slanje samo server-side i uz potvrdu.

## WhatsApp
Automatika samo kroz službeni WhatsApp Business Cloud API. Privatni WhatsApp se ne automatizira neslužbeno.

## Secrets
- OPERATOR_TOKEN
- GITHUB_TOKEN
- GITHUB_REPO
- RESEND_API_KEY/BREVO_API_KEY
- WHATSAPP_TOKEN
- WHATSAPP_PHONE_NUMBER_ID
- OPENAI_API_KEY opcionalno samo za privatni/napredni AI
