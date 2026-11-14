# Platform Cleanup 03 — Legacy and dead-code cleanup

**Track:** `legacy`
**Scope:** `src/pages`, `src/components`, `scripts`, imports
**Date:** 2026-11-14
**Repository:** `/home/ubuntu/myuno-audit`

## Executive summary

The scoped audit used `PROJECT.md`, route registration in `src/components/layout/AnimatedRoutes.tsx` and `src/components/layout/pageRegistry.ts`, repository-wide import/reference searches, ESLint diagnostics, and Knip. The worktree already contained unrelated modifications before this audit; those files were preserved and not edited.

Seven components were verified as unreachable from application code and were removed. The removals are limited to standalone visual components with no production imports, or to the former Peylaa campaign component set after `PeylaaLanding` was reduced to an immediate canonical redirect. No route-backed page, legacy redirect, CI/package script, or test fixture was removed.

## Findings and fixes

### 1. Unreferenced accessibility component — fixed

- **Finding:** `src/components/a11y/SkipToContent.tsx:1-18` defined `SkipToContent`, but no source or script imported or rendered it. The repository-wide reference search returned no non-self references.
- **Fix:** Deleted `src/components/a11y/SkipToContent.tsx`.
- **Verification:** Post-change search for `SkipToContent` across `src` and `scripts` returned no matches.

### 2. Unreferenced onboarding hint — fixed

- **Finding:** `src/components/hints/NextStepNudge.tsx:1-56` defined `NextStepNudge`, but had no production import or render site.
- **Fix:** Deleted `src/components/hints/NextStepNudge.tsx`.
- **Verification:** Post-change search for `NextStepNudge` across `src` and `scripts` returned no matches.

### 3. Unreferenced referral visual — fixed

- **Finding:** `src/components/referral/OwnerReferralCard.tsx:1-75` defined `OwnerReferralCard`, but had no production import or render site.
- **Fix:** Deleted `src/components/referral/OwnerReferralCard.tsx`.
- **Verification:** Post-change search for `OwnerReferralCard` across `src` and `scripts` returned no matches.

### 4. Unreferenced trip-planner hero — fixed

- **Finding:** `src/components/trip-planner/TripPositioningHero.tsx:1-31` defined `TripPositioningHero`, but had no production import or render site.
- **Fix:** Deleted `src/components/trip-planner/TripPositioningHero.tsx`.
- **Verification:** Post-change search for `TripPositioningHero` across `src` and `scripts` returned no matches.

### 5. Obsolete Peylaa child component set — fixed

- **Finding:** `src/pages/peylaa/PeylaaLanding.tsx:5-9` now immediately redirects to the canonical off-plan detail route. The former campaign-only children had no imports or render sites:
  - `src/pages/peylaa/components/PeylaaLeadForm.tsx:1-57`
  - `src/pages/peylaa/components/PeylaaROICalculator.tsx:1-44`
  - `src/pages/peylaa/components/PeylaaUnitCatalog.tsx:1-105`
- **Fix:** Deleted the three unreachable Peylaa child components. The canonical route and redirect remain unchanged.
- **Verification:** Post-change search for `PeylaaLeadForm`, `PeylaaROICalculator`, and `PeylaaUnitCatalog` across `src` and `scripts` returned no matches. `PeylaaLanding` remains registered and route-backed, so this cleanup did not remove the compatibility route.

## Reviewed but retained

- **`src/pages/IndexV2.tsx`** is not dead: `src/pages/Index.tsx:168` conditionally renders it for the admin/home feature flag path.
- **`src/pages/WelcomeLanding.tsx`** is not dead: `src/pages/EcosystemPage.tsx:8-16` renders it, and `/ecosystem` remains mounted.
- **`src/pages/landings/legacy/*`** are retained because `src/components/layout/pageRegistry.ts` registers them and `AnimatedRoutes.tsx` provides their route surface.
- **`src/components/routing/NewbuildLegacyRedirects.tsx`** is retained because `AnimatedRoutes.tsx` imports its redirects; these are compatibility routes, not dead pages.
- **Scripts such as `scripts/audit-baseline.mjs`, `scripts/audit-routes-classify.mjs`, `scripts/architecture-scan.mjs`, `scripts/design-system-audit.mjs`, and `scripts/i18n-audit.mjs` were retained.** They are referenced by package scripts, CI workflows, tests, or documented operational checks. No scoped script met the evidence threshold for deletion.

## Remaining Knip candidates / risks

A post-change Knip run still reports these file-level candidates. They were deliberately not removed because deletion would require a separate ownership decision or would invalidate existing test mocks/coverage assumptions:

- `src/components/maintenance/LaunchSwitch.tsx` — no production use, but `src/components/admin/__tests__/AdminTools.access.test.tsx` explicitly mocks it to assert retired launch control does not mount. Consider removing the retired-control test and module together in a dedicated maintenance track.
- `src/components/newbuilds/KycLiteForm.tsx`, `src/components/newbuilds/ProjectDealsTab.tsx`, `src/components/newbuilds/ProjectMarketingTab.tsx`, `src/components/newbuilds/ProjectROICalculator.tsx`, and `src/components/newbuilds/PublicFloorPlan.tsx` — current application imports are absent, but the deep-tab test suite mocks several of these modules and the files form a feature cluster. Confirm the intended newbuild product boundary before deleting or reconnecting them.
- `src/components/pwa/InstallBanner.tsx` and `src/components/pwa/MobileInstallSheet.tsx` — no production imports were found, but `src/components/layout/__tests__/AppLayout.composition.test.tsx` mocks both. They may be intentionally reserved PWA surfaces; remove only with the corresponding composition-test contract.
- `src/components/newbuilds/tabs/NbInventoryTab.tsx`, `NbReportsTab.tsx`, `NbTermsTab.tsx`, and `NbUpdatesTab.tsx` — referenced by test mocks but not found in production imports. These need a newbuild tab ownership decision.
- `src/components/owner/team/MemberActivitySheet.tsx` and `MemberPermissionsSheet.tsx` — Knip reports them as unreferenced, while `src/pages/owner/__tests__/StaffPage.assignmentAvailability.test.tsx` references their names. Review whether the Staff page test mocks represent an intentionally retired UI or a missing integration.
- `src/components/admin/dashboard/index.ts` and `src/components/vendor/dashboard/index.ts` — barrel files are reported as unused; they may be compatibility entry points. Remove only after checking external import conventions and generated tooling.

These are risks/findings, not claimed fixes.

## Checks run

- `npx knip --include files,exports,nsExports,types --reporter json` before and after cleanup. The initial candidate list contained the seven removed components; the post-change report no longer contains them.
- `npx eslint src/pages src/components scripts --format json` — no `@typescript-eslint/no-unused-vars`, `no-unused-vars`, or `import/no-unused-modules` diagnostics were emitted in the filtered output.
- `npx vitest run src/test/navigation/mountedRouteOwnership.test.ts src/test/navigation/routeLayout.regression.test.tsx src/components/layout/__tests__/AppLayout.composition.test.tsx src/components/newbuilds/__tests__/NewbuildProjectDeepTabs.locale.test.tsx` — **4 test files passed, 26 tests passed**.
- A repository `npm run typecheck` was started but did not complete within the 300-second command window. No passing typecheck result is claimed; rerun it independently before merging.
- Post-change reference searches for all seven deleted component names returned no matches under `src` or `scripts`.

## Worktree and change boundary

No commit or push was performed. Existing unrelated modifications were present before this track and were preserved. The only code changes made by this audit are the seven file deletions listed above plus this report.
