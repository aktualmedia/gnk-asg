# GNK ASG Release Checklist

Date: 2026-06-13
Version: v5

## Candidate

- `/home-candidate/`

## HR routes

- `/front/`
- `/news/`
- `/downloads/`
- `/locations/`
- `/assistant/`
- `/documentation/`
- `/media-kit/`
- `/design-system/`
- `/gnk-dinamo-ltd-media-kit/`

## EN routes

- `/en/front/`
- `/en/news/`
- `/en/downloads/`
- `/en/locations/`
- `/en/assistant/`
- `/en/documentation/`
- `/en/media-kit/`
- `/en/design-system/`
- `/en/gnk-dinamo-ltd-media-kit/`

## Data routes

- `/data/status.json`
- `/data/release_checklist.json`
- `/data/automation_status.json`
- `/data/route_map.json`
- `/data/homepage_switch_plan.json`
- `/data/design_system_manifest.json`
- `/data/redesign_manifest.json`
- `/data/brand_identity.json`
- `/data/company_locations.json`
- `/data/gnk_dinamo_ltd_media_kit.json`
- `/data/ai_assistant_public_model.json`
- `/data/news.json`
- `/data/market.json`

## Operator routes

- `/operator/start/`
- `/operator/app/`
- `/operator/release-check/`
- `/operator/route-map/`
- `/operator/homepage-switch/`
- `/operator/frontend-health/`
- `/operator/api-check/`

## SEO routes

- `/sitemap.xml`
- `/sitemap-corporate.xml`
- `/robots.txt`

## Rule

Production homepage stays unchanged until the candidate, route map, homepage switch plan, release check and frontend health are stable.

## Rollback reference

Current production `index.html` SHA before switch:

`4804eb83923c7a42e1a0b4c8889d63113dc50b7a`
