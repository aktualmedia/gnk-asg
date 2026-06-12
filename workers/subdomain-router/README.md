# GNK ASG Subdomain Router

Plan za razdvajanje portala na odvojene slojeve:

- `front.gnk-asg.hr` -> `/front/`
- `news.gnk-asg.hr` -> `/news/`
- `admin.gnk-asg.hr` -> `/operator/app/`
- `backend.gnk-asg.hr` -> `/backend/`
- `app.gnk-asg.hr` -> `/app/`
- `api.gnk-asg.hr` -> `/api/operator/*`

Ovaj Worker je opcionalni Cloudflare routing sloj. Može se koristiti ako se želi host-based routing bez mijenjanja statičkog repozitorija.

Za admin/backend/api slojeve preporučuje se Cloudflare Access.
