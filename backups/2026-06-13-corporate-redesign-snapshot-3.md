# GNK ASG Corporate Redesign Snapshot 3

Date: 2026-06-13
Timezone: Europe/Zagreb
Repository: aktualmedia/gnk-asg
Latest recorded commit after this stage: 35b356148e3f6a4de8ff55cbcdc9bb4f46f4e0db

## Completed after snapshot 2

- sitemap.xml updated with new public corporate pages
- `/news/` redesigned with GNK ASG corporate identity
- `/data/status.json` updated with front, news, media kit, GNK DINAMO Ltd. media kit, downloads, locations and documentation entries
- `/operator/app/` updated into Corporate Operator Center
- service worker cache bumped to `gnk-asg-20260613-corporate-redesign-03`

## Current safe state

Production homepage `/` remains protected. The active redesign is routed through preview and modular pages:

- `/front/`
- `/news/`
- `/media-kit/`
- `/gnk-dinamo-ltd-media-kit/`
- `/downloads/`
- `/locations/`
- `/documentation/`
- `/operator/app/`

## Next checks

- fetch key files and confirm they exist on main
- confirm sitemap contains new public pages
- confirm status JSON contains redesign links
- extend frontend health checks if needed
- prepare final homepage candidate only after preview checks
