# GNK ASG email router worker

Status: priprema za Cloudflare Email Routing / Email Worker.

Planirane adrese:

```text
info@gnk-asg.hr
contact@gnk-asg.hr
it@gnk-asg.hr
assistant@gnk-asg.hr
legal@gnk-asg.hr
privacy@gnk-asg.hr
media@gnk-asg.hr
```

Logika:

1. Primiti ulazni e-mail s domene.
2. Spremiti osnovne metapodatke u inbox log.
3. Proslijediti kopiju na kontrolnu adresu.
4. Pripremiti AL klasifikaciju poruke.
5. Poslati samo generičku potvrdu primitka kada je sigurno.
6. Osjetljive teme označiti kao `needs_approval`.

AL pravilo:

```text
AL čita samo odobreni komunikacijski inbox/log, ne privatni mailbox.
```

Prva produkcijska postavka:

```text
AL_REPLY_MODE=draft_only
```

DNS:

- MX za Cloudflare Email Routing ili odabrani mail provider.
- SPF za outbound providera.
- DKIM za outbound providera.
- DMARC najprije `p=none`, zatim nakon testiranja `p=quarantine`.
