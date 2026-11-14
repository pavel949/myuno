# Legacy pages → unified experience audit

**Date:** 2026-11-14
**Repository:** `myUNO`
**Scope:** pages that bypassed the shared consumer chrome or used local header/search geometry.

## Executive result

The legacy audit found two different groups:

1. **True legacy public surfaces** — standalone catalogs, calculators and guided tools that disabled the shared header and recreated their own sticky header/search controls.
2. **Intentional media/detail surfaces** — pages with image-first detail experiences, booking flows, authentication, onboarding or workspace-specific chrome. These should not be mechanically flattened into a catalog header because their hero media and task-specific actions are part of the experience contract.

The first group has been migrated in this change. The second group remains explicitly scoped for a future media-shell pass.

## Migrated in this change

| Page | Before | After |
|---|---|---|
| `src/pages/education/SchoolFinderPage.tsx` | Disabled `AppLayout` header and rendered a local sticky title/back/icon bar. | Uses `AppLayout` consumer chrome plus `UnifiedHeader` with count, back navigation and canonical spacing. |
| `src/pages/tools/CostOfLivingPage.tsx` | Disabled shared header and rendered a local calculator header. | Uses `AppLayout` consumer chrome plus `UnifiedHeader` with location subtitle and canonical back behavior. |
| `src/pages/market/MarketCatalogPage.tsx` | Recreated title row, preferences, category menu and search input locally. | Uses `UnifiedHeader` for title, count, back, search, preferences and category drawer actions. Local search markup and duplicate icon geometry removed. |
| `src/pages/legal/VisaQuizPage.tsx` | Disabled shared header for the entire guided quiz. | Uses shared consumer chrome and `UnifiedHeader`; the quiz content remains task-specific. |

## Already on shared primitives

The following broad catalog families already use `MiniAppLayout`, which delegates to `FeatureLayout`, `AppLayout` and `UnifiedHeader`:

- education, transport, fitness, medical, events;
- experiences, cleaning, flowers, beauty, pets and babysitting;
- restaurants, delivery, yachts and Thai services;
- classifieds, marketplace and several investment/knowledge surfaces.

These were not rewritten because the migration was already present. The audit confirms they inherit the unified search, back navigation, filter ribbon and bottom navigation contracts.

## Remaining legacy candidates

The remaining `showHeader={false}` pages fall into these categories:

### Media/detail pages

Examples include `ClinicDetail`, `EventDetail`, `GymDetail`, `SalonDetail`, `TutorDetail`, `CourseDetail` and property/management-company profiles. They use an image-first hero with overlay actions and a task-specific booking or inquiry CTA. Recommended next step: create a `MediaDetailShell` primitive that composes:

- shared consumer header on scroll or as a compact top layer;
- a consistent 44px back/share/favorite action group;
- hero media, gallery controls and safe-area handling;
- sticky mobile primary CTA above `--bottom-nav-h`.

### Auth, onboarding and high-attention flows

Examples include `SetupPassword`, onboarding pages, partner status and SOS. These intentionally minimize chrome or use a focused action layout. They should be reviewed against an `AuthShell`/`FocusedTaskShell` contract rather than forced into the full consumer header.

### Marketing and landing pages

Examples include `ForLocalServices`, `ForManagementCompanies`, `BecomePartnerPage`, `ReferralLanding` and official-news pages. These should use the landing variant of `FeatureLayout` or a dedicated `MarketingShell`, preserving their conversion hierarchy while adopting shared buttons, typography, spacing, footer and reduced-motion rules.

## Structural recommendations

1. Keep `FeatureLayout` as the only entry point for list/catalog surfaces.
2. Add `MediaDetailShell` for image-first details instead of adding more local sticky headers.
3. Add `FocusedTaskShell` for auth, onboarding and emergency flows.
4. Add a route-level lint rule that flags new `showHeader={false}` usage unless the page imports one of the approved shell primitives.
5. Prefer `UnifiedHeader` for page title, back, search and contextual actions; do not recreate those controls in page files.
6. Keep global currency, language, location and date controls in shared chrome; domain modules should consume the contexts, not render duplicate preference controls.

## Verification

- `npm run typecheck -- --pretty false` — passed.
- `npm run design:check` — passed with `0 new/structural` findings.
- Focused shared-header/navigation and migrated-page tests — **17/17 passed**.
- ESLint on all four migrated pages — passed.
- `npm run build` — passed.
- `git diff --check` — passed.
