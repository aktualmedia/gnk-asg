# GNK ASG Corporate Redesign Snapshot

Date: 2026-06-13
Timezone: Europe/Zagreb
Repository: aktualmedia/gnk-asg
Snapshot commit: 501a5199506a5fa7bdb2bc33e9703e3c20ceb909

## Purpose

This snapshot records the working state of the corporate redesign package before further homepage replacement work.

## Active redesign layers

- `/front/` - corporate preview front
- `/media-kit/` - GNK ASG media kit
- `/downloads/` - structured public download hub
- `/locations/` - global locations layer from globe/network data
- `/gnk-dinamo-ltd-media-kit/` - GNK DINAMO Ltd. Colorado, USA media kit layer
- `/data/redesign_manifest.json` - current redesign manifest
- `/data/company_locations.json` - locations data source
- `/data/gnk_dinamo_ltd_media_kit.json` - GNK DINAMO Ltd. media kit data
- `/data/ai_assistant_public_model.json` - public assistant model

## Protected functions

- business news refresh at 09:00 and 16:00 Europe/Zagreb
- market monitor with EUR and clear LIVE/SNAPSHOT/DELAYED/FALLBACK status policy
- Bitcoin, gold, Brent and USD/EUR informational modules
- contact form and WhatsApp communication layer
- AI assistant and operator layers
- admin app, API check, frontend health and backend gateway
- legal, finance, registry and document pages
- GNK ASG, GNK DINAMO Ltd. and Nermin Sefić SEO structure

## Rollback note

If the redesign preview introduces an issue, production homepage should remain on the existing `/` state while `/front/`, `/downloads/`, `/locations/`, `/media-kit/` and `/gnk-dinamo-ltd-media-kit/` are corrected independently.

## Next controlled steps

1. Keep production homepage unchanged until preview is validated.
2. Stabilize `/front/` and remove any missing script references.
3. Add a news layer under `/news/` and route `news.gnk-asg.hr` to it.
4. Extend operator dashboard with status, news, market, downloads, locations, mail drafts and document index.
5. Create user-facing functionality guide and operator manual.
