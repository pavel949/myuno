# Public catalogue and request visual normalization

Status: source changes verified; after-change deployed screenshots pending. This is 11 distinct templates, not 11 visually passed deployments. Mobile/desktop and multiple project records are not counted separately. No catalogue facts, prices, availability, photos, consent or submission handlers were changed.

Before evidence was captured through Firecrawl against https://www.myuno.app on 2026-10-19. Existing property evidence was reused. Evidence files below are local QA artifacts held with the integration task; they are not public links.

| # | Public URL | Before screenshot | Presentation change |
|---|---|---|---|
| 1 | /services (also /discover/services) | myuno-visual-services.png | Shorter service icon panels, compact wrapped terms, consistent type/section rhythm |
| 2 | /transport | myuno-visual-transport.png | Ivory search hero and card, navy text, no dark gradient or decorative pattern |
| 3 | /experiences | myuno-visual-experiences.png | One readable card per row below 420px; balanced 2/3-column layout and card spacing |
| 4 | /market | myuno-market-desktop-top.png; myuno-market-mobile.png | Existing unavailable state styled as a bounded neutral panel; request alternatives preserved |
| 5 | /property/offplan | ux-public-1528/offplan-desktop.png | Neutral intro, shared heading scale, consistent project grid spacing |
| 6 | /property/offplan/78fbe5f4-258e-48b7-863b-2f3ff7d6e346 | ux-public-1528/avadina-mobile.png | Shared title and section rhythm; existing actual gallery and published-only report preserved |
| 7 | /property/developers | myuno-visual-property-developers.png | Neutral intro and responsive action; genuine empty state retained |
| 8 | /property/search?mode=rent | ux-public-1528/search-mobile.png; search-desktop.png | Compact mobile type/area pair, consistent search section spacing; filtering untouched |
| 9 | /property/24f7d4f7-f6b5-4c26-908b-b67b825a7c16?mode=rent | ux-public-1528/unit-mobile.png; unit-desktop-top.png | Shared responsive title and content rhythm; genuine property photos preserved |
| 10 | /services/order/ac_cleaning | myuno-visual-service-request.png | Bounded desktop form, normal-flow heading, neutral summary card, minimum field height |
| 11 | /property/24f7d4f7-f6b5-4c26-908b-b67b825a7c16/inquiry | ux-public-1528/inquiry-mobile.png | Same form width, normal-flow heading and field rhythm |

These are linked public surfaces: catalogue navigation exposes services/transport/experiences/market/offplan/developers; service cards link request routes; property results link the actual unit and its inquiry. Developer/provider detail has no verified reachable public record in this audit and is excluded, not counted as passed.

## Verification

- Five focused Vitest files: 66 tests passed, covering all 11 visual opt-ins, theme/scope contracts, actual search wrappers, service navigation, market gate, property detail intent, published-only reports.
- ESLint on the 12 changed TSX files: zero errors, 16 existing warnings. No full build/typecheck/local browser used.
- git diff --check passed.
- Scoped stylesheet is imported only by owned surfaces; no global theme, shared header or authorization changes. Uses existing language-specific font tokens. No new language copy or invented photos.
- Availability follow-up 4dd48a7c3813e903a55dda9e17f6f68b0c0d428a is separate; this change touches only PropertySearchPage root class/import.

## Remaining gates and audit gaps

- Preview/deployed screenshots at desktop/mobile and RU/EN/TH are still required before claiming visual acceptance. Source tests cannot prove rendered spacing.
- Fresh service-request screenshot shows existing “within 30 minutes” promise and catalogue price/duration; these were not edited in this visual-only tranche. Review the promise separately against actual request workflow.
- Transport still has existing catalogue imagery/data; this patch introduces no stock vehicle image or availability claim.
- Empty developers listing is a verified empty state, not a populated-directory validation.

## Explicit copy correction after the visual tranche

A separate follow-up replaces the unconditional 30-minute contact promise in ServiceFunctionOrder and ServiceOrderSuccess. Both now say that price, time and provider require confirmation after submission, in RU/EN/TH. This is an intentional factual copy correction, not part of the preserved-text styling claim above. No ETA, SLA or legal policy is introduced; submit handlers remain unchanged. Verification: 6 exact-copy/source-wiring tests plus 16 service-route tests passed; scoped ESLint and diff check passed. The remaining catalogue pricing/duration audit gap is unchanged.
