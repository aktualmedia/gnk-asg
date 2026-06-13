# GNK ASG Homepage Switch Readiness

Date: 2026-06-13
Repository: aktualmedia/gnk-asg

## Production homepage reference

- File: `index.html`
- Current production SHA before switch: `4804eb83923c7a42e1a0b4c8889d63113dc50b7a`

## Candidate

- `/home-candidate/`

## Control layers now available

- `/operator/start/`
- `/operator/app/`
- `/operator/frontend-health/`
- `/operator/release-check/`
- `/operator/route-map/`
- `/operator/homepage-switch/`

## Data control files

- `/data/release_checklist.json`
- `/data/route_map.json`
- `/data/homepage_switch_plan.json`
- `/data/design_system_manifest.json`
- `/data/automation_status.json`

## Public design layers

- `/design-system/`
- `/en/design-system/`
- `/media-kit/`
- `/en/media-kit/`

## Rule

Do not replace `/` until the candidate, release check, route map, homepage switch plan and frontend health are stable.

## Rollback

If a future homepage replacement fails, restore `index.html` to SHA:

`4804eb83923c7a42e1a0b4c8889d63113dc50b7a`
