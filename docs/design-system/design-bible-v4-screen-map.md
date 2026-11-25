# Design Bible v4 — screen map against the repo

Source: Claude Design handoff bundle `myuno-design-bible` (HTML prototypes, `*.dc.html`).
Scope: every file except `myUNO Round 4A HQ & States.dc.html` (handled in a separate session).
Audit date: 2026-11-25. Status is based on reading the repo route tables
(`src/components/layout/AnimatedRoutes.tsx`, `src/components/layout/routes/*`, `src/lib/config/routes.ts`)
and the page source, not on rendering.

Legend

- **Status** — Implemented: a repo page covers the screen's job and structure. Partial: the page exists, parts of the
  prototype's structure/content are missing. Missing: no page does this job today.
- **Class** — SAFE: presentational/content/state work on an existing page, no new route, schema, money flow, auth change
  or shell. NEEDS DECISION: anything else (proposal given).
- **Applied** — commit on branch `worktree-agent-ae3dfed749c50c4d6` that implemented the SAFE part.

Cross-cutting decisions (apply to many rows below)

1. **Route naming.** The prototypes use `/rentals`, `/buy/...`, `/work/*`, `/hq`, `/checkout`, `/signin`, `/me/trips/*`,
   `/me/property/*`, `/owners`, `/providers`, `/help`, `/areas/*`. The repo uses `/property/rent`, `/property/offplan/:id`,
   `/mc/*`, `/admin/*`, `/cart`, `/auth`, `/trip/:id`, `/my-property/*`, `/for-owners`, `/for-local-services`, `/faq`, `/area/:slug`.
   Hard rule 1 forbids new top-level routes. **Proposal:** keep repo routes; if v4 names are wanted, add them only as
   `CanonicalPublicRedirect` aliases after a route-ownership decision.
2. **Management marks** ("by myUNO" / partner held to standard / listed) do not exist in code or schema.
   **Proposal:** add a `management_mark` enum on listings via migration + admin editing before any badge is shown.
3. **Platform fee "10%"** appears in several prototypes. PROJECT.md forbids inventing a universal marketplace commission.
   **Proposal:** show fees only from stored per-vertical configuration.
4. **Status tones / radii / fonts** — token layer is owned by the main session (tokens.css, tailwind config). Pages here
   use semantic classes only; radius utilities `rounded-sm|md|lg|full` were used so they pick up the 4/8/12px remap.

## myUNO System Index.dc.html

| Screen | Title | Design route | Repo route / file | Status | Gap | Class | Applied |
|---|---|---|---|---|---|---|---|
| index | System index (chrome, rules, file list) | — | n/a (reference) | n/a | Reference page; rules feed the rows below | — | — |

## myUNO Design Bible.dc.html

| Screen | Title | Design route | Repo route / file | Status | Gap | Class | Applied |
|---|---|---|---|---|---|---|---|
| strategy, audit | Business + palette/copy audit | — | `DESIGN.md`, `docs/canonical/05` | Partial | Token/colour/font migration | NEEDS DECISION — owned by main session (token layer) | — |
| sitemap, architecture | Public / Me / Work / HQ layers | — | route tables | Partial | v4 URL scheme differs (decision 1) | NEEDS DECISION | — |
| color, type, space, logo | Tokens | — | `src/styles/tokens.css` | Partial | Being remapped by main session | NEEDS DECISION — main session | — |
| buttons, forms, cards, chrome | Components + chrome | — | `src/components/ui/*`, headers | Partial | Bottom bar "Explore · Trips · Property · Saved · Me", market switcher | NEEDS DECISION — global nav is shared chrome | — |
| buying | Buyer tools (construction updates, payment plan, ClearView, ownership explainer) | — | offplan detail | Partial | See D5b/R1 | NEEDS DECISION | — |
| flows, templates | Six loops, T1–T4 templates | — | various | Partial | Per-screen rows below | — | — |
| voice | Rewrites + banned words | — | `docs/canonical/03-tone-of-voice.md` | Partial | Banned-word sweep (e.g. "Unlock" in `BecomePartnerCTA`, `OwnerSuperhost`, `JoinInvite`) | SAFE (copy) — not applied this pass | — |
| roadmap | Build order 0–5 | — | — | n/a | — | — | — |

## myUNO Desktop Screens.dc.html

| Screen | Title | Design route | Repo route / file | Status | Gap | Class | Applied |
|---|---|---|---|---|---|---|---|
| D1 | Home v2 | `/` | `/` → `HomeRouter` | Partial | One Stay/Buy search replacing pillars, nightly/monthly switch | NEEDS DECISION — home IA is governed by PROJECT.md (compact rental carousel rule) | — |
| D2 | Rentals · search + map | `/rentals` | `/property/rent`, `/property/map` | Implemented | Route name (decision 1); management-mark pins (decision 2) | NEEDS DECISION | — |
| D3 | Rental detail | `/rentals/villa-g7` | `/property/:id` (`PropertyDetail`) | Partial | Ownership bridge block; gold Reserve single action | NEEDS DECISION — bridge needs sales-lead wiring | — |
| D4 | Buy · list + compare | `/property` | `/property/buy`, `PropertyCompare` | Implemented | — | — | — |
| D5b | Off-plan project portal | `/property/layantara-residences` | `/property/offplan/:id` (`OffplanDetail`) | Partial | Dated construction updates, availability tab | NEEDS DECISION — needs construction-update data source | — |
| D5 | Unit page v1 (superseded by R1) | — | — | n/a | superseded | — | — |
| D6 | Workspace · Today | `/work/today` | `/mc/today` (`PmsTodayPage`) | Implemented | Route name | NEEDS DECISION (naming only) | — |
| D7 | Sales CRM · buyer leads | `/work/crm` | `/mc/sales`, `/mc/pipelines` | Implemented | — | — | — |
| D8 | HQ · Needs attention | `/hq` | `/admin` | Partial | Exception queue ranked by revenue at risk | NEEDS DECISION — HQ is Round 4A scope | — |

## myUNO Mobile Screens.dc.html

| Screen | Title | Design route | Repo route / file | Status | Gap | Class | Applied |
|---|---|---|---|---|---|---|---|
| M1 | Home | `/` | `/` | Partial | as D1 | NEEDS DECISION | — |
| M2 | Rentals · search | `/rentals` | `/property/rent` | Implemented | floating Map toggle exists via `/property/map` link | — | — |
| M3 | Rental detail | `/rentals/:id` | `/property/:id` | Partial | as D3 | NEEDS DECISION | — |
| M4 | Checkout | `/book/:id` | `/cart`, vertical booking pages | Partial | Sign-in at checkout (passkey → Google → email) | NEEDS DECISION — auth + money flow | — |
| M5 | Trip · pre-arrival | `/me/trips/:id` | `/trip/:id`, `/my-stay` | Partial | Readiness checklist, add-ons | NEEDS DECISION — add-on booking is a money flow | — |
| M6 | Property · list | `/property` | `/property/buy` | Implemented | — | — | — |
| M7 | Home detail | `/property/:project/:unit` | `/property/offplan/:id` | Partial | as R1 | NEEDS DECISION | — |
| M8 | Viewing request | — | `/property/:id/inquiry` (`PropertyInquiry`) | Partial | Capture language + reply channel on the lead | NEEDS DECISION — lead schema/routing (WhatsApp lead routing in flight) | — |

## myUNO Marketplaces.dc.html

| Screen | Title | Design route | Repo route / file | Status | Gap | Class | Applied |
|---|---|---|---|---|---|---|---|
| journeys | Journeys | — | n/a (reference) | n/a | — | — | — |
| map | Marketplace map | — | n/a (reference) | n/a | — | — | — |
| clearview | ClearView placement | — | `/property/clearview`, offplan cards | Partial | see K3 | — | — |
| MK3a | Rentals marketplace | `/rentals` | `/property/rent` | Implemented | Total-with-fees price and verified review count depend on tariff data | NEEDS DECISION (decision 1, 2) | — |
| MK3b | Buy property | `/property` | `/property/buy`, `/property/offplan`, `/property/resale` | Implemented | Resale "Documents checked" status | NEEDS DECISION — needs document-check data | — |
| MK5 | Yachts & charters | `/yachts` | `/yachts` (`YachtsIndex`) | Implemented | Route-inspiration block; "Request a quote" quote workflow | NEEDS DECISION — routes need data; quote is F2 | — |
| MK2 | Experiences | `/experiences` | `/experiences` (`ExperiencesIndex`) | Implemented | Portrait cards, trip-date availability | NEEDS DECISION — trip-date filter needs active-trip context | — |
| MK1 | Services | `/services` | `/services` (`ServicesIndex`) | Implemented | Provider response time on cards, stay-linked panel | NEEDS DECISION — response time not stored | — |
| MK4 | Knowledge hub | `/knowledge` | `/knowledge` (`KnowledgeHub.tsx`) | Partial → Implemented | Subtitle, four tracks, error state; removed decorative gradient | SAFE | `7065e1a` |

## myUNO Real Estate v2.dc.html

| Screen | Title | Design route | Repo route / file | Status | Gap | Class | Applied |
|---|---|---|---|---|---|---|---|
| R1 | Off-plan unit page v2 | `/property/:project/:unit` | `/property/offplan/:id` | Partial | Unit-level page with launch-price history and unit facts | NEEDS DECISION — no unit route; price history needs data | — |
| R2 | Resale home page | `/property/resale/:id` | `/property/resale/:id` (`ResaleDetail`) | Partial | Dated document check (quota, title, encumbrances) | NEEDS DECISION — schema for document checks | — |
| R3 | Online reservation | `/property/reserve/:unit` | `/property/deposit-success`, manual payment page | Missing | Four-step reservation | NEEDS DECISION — money flow | — |

## myUNO Dashboards & Calendar.dc.html

| Screen | Title | Design route | Repo route / file | Status | Gap | Class | Applied |
|---|---|---|---|---|---|---|---|
| naming | Naming | — | `routeMeta.ts` labels | Partial | "Saved" vs "Favorites", "Buy property" vs "Property" | NEEDS DECISION — product naming | — |
| menus | Mega-menus | — | public header | Partial | Six-marketplace header | NEEDS DECISION — shared chrome | — |
| sitemap | Full sitemap | — | route tables | Partial | decision 1 | NEEDS DECISION | — |
| U1 | User dashboard | `/me` | `/me` (`MeFeed.tsx`) | Partial | Added account areas strip (trips, requests, saved, documents). Next-trip / purchase hero cards still missing | SAFE (strip) / NEEDS DECISION (hero cards need a trip + purchase aggregate) | `95df3ab` |
| U2 | Preferences | `/me/preferences` | `/profile/settings`, `/profile/notifications` | Partial | Single preferences page (intent, language, messenger) | NEEDS DECISION — preference fields | — |
| A1 | Admin dashboard (HQ) | `/hq` | `/admin` | Partial | Grouped navy rail | NEEDS DECISION — Round 4A scope | — |
| C1 | Guest date picker | component | `PropertyCalendar`, booking cards | Partial | Nightly price on every date, min-stay hints | NEEDS DECISION — tariff per-date read path | — |
| C2 | Operations calendar | `/work/calendar` | `/mc/calendar` (`OwnerCalendar`) | Implemented | — | — | — |

## myUNO Round 1A Details.dc.html

| Screen | Title | Design route | Repo route / file | Status | Gap | Class | Applied |
|---|---|---|---|---|---|---|---|
| F1 | Yacht detail | `/yachts/:slug` | `/yachts/:id` (`YachtDetail`) | Partial | Included vs extras, suggested routes | NEEDS DECISION — needs structured inclusions data | — |
| F2 | Quote received → accept | `/me/orders/q-2291` | none | Missing | Quote with expiry; accept pays deposit | NEEDS DECISION — money flow | — |
| F3 | Experience detail | `/experiences/:slug` | `/experiences/:id` (`ExperienceDetail`) | Partial | Day strip from trip dates, seats left | NEEDS DECISION — availability data | — |
| F4 | Service detail + request | `/services/airport-pickup` | `/services/provider/:id`, `/services/order/:functionId` | Implemented | — | — | — |
| F5 | Buy property · map | `/property?view=map` | `/property/map` (`PropertyMap`) | Implemented | Square vs round pins by product type | NEEDS DECISION — shared map marker component | — |
| F6 | Developer profile | `/developers/:slug` | `/property/developers/:id` (`DeveloperDetail`) | Partial | Promised vs actual handover record, company checks | NEEDS DECISION — delivery-record data | — |
| F7 | Search everything | `/search?q=` | `/search` (`Search.tsx`) | Partial → Implemented | Results grouped by marketplace with counts and "See all in…" | SAFE | `acbe627` |

## myUNO Round 1B Account & Checkout.dc.html

| Screen | Title | Design route | Repo route / file | Status | Gap | Class | Applied |
|---|---|---|---|---|---|---|---|
| G1 | Trip basket | `/checkout` | `/cart` (`Cart`) | Partial | One basket per trip across marketplaces, payment schedule | NEEDS DECISION — money flow | — |
| G2 | Confirmation + receipt | `/checkout/done` | vertical success pages | Partial | Unified confirmation with audit marker | NEEDS DECISION — money flow | — |
| G3 | Cancel or change | `/me/trips/:id/cancel` | `/bookings/:id` | Partial | Per-item refund preview | NEEDS DECISION — money flow | — |
| G4 | Resale · make an offer | `/property/resale/:id/offer` | none | Missing | Offer form | NEEDS DECISION — new route + deal workflow | — |
| G5 | Sign in / welcome | `/signin` | `/auth` | Partial | Passkey first, 3 onboarding questions | NEEDS DECISION — auth change | — |
| G6 | Trip · in stay | `/me/trips/:id` | `/trip/:id`, `/my-stay` | Partial | Day-by-day itinerary across verticals | NEEDS DECISION — itinerary aggregate | — |
| G7 | Purchase journey | `/me/property/b-504` | none for buyers | Missing | Six-stage buyer journey | NEEDS DECISION — deal/payment data model | — |
| G8 | Owner statement | `/me/property/villa-g7` | `/my-property/statements` | Implemented | "10% platform fee" line | NEEDS DECISION (decision 3) | — |
| G9 | Saved items + alerts | `/me/saved` | `/favorites` (`Favorites.tsx`) | Partial → Implemented | Saved searches with alert channel above items | SAFE | `958c953` |

## myUNO Round 2 Workspaces.dc.html

| Screen | Title | Design route | Repo route / file | Status | Gap | Class | Applied |
|---|---|---|---|---|---|---|---|
| W1 | Reservations | `/work/reservations` | `/mc/bookings-list` | Implemented | Booking drawer | NEEDS DECISION — operate shell owned per role | — |
| W2 | Housekeeping (phone) | `/work/housekeeping` | `/mc/operations`, `/mc/team/shifts` | Partial | Phone checklist with photo proof | NEEDS DECISION — storage + task schema | — |
| W3 | Maintenance job board | `/work/maintenance` | `/mc/maintenance-plan`, `/mc/tasks` | Partial | Kanban by status | NEEDS DECISION | — |
| W4 | Provider orders | `/work/orders` | `/vendor/bookings`, `/vendor/orders` | Implemented | Quote lane | NEEDS DECISION (F2) | — |
| W5 | Partner onboarding | `/work/listings/:id` | `/mc/onboarding/wizard`, `/mc/properties/:id/setup` | Implemented | — | — | — |
| W6 | Pricing & channels | `/work/pricing` | `/mc/rates`, `/mc/channels` | Implemented | — (PROJECT.md defines `/mc/rates`) | — | — |
| W7 | Lead detail | `/work/crm/leads/:id` | `/mc/contacts/:id`, `/mc/sales/:id` | Implemented | — | — | — |
| W8 | Owner portfolio | `/me/property` | `/my-property` | Implemented | "Block dates" primary action | NEEDS DECISION — calendar write | — |

## myUNO Round 3 Content.dc.html

| Screen | Title | Design route | Repo route / file | Status | Gap | Class | Applied |
|---|---|---|---|---|---|---|---|
| K1 | Knowledge article | `/knowledge/:slug` | `/knowledge/:section/:slug` (`KnowledgeArticlePage.tsx`) | Partial → Implemented | Dated meta + reading time, contents, 680px reading column, side panel, error state | SAFE | `89edfef` |
| K2 | Area guide | `/areas/:slug` | `/area/:slug` (`AreaLandingPage`) | Partial | Six-fact strip, tabs, "who it suits" ratings | NEEDS DECISION — needs editorial data per area | — |
| K3 | ClearView method | `/knowledge/clearview` | `/property/clearview` (`ClearViewLanding.tsx`) | Partial | Weighted areas now read from `CLEARVIEW_CATEGORIES`; three-step flow added. Ten legal gates and grade bands not shown | SAFE (applied) / NEEDS DECISION (code has 5 grades AAA–BB, canon says AAA–CCC; no gate list in code) | `00371cb` |
| K4 | For owners | `/owners` | `/for-owners` (`ForOwners` → `AudienceLanding`) | Implemented | Commercial claims in prototype | NEEDS DECISION (decision 3) | — |
| K5 | For developers & partners | `/partners` | `/for-developers` | Implemented | — | — | — |
| K6 | For providers | `/providers` | `/for-local-services` | Implemented | — | — | — |
| K7 | About · how we verify | `/about` | `/about` (`AboutPage.tsx`) | Partial | Added "How we check what you see" (G-Trust, ClearView, legal docs); fixed contact link. Management marks and revenue model not shown | SAFE (applied) / NEEDS DECISION (decisions 2, 3) | `9dd6320` |
| K8 | Help centre | `/help` | `/faq` (`FAQPage.tsx`) | Partial → Implemented | Search first, category shortcuts with counts, no-match state | SAFE | `c255eae` |
| K9 | Legal page template | `/legal/terms` | `/terms`, `/privacy`, `/cookies`, `/refund-policy`, `/dispute-resolution`, `/ip-policy`, `/partner-agreement` | Partial | Shared document switcher + version/date/languages (`LegalDocumentNav`). Change log and plain-language summary not added | SAFE (applied) / NEEDS DECISION (summary is new legal copy; no change history data) | `d591858` |

## Sudara Landing.dc.html

| Screen | Title | Design route | Repo route / file | Status | Gap | Class | Applied |
|---|---|---|---|---|---|---|---|
| L1 | Campaign landing · desktop | `/p/:project` | `/p/:slug` (`ProjectMicrosite`), `/l/:slug` | Implemented | Sticky lead bar; no site nav | NEEDS DECISION — campaign shell vs hard rule 2 | — |
| L2 | Campaign landing · mobile | `/p/:project` | same | Implemented | same | NEEDS DECISION | — |

## Summary

Counts cover the ten screen files (72 rows; 3 are reference-only: Marketplaces `journeys`, `map`, Desktop `D5` superseded).

| Count | Before this pass | After this pass |
|---|---|---|
| Screens mapped | 69 | 69 |
| Implemented | 26 | 31 (F7, K1, K8, G9, MK4 completed) |
| Partial | 39 | 34 (U1, K3, K7, K9 improved but still partial) |
| Missing | 4 (R3, F2, G4, G7) | 4 |
| SAFE items applied | — | 9 commits (F7, K9, K8, K1, K7, K3, G9, MK4, U1) |
| Rows with a NEEDS DECISION item | — | 52 (several rows have both a SAFE part applied and a NEEDS DECISION remainder) |

Design Bible reference sections (strategy … roadmap) are listed separately and are mostly token/IA decisions owned by the main session.
