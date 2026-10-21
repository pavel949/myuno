---
name: communities
description: Communities & Consulates directory at /communities (embassies, temples, churches, mosques, expat clubs). Public read via RLS, admin write. Seeded from Wikipedia (84 BKK embassies + 4 Phuket consulates) and curated Phuket religion/club picks. Trilingual EN/RU/TH.
type: feature
---
Module: **Communities & Consulates** — LIVE cluster directory.

DB:
- `public.communities` (107 rows seeded) — enum `community_kind` (religion|club|consulate|meetup), enum `religion_branch`.
- RLS: public read (`is_active=true`), admin-only writes via `has_role(auth.uid(),'admin')`.
- Linked to `life_situations.community` + `categories.communities` (cluster=live).

Hooks: `useCommunities(filters)`, `useCommunityBySlug(slug)` in `src/hooks/useCommunities.ts`.

Routes (in `APP_ROUTES`): `COMMUNITIES = '/communities'`, `COMMUNITY_DETAIL = '/communities/:slug'`.

Pages: `src/pages/communities/CommunitiesIndex.tsx`, `CommunityDetail.tsx`.

Localization: rendered via `pickLocalized(record, lang, 'name')` (`src/lib/i18n/pickLocalized.ts`) — th→en→ru fallback chain. Country flags via `src/lib/utils/countryFlag.ts`.

Seed script: `scripts/ingest/seed-communities.mjs` (idempotent UPSERT by slug; uses `/tmp/country_names.json` + `/tmp/embassy_phrases.json` produced via Lovable AI gateway).

Entry point: tile in `WelcomeLanding.tsx` (section 3.5, after audiences block).

Not in MVP: addresses/lat/lng for embassies (use Google Maps deeplink with name search), schedule data, vendor self-onboarding for community owners.
