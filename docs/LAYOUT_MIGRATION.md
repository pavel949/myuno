# Layout migration — two shells (`AppLayout` + `FeatureLayout`)

This document is the **authoritative inventory** for Phase 2: collapsing legacy layout wrappers into:

| Shell | Role |
|--------|------|
| **`AppLayout`** | Global nav chrome (`NavShell`), consumer vs workspace options, optional ecosystem page container, footer / PWA surfaces. |
| **`FeatureLayout`** | Mode-driven **feature** framing on top of consumer `AppLayout`: `miniapp` (catalogs), `landing` (promo gradients). |

`OnboardingLayout` remains a **standalone** full-screen flow (progress header); it is related conceptually but not merged into `FeatureLayout` to avoid coupling auth/onboarding routing.

---

## Migration matrix (old → new)

| Legacy file | Target | Notes |
|-------------|--------|--------|
| `MiniAppLayout.tsx` | `FeatureLayout` `mode="miniapp"` | Thin re-export; all catalog verticals unchanged at import sites. |
| `LandingLayout.tsx` | `FeatureLayout` `mode="landing"` | Thin re-export. |
| `MCLayout.tsx` | `AppLayout` `variant="workspace"` `navRole="owner"` | Full-bleed content; no consumer banners. |
| `AdminLayout.tsx` | `AppLayout` workspace + admin palette/shortcuts | Same as above + `navRole="admin"`. |
| `VendorLayout.tsx` | `AppLayout` workspace `navRole="vendor"` | |
| `GuestLayout.tsx` | `AppLayout` workspace `navRole="guest"` | |
| `TeamLayout.tsx` | `AppLayout` workspace `navRole="team"` + `TeamSidebar` | Team still uses custom sidebar (not global `SideRail`). |
| `MeShellLayout.tsx` | `AppLayout` consumer (default) | Optional `usePageContainer` if a page needs full bleed. |
| `CapitalLayout.tsx` | **Deferred** | Bespoke `SidebarProvider` + `CapitalSidebar` / `CapitalHeader` / `CapitalMobileNav`. |
| `StaffLayout.tsx` | **Deferred** | Bespoke staff sidebar + header + shortcuts. |
| `DeveloperPortalLayout.tsx` | **Deferred** | `NewbuildsLayout` + developer auth gate + themed nav. |

---

## `AppLayout` API (workspace)

- `variant="workspace"` — skips consumer-only surfaces (email verification strip, install banners/sheets, floating install) and respects `showFooter` on **all** breakpoints.
- `navRole` — passed to `NavShell` as a **fixed** role (replaces inferring from auth + URL for that route tree).
- `usePageContainer={false}` — **no** outer `ECOSYSTEM_PAGE_CONTAINER` wrapper (dashboards / team shell need full width).

Consumer `AppLayout` behavior is unchanged by default (`variant="consumer"`).

---

## Route wrappers (`AnimatedRoutes.tsx`)

These layouts are applied at the router level:

- `/mc` → `MCLayout` (now `AppLayout` workspace owner)
- `/admin/*` (via `AdminRouteLayout`) → `AdminLayout`
- `/vendor/*` → `VendorRouteLayout` / `VendorLayout`
- `/guest/*` → `GuestRouteLayout` / `GuestLayout`
- `/staff/*` → `StaffLayout` (deferred bespoke shell)
- `/capital/*` → `CapitalLayout` (deferred)
- `/developer-portal/*` → `DeveloperPortalLayout` (lazy, deferred)

---

## Page-level consumers (grep-based inventory)

### `FeatureLayout` / `MiniAppLayout` / `LandingLayout`

**`MiniAppLayout` (catalog / vertical):**  
`Discover`, `MarketIndex`, `DeliveryIndex`, `RestaurantsIndex`, `FlowersIndex`, `ExperiencesIndex`, `FitnessIndex`, `BeautySpaIndex`, `MedicalIndex`, `PharmacyIndex`, `PetsIndex`, `YachtsIndex`, `EventsIndex`, `EducationIndex`, `CleaningIndex`, `ClassifiedsIndex`, `InsuranceIndex`, plus invest hub: `InvestmentHubLanding`, `InvestmentIndex`, `InvestInThailand`, `InvestmentPitch`, `InvestmentArticleDetail`, `InvestmentArticles`, `InvestmentBusinessZone`, `InvestmentKnowledgeZone`, `InvestmentServicesZone`, `InvestmentHubShell`, `RaiseFunding`, `CapitalDealIntake`, `InvestorDashboard`, `InvestmentBusinessDetail`, `ExperienceDetail`, `ExperienceBooking`, etc.

**`LandingLayout`:**  
`RelocateLandingPage`, `WeddingLandingPage`, `KidsLandingPage` (and any other pages importing `@/components/miniapp/LandingLayout`).

### Direct `AppLayout`

Many consumer and mixed pages import `AppLayout` directly (profile, cart, property, market, transport, legal, team-guest pages, `NavigatorPage`, `WelcomeLanding`-related flows, etc.). See repository search for `@/components/layout/AppLayout`.

### `TeamLayout`

`TeamDashboard`, `TeamModerationPage`, `TeamLeadsPage`, `TeamChatPage`, etc.

### `OnboardingLayout`

`VendorOnboarding`, `MCOnboarding` (and similar multi-step flows).

---

## Verification gates (evidence)

| Gate | Command / note |
|------|----------------|
| Typecheck | `npx tsc --noEmit` — **pass** (CI: run on each PR). |
| Production build | `npm run build` — **pass** (Vite 5.4). |
| Bundle ( representative ) | Main app chunk: `App-*.js` **~1,347 kB** raw / **~370 kB gzip** in a recent build — above the plan’s **500KB** target; this is a **pre-existing** app size issue (large route graph + vendors). Use code-splitting / manual chunks in a follow-up; layout refactor did not add a new large entry. |
| E2E | `npx playwright test` (see `playwright.config.ts` / `playwright.ci.config.ts`) — run in CI. |
| Visual | Playwright screenshots for critical paths (desktop / tablet / mobile) per vertical PR. |

---

## Changelog (Phase 2 implementation)

- Added `src/components/layout/FeatureLayout.tsx` (miniapp + landing modes).
- Extended `AppLayout` with `variant`, `navRole`, `usePageContainer`.
- Migrated workspace shells (MC, Admin, Vendor, Guest, Team) to `AppLayout`.
- Preserved **`MiniAppLayout` / `LandingLayout` file names** as compatibility re-exports.

Future work: fold `CapitalLayout`, `StaffLayout`, and `DeveloperPortalLayout` behind `AppLayout` extension slots once product confirms chrome parity.

### Legacy shell files (post-migration)

`MCLayout`, `AdminLayout`, `VendorLayout`, `GuestLayout`, and `MiniAppLayout` / `LandingLayout` **filenames are kept** as thin adapters (stable import paths, smaller PRs). Duplicate **`NavShell`-only** implementations were removed in favor of **`AppLayout`**.
