# Platform cleanup 02 — Routes and navigation integrity

**Track:** `routes`
**Scope:** `src/components/layout`, `src/lib/config/routes.ts`, `src/lib/nav`, and route/navigation tests
**Audit date:** 2026-11-14
**Repository:** `/home/ubuntu/myuno-audit`

## Summary

The mounted route tree is broadly coherent in the audited surfaces. Focused route/navigation checks passed after two safe fixes: legacy investment aliases now resolve to the mounted `/invest` namespace, and the route registry now recognizes concrete slugs for the mounted `/communities/:slug` route without treating unrelated paths such as `/mc/operations` as valid. No changes were made outside route/navigation files and the related route-regression test.

## Findings

### Fixed — legacy investment redirect table pointed at retired namespace

- **File/lines:** `src/lib/config/routes.ts:628-630` (before the fix).
- `LEGACY_REDIRECTS` mapped `/invest`, `/invest/dashboard`, and `/invest/raise` to `/property/invest`, `/property/invest/dashboard`, and `/property/invest/raise`. The mounted canonical routes are `/invest`, `/invest/dashboard`, and `/invest/raise` (`src/components/layout/AnimatedRoutes.tsx:528-537`), while `/property/invest*` is explicitly a legacy alias that redirects forward (`src/components/layout/routes/propertyHubRoutes.tsx:104-111`). The old mapping therefore created an unnecessary reverse hop and could create a redirect loop when consumed by generic legacy-resolution code.
- **Fix applied:** those three mappings now use `APP_ROUTES.INVEST`, `APP_ROUTES.INVEST_DASHBOARD`, and `APP_ROUTES.INVEST_RAISE`.

### Fixed — route registry did not recognize concrete community slugs and overmatched dynamic prefixes

- **File/lines:** `src/lib/nav/routeRegistry.ts:77-115` (before the fix).
- `APP_ROUTES.COMMUNITY_DETAIL` is declared as the React Router pattern `/communities/:slug`, and the route is mounted at `src/components/layout/AnimatedRoutes.tsx:500-501`. `isKnownRoute('/communities/phuket-expat-club')` nevertheless returned false because the registry only expanded factory functions and exact strings.
- The previous factory-route prefix check also accepted arbitrary siblings below a shared prefix; the existing regression assertion for `/mc/operations` exposed this behavior. That path is not declared or mounted, but a broad `/mc/` dynamic prefix could classify it as known.
- **Fix applied:** factory routes are compiled into exact segment-aware regex patterns, preserving one-vs-two-parameter shapes; colon-parameter declarations are matched only when the input begins with the declared prefix and contains exactly one non-empty segment.

### Remaining — unwired guest-stay draft contains orphan destinations

- **File/lines:** `src/lib/nav/guestStayNavDraft.ts:30,47-49`.
- The draft exports `/guest/messages`, `/guest/area`, and `/guest/rules`, but the mounted guest routes currently include `/my-stay`, `/guest/check-in/:bookingId`, `/guest/guidebook/:propertyId`, and `/guest/profile` (`src/components/layout/AnimatedRoutes.tsx:697-703`). The file explicitly says it is “NOT wired” and reserved for a future shell, so these are not active production navigation links today. They remain a future integration risk: attaching this draft without adding routes or parameterized destination builders would create dead links.
- No fix was applied because activating or guessing destinations would exceed the bounded safe-fix scope and could invent guest-stay product behavior.

### Remaining — content-route inventory reports 66 unmatched hrefs

- **Evidence:** `node scripts/qa/content-route-inventory.mjs` reported `307` occurrences and `66` unmatched hrefs, including `/concierge?...`, `/services/health/...`, `/legal/...`, `/owner/...`, `/wedding/...`, and `/water-activities`.
- These links are outside the bounded route/navigation source files and include taxonomy/content destinations whose intended product treatment is not established by the current mounted tree. They should be triaged by the owning content/IA track before adding redirects; no speculative redirects were added here.
- The existing route test intentionally confirms `/services/health/recovery` is unmatched rather than silently treating the catch-all as a valid destination (`src/test/navigation/mountedRouteOwnership.test.ts:29-31`).

### No duplicate route declaration confirmed in focused ownership checks

- `mountedRoutes()` reports 714 parsed entries / 703 unique non-index paths; the apparent repeated `/` entries are index/root parsing artifacts rather than duplicate bounded route declarations.
- Existing ownership tests passed for `/invest`, ClearView routes, MC CRM sequences, and the catch-all handling.

## Fixes applied

1. Corrected the three legacy investment mappings in `src/lib/config/routes.ts:628-630`.
2. Tightened dynamic route matching and added colon-parameter support in `src/lib/nav/routeRegistry.ts:74-115`.
3. Added regression tests in `src/lib/nav/__tests__/routeRegistry.test.ts:17-55` covering concrete community slugs, rejection of nested overmatches, and canonical investment redirect targets.

## Verification

- `npx vitest run src/lib/nav/__tests__/routeRegistry.test.ts src/lib/nav/__tests__/navigationModel.test.ts src/test/navigation/mountedRouteOwnership.test.ts src/test/navigation/routeLayout.regression.test.tsx --reporter=dot`
  - **Result:** 4 test files passed, 103 tests passed.
  - Existing React Router future-flag warnings were emitted; no test failures.
- `git diff --check`
  - **Result:** passed.
- `npm run typecheck`
  - **Result:** did not complete within the 300-second command window; no claim of a clean full typecheck is made.

## Files changed

- `src/lib/config/routes.ts`
- `src/lib/nav/routeRegistry.ts`
- `src/lib/nav/__tests__/routeRegistry.test.ts`
- This report: `docs/audits/platform-cleanup-02-routes.md`

No commit or push was performed. Existing unrelated worktree changes were preserved.
