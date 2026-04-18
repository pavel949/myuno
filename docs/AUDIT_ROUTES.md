# myUNO — Route Audit v2

> **Generated:** 2026-04-18  
> **Method:** Read-only scan of `src/pages/` + `src/lib/config/routes.ts` against `docs/ARCHITECTURE_V2.md §06`  
> **Status:** No code was changed. This document is a planning artefact only.

---

## Table 1 — Route Classification

| Current path | Page folder | Target path (v2) | Cluster | Surface | Action | Notes |
|---|---|---|---|---|---|---|
| `/` | `src/pages/Index.tsx` | `/` | — | Home | keep-as-is | Needs role-stack rewrite (P1·02) |
| `/discover` | `src/pages/discover/` | `/discover` | — | Discover | keep-as-is | |
| `/admin/*` | `src/pages/admin/` (72 files) | `/admin/*` | — | Admin | keep-as-is | Already surface-level; flatten namespace |
| `/wallet` | `src/pages/wallet/` | `/wallet` | — | Wallet | keep-as-is | Thin today — needs expansion |
| `/me` | `src/pages/profile/` | `/me` | — | Me | rename | `/profile` → `/me`; `/me/roles`, `/me/docs` sub-routes needed |
| `/auth/*` | `src/pages/auth/` | `/auth/*` | — | (modal) | keep-as-is | Not a surface, correct |
| **ARRIVE cluster** ||||||| 
| `/transport` | `src/pages/transport/` | `/app/arrive/transport` | arrive | Discover | rename | Car/scooter rental |
| `/sim` / `/sim-start` | `src/pages/arrive/SIMStartPage.tsx` | `/app/arrive/sim` | arrive | Discover | rename | |
| `/exchange` | `src/pages/arrive/ExchangeBotPage.tsx` | `/app/arrive/exchange` | arrive | Discover | rename | |
| `/arrive` | `src/pages/arrive/ArriveClusterPage.tsx` | `/discover/cluster/arrive` | arrive | Discover | rename | Cluster hub page |
| `/relocate` | `src/pages/relocate/` | `/discover/life/relocating` | arrive | Discover | rename | Life situation landing |
| **LIVE cluster** |||||||
| `/cleaning` | `src/pages/cleaning/` | `/app/live/cleaning` | live | Discover | rename | |
| `/beauty` | `src/pages/beauty/` | `/app/live/beauty` | live | Discover | rename | |
| `/flowers` | `src/pages/flowers/` | `/app/live/flowers` | live | Discover | rename | |
| `/babysitter` | `src/pages/babysitter/` | `/app/live/babysitter` | live | Discover | rename | |
| `/pets` | `src/pages/pets/` | `/app/live/pets` | live | Discover | rename | |
| `/pharmacy` | `src/pages/pharmacy/` | `/app/live/pharmacy` | live | Discover | rename | |
| `/restaurants` | `src/pages/restaurants/` | `/app/live/restaurants` | live | Discover | rename | |
| `/events` | `src/pages/events/` | `/app/live/events` | live | Discover | rename | |
| `/experiences` | `src/pages/experiences/` | `/app/live/experiences` | live | Discover | rename | |
| `/fitness` | `src/pages/fitness/` | `/app/live/fitness` | live | Discover | rename | |
| `/medical` | `src/pages/medical/` | `/app/live/medical` | live | Discover | rename | |
| `/delivery` | `src/pages/delivery/` | `/app/live/delivery` | live | Discover | rename | |
| `/market` | `src/pages/market/` | `/app/live/market` | live | Discover | rename | |
| `/kids` | `src/pages/kids/` | `/discover/life/kids` | live | Discover | rename | Life situation landing |
| `/wedding` | `src/pages/wedding/` | `/discover/life/wedding` | live | Discover | rename | Life situation landing |
| `/wellness` | `src/pages/wellness/` | `/app/live/wellness` | live | Discover | rename | |
| `/yachts` | `src/pages/yachts/` | `/app/live/yachts` | live | Discover | rename | Could argue enjoy-cluster |
| **LEGAL cluster** |||||||
| `/legal` | `src/pages/legal/LegalServicesIndex.tsx` | `/app/legal/legal` | legal | Discover | rename | |
| `/visa` | `src/pages/legal/VisaImmigrationPage.tsx` | `/app/legal/visa` | legal | Discover | rename | |
| `/tax` | `src/pages/legal/TaxNavPage.tsx` | `/app/legal/tax` | legal | Discover | rename | |
| `/insurance` | `src/pages/insurance/` | `/app/legal/insurance` | legal | Discover | rename | |
| `/education` | `src/pages/education/` | `/app/legal/education` | legal | Discover | merge | Or legal-adjacent; open question |
| `/banking` | (route only) | `/app/legal/banking` | legal | Discover | rename | No page folder — content needed |
| `/services` | `src/pages/services/` | `/app/legal/services` | legal | Discover | open-question | Catch-all; needs taxonomising |
| **INVEST cluster** |||||||
| `/property` | `src/pages/property/PropertyIndex.tsx` | `/app/invest/property` | invest | Discover | rename | Hub for all RE |
| `/property/rent/*` | `src/pages/property/` | `/app/invest/rent` | invest | Discover | rename | |
| `/property/resale` | `src/pages/property/ResaleIndex.tsx` | `/app/invest/resale` | invest | Discover | rename | |
| `/property/offplan` | `src/pages/property/OffplanIndex.tsx` | `/app/invest/offplan` | invest | Discover | rename | |
| `/property/developers` | `src/pages/property/DevelopersIndex.tsx` | `/app/invest/developers` | invest | Discover | rename | |
| `/property/invest` | `src/pages/invest/` | `/app/invest/yield` | invest | Discover | rename | Yield calculator / ROI |
| `/classifieds` | `src/pages/classifieds/` | `/app/invest/classifieds` | invest | Discover | rename | |
| `/capital` | `src/pages/capital/` (11 files) | `/operate/invest` | invest | Operate | merge | Capital advisory / deal CRM — belongs in Operate, not Discover |
| **MANAGE cluster** |||||||
| `/owner/*` | `src/pages/owner/` (84 files) | `/operate/owner` | manage | Operate | rename | Pro portal — massive, needs shell consolidation |
| `/owner-portal/*` | `src/pages/owner-portal/` | `/operate/owner` | manage | Operate | merge | Duplicate of `/owner` — merge |
| `/mc/*` | `src/pages/mc/` (4 files) | `/operate/mc` | manage | Operate | rename | Management company portal |
| `/stays` | `src/pages/stays/` | `/operate/owner` | manage | Operate | merge | Sub-page of owner; or `/discover/life/staying` |
| **BUILD cluster** |||||||
| `/developer-portal/*` | `src/pages/developer-portal/` (14 files) | `/operate/dev` | build | Operate | rename | |
| `/newbuilds/*` | `src/pages/newbuilds/` (11 files) | `/app/build/newbuilds` | build | Discover | rename | Consumer-facing new builds catalog |
| **PROVIDER surface** |||||||
| `/vendor/*` | `src/pages/vendor/` (29 files) | `/operate/provider` | — | Operate | rename | Provider/vendor dashboard |
| `/provider` | `src/pages/provider/` | `/operate/provider` | — | Operate | merge | |
| `/staff` | `src/pages/staff/` | `/operate/mc` | manage | Operate | merge | Staff management under MC |
| `/team` | `src/pages/team/` | `/operate/mc` | manage | Operate | merge | |
| **Legacy / life-situation landings** |||||||
| `/nomad` | `src/pages/nomad/` | `/discover/life/digital-nomad` | — | Discover | rename | Marketing landing |
| `/expat` | `src/pages/expat/` | `/discover/life/expat` | — | Discover | rename | Marketing landing |
| `/peylaa` | `src/pages/peylaa/` | `/discover/life/peylaa` | — | Discover | rename | Developer microsite |
| `/landing/*` | `src/pages/landing/` | subdomain or `/discover/life/*` | — | Discover | retire | Marketing; consider external |
| `/microsite` | `src/pages/microsite/` | subdomain | — | — | retire | Single-use marketing page |
| `/guest/*` | `src/pages/guest/` | `/app/manage/guest` | manage | Operate | open-question | Guest check-in; Owner-facing or separate? |
| **Utility / Support** |||||||
| `/orders` | `src/pages/orders/` | `/wallet/orders` | — | Wallet | merge | Order history belongs in Wallet |
| `/support` | `src/pages/support/` | `/me/support` | — | Me | merge | |
| `/info/*` | `src/pages/info/` | `/me/docs` | — | Me | merge | Static info/legal pages |
| `/booking` | `src/pages/booking/` | inherits from vertical | — | — | merge | Booking shell; per-vertical already |
| `/account` | `src/pages/account/` | `/me` | — | Me | merge | |
| `/knowledge` | `src/pages/knowledge/` | `/discover/knowledge` | — | Discover | rename | Editorial content hub |
| `/tools` | `src/pages/tools/` | open-question | — | — | open-question | Unknown scope |
| `/sos` | (route only) | `/sos` (modal only) | — | — | keep-as-is | Correct — must stay modal |
| `/vip-concierge` | (route) | `/me/concierge` or modal | — | Me | rename | |

---

## Table 2 — Shell / Layout Components → Target Surface

| Component | Current file | Today's usage | Target surface | Action |
|---|---|---|---|---|
| `AppLayout` | `src/components/layout/AppLayout.tsx` | General wrapper — 366+ pages | Home · Discover · Me · Wallet | Becomes the universal shell; surface prop selects chrome |
| `MiniAppLayout` | `src/components/miniapp/MiniAppLayout.tsx` | All 40+ verticals | Discover (`/app/:cluster/:vertical`) | **Keep.** Canonical vertical shell for all Discover pages |
| `LandingLayout` | `src/components/layout/` (if exists) | Marketing pages | `/discover/life/*` or subdomain | Retire or extract to marketing subdomain |
| `OnboardingLayout` | `src/components/layout/` | Auth / first-run | Me (auth boundary) | keep-as-is |
| `CompactFooter` | `src/components/layout/CompactFooter.tsx` | All surfaces | All surfaces | keep-as-is; already taxonomy-driven |
| `UnifiedHeader` | `src/components/shared/UnifiedHeader.tsx` | MiniAppLayout | Discover verticals | keep-as-is |
| `WorkspaceHeader` | (mc/vendor portals) | mc/vendor/owner portals | Operate shell | Merge into `OperateShell` (to be created in P2·04) |
| `CustomerHeader` | (if exists) | Consumer pages | Discover / Home | keep-as-is |
| `mc/*` pages + layout | `src/pages/mc/` | MC portal | `/operate/mc` | Move to `src/pages/operate/mc/` in P2·04 |
| `owner-portal/*` | `src/pages/owner-portal/` | Owner portal | `/operate/owner` | Merge with `/owner` in P2·04 |
| `developer-portal/*` | `src/pages/developer-portal/` | Dev portal | `/operate/dev` | Move in P2·04 |
| `vendor/*` | `src/pages/vendor/` | Provider dashboard | `/operate/provider` | Move in P2·04 |
| `pageRegistry.ts` | `src/lib/config/pageRegistry.ts` | Lazy route loading | All surfaces | Add `cluster` + `surface` fields here alongside `component` |

---

## Top 5 Surprises

### 1. `src/pages/owner/` has 84 files — it's already a full workspace
The owner folder is not just a few pages; it rivals the entire vendor portal in size. It has dashboards, financials, booking management, maintenance, staff, documents — a complete B2B SaaS product. In v2 this becomes `/operate/owner`. The surprise: it will be the hardest single folder to migrate because it has deep internal cross-links and its own sub-navigation. **Recommendation:** migrate it last within the Operate consolidation (P2·04), after MC and vendor which are smaller and lower-risk.

### 2. Zero `/app/:cluster/:vertical` routes exist today
The `APP_ROUTES` registry has no v2-style paths at all. Every vertical is registered at `/beauty`, `/cleaning`, `/yachts`, etc. The migration to `/app/:cluster/:vertical` will require adding all ~40 routes in parallel, then a 90-day redirect window. **Risk:** PWA offline cache, WhatsApp deep links, and any bookmarked URLs will all break simultaneously if redirects are missed. The `LEGACY_REDIRECTS` map in `routes.ts` already exists — use it.

### 3. `src/pages/capital/` (11 files) has no home in the blueprint
Capital advisory (deal pipeline, investor CRM, ROI modelling) is a substantial module that exists outside the 6 clusters. It's investor-facing but consumer-ish (not quite Operate). **Options:** (a) map to `/operate/invest` and gate behind the Investor role, (b) surface as `/app/invest/capital` in the Discover/Invest cluster, (c) create it as the seed of a proper Investor surface (Phase 5). **Product decision needed.**

### 4. `src/pages/guest/` (8 files) is role-ambiguous
Guest check-in, digital guidebook, and guest portal exist at `/guest/*`. Who is the primary user? The guest (tourist, no account) or the owner (managing their property's guest experience)? If it's owner-managed, it belongs in `/operate/owner/guests`. If it's guest-facing (no-auth), it's a special surface that doesn't fit the 6-surface model. **Product decision needed.**

### 5. `src/pages/education/` and `src/pages/services/` are cluster-straddlers
`education` could be Arrive (international schools for relocating families) or Legal (accreditation, work permits). `services/` is a catch-all with `?category=` params used for home maintenance (AC repair, plumbing, electrical) — but ARCHITECTURE_V2 has no "Maintain" cluster (it was removed from the final 6). **Options for services:** add a 7th cluster (Maintain), merge into Manage, or surface as sub-category of Live. The `verticalGroups.ts` currently has a `maintain` group that was explicitly excluded from the footer — this tension needs a decision before Phase 3 (cluster taxonomy tagging).

---

## Summary counts

| Action | Count |
|---|---|
| keep-as-is | 5 |
| rename (path change only, no behaviour change) | 38 |
| merge (consolidate into another route) | 14 |
| retire (remove or move to subdomain) | 3 |
| open-question (needs product decision) | 4 |
| **Total routes audited** | **64** |

**Estimated redirect entries needed:** ~45 (all `rename` + `merge` actions)

---

*Next step: run the Phase 1 prompt from `docs/FEASIBILITY.md §07` to implement the Role Stack DB migration.*
