# GNK ASG Corporate Portal - Functionality Guide

Version: 2026-06-13 v1
Owner: GNK ASG d.o.o.
Group context: GNK DINAMO Ltd. / GNK ASG corporate portal

## 1. Portal purpose

The redesigned portal is a corporate operating layer, not only a public website. Its purpose is to present GNK ASG d.o.o., GNK DINAMO Ltd., group locations, documents, market data, business news, media kit, contact channels, AI assistant and operator dashboard in one coherent, fast and professionally structured system.

## 2. Main public areas

### `/front/`
Corporate preview front. It is the controlled preview layer for the future homepage. It uses the new GNK ASG visual identity and links to market, news, downloads, media kit, locations and admin/operator areas.

### `/media-kit/`
GNK ASG brand media kit. Contains the new logo system, color palette, brand tokens and corporate design direction.

### `/gnk-dinamo-ltd-media-kit/`
GNK DINAMO Ltd. media kit. Presents the Colorado, USA corporate layer and its role in the group presentation.

### `/locations/`
Global group locations. Lists headquarters, existing locations and planned positions from the globe/network data.

### `/downloads/`
Structured download hub for media kits, logo assets, brand tokens and location data. Future documents, PDFs, financial and legal materials should be routed here rather than placed as oversized homepage blocks.

### `/news/`
Planned public news layer. The main homepage should show only a compact news preview, while the full news presentation is moved to `/news/` and `news.gnk-asg.hr`.

### `/market/`
Digital Exchange Monitor and market information layer. It should remain snapshot-first, with clear data status labels.

## 3. Data sources

### `/data/redesign_manifest.json`
Single redesign control file. It lists identity, corporate layers, locations, frontend architecture, backend architecture, performance rules and protected existing functions.

### `/data/brand_identity.json`
Brand source for GNK ASG: name, meaning, colors, typography, logo files and design rules.

### `/data/company_locations.json`
Structured source for all cities and countries from the global network layer.

### `/data/gnk_dinamo_ltd_media_kit.json`
Structured media kit source for GNK DINAMO Ltd., Colorado, USA.

### `/data/ai_assistant_public_model.json`
Assistant model source. Defines IT - Osobni digitalni asistent, routine public-answering goal, knowledge sources and dashboard modules.

### `/data/status.json`
Public status source for portal modules.

### `/data/news.json`
Public news feed snapshot.

### `/data/market.json`
Market and digital asset snapshot.

## 4. Backend and operator areas

### `/operator/app/`
Main operator app. It is the administrative control surface for portal operations.

### `/operator/frontend-health/`
Read-only diagnostic page for frontend modules, JSON feeds and protected API responses.

### `/operator/api-check/`
API status and endpoint check layer.

### `/backend/`
Backend gateway and operational documentation layer.

### `/status-lite/`
Light public/operator status view.

## 5. AI assistant model

The assistant is named `IT - Osobni digitalni asistent`.

Target role:
- answer routine public questions from approved portal data;
- explain GNK ASG, GNK DINAMO Ltd., locations, media kit, downloads, news and market structure;
- prepare generic drafts and summaries;
- support the operator dashboard with status visibility.

Target autonomy:
- approximately 90 percent of ordinary public inquiries after the knowledge base is complete and tested;
- no independent execution of business-critical actions without the operator approval model.

## 6. Mailing and communication model

The mailing model is draft-first. The assistant may prepare routine drafts and classify messages, while non-routine outgoing messages remain under owner/operator review.

Public contact channels:
- contact form;
- WhatsApp link;
- public assistant badge;
- future routed mailbox layer.

## 7. Performance rules

- Render the logo, corporate summary and key links without external APIs.
- Use JSON snapshots before live API attempts.
- Keep long news grids outside the homepage.
- Lazy-load globe, map, assistant and visual effects.
- Use SVG logos and CSS tokens rather than heavy raster assets.
- Put PDFs, media kit and documents into hubs.

## 8. Protected functions

The following functions must not be lost during redesign:

- Business News refresh at 09:00 and 16:00 Europe/Zagreb;
- Digital Exchange Monitor with EUR and clear LIVE/SNAPSHOT/DELAYED/FALLBACK status labels;
- Bitcoin, gold, Brent and USD/EUR informational modules;
- contact form and WhatsApp communication;
- assistant badge and public assistant;
- Admin App, API Check, Frontend Health and backend operator routes;
- legal, finance, registry and document pages;
- GNK ASG, GNK DINAMO Ltd. and Nermin Sefić corporate SEO structure.

## 9. Visual direction

The design should combine:

- enterprise design-system discipline;
- premium dark navy and gold identity;
- fast first render;
- smaller cards and cleaner hierarchy;
- strong corporate confidence;
- modern but readable visual effects;
- no unnecessary load on the homepage.

## 10. Testing checklist

Before replacing production homepage:

1. `/front/` loads without missing assets.
2. `/media-kit/` opens and logo files load.
3. `/downloads/` links to media kit, GNK DINAMO Ltd. media kit, locations and brand files.
4. `/locations/` lists the global network locations.
5. `/gnk-dinamo-ltd-media-kit/` opens and links to JSON sources.
6. `/data/redesign_manifest.json` parses.
7. `/data/company_locations.json` parses.
8. `/data/ai_assistant_public_model.json` parses.
9. `/news/` exists before moving news prominence out of homepage.
10. `/operator/frontend-health/` confirms active modules.
11. Service worker cache has a new version after major frontend changes.
12. Sitemap includes new public pages.

## 11. Delivery rule

Production homepage `/` remains unchanged until preview is stable. The redesign proceeds through `/front/`, `/downloads/`, `/locations/`, `/media-kit/` and `/gnk-dinamo-ltd-media-kit/`, then migrates into the main homepage only after validation.
