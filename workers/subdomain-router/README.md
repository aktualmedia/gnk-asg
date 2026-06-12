# GNK ASG Subdomain Router

Cilj: front/globus/izgled javnog portala ostaje odvojen, a ostali funkcionalni slojevi idu u posebne poddomene ili posebne putanje.

## Predloženo mapiranje

```text
business.gnk-asg.hr -> /business/
front.gnk-asg.hr    -> /front/
news.gnk-asg.hr     -> /news/
admin.gnk-asg.hr    -> /operator/app/
backend.gnk-asg.hr  -> /backend/
app.gnk-asg.hr      -> /app/
api.gnk-asg.hr      -> /api/operator/*
```

## Što ostaje na glavnom frontu

- vizualni identitet,
- globus/front izgled,
- osnovna javna prezentacija.

## Što se odvaja

- poslovna stranica: `/business/`,
- vijesti: `/news/`,
- admin: `/operator/app/`,
- backend gateway: `/backend/`,
- javna aplikacija: `/app/`,
- API: `/api/operator/*`.

## Sigurnost

`admin`, `backend` i `api` slojeve zaštititi Cloudflare Accessom.

## Napomena

Ovaj Worker je opcionalan. Ako se poddomene ručno mapiraju kroz Cloudflare Pages/Workers rute, ovaj router može služiti samo kao dokumentacija i rezervni model.
