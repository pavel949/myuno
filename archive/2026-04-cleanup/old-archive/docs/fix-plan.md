> ARCHIVED: 2026-04-20
> Superseded by: docs/FIX_SPRINT_CYCLE2_REPORT.md
> Reason: Generic Mar 2026 fix plan — superseded by sprint cycle 2 report

# myUNO — Fix Plan (Prioritized Backlog)

**Date:** 2026-02-25  
**Context:** Post-audit backlog for launch stability

---

## P0 — Must Fix Before Launch

| # | Issue | Effort | Risk | Acceptance Criteria | Status |
|---|-------|--------|------|---------------------|--------|
| P0.1 | Delete unused `src/data/marketplaceProducts.ts` (783 lines, 0 imports) | 1pt | Low | File deleted, no build errors | ✅ Already deleted |
| P0.2 | Delete unused `src/data/demo/properties.json` | 1pt | Low | File deleted, no build errors | ✅ Already deleted |
| P0.3 | Delete unused `src/data/demo/restaurants.json` | 1pt | Low | File deleted, no build errors | ✅ Already deleted |
| P0.4 | Consolidate duplicate owner expense routes (`/owner/expenses/quick` and `/owner/quick-expense`) | 1pt | Low | Single route, redirect from old | ✅ Already has both, keep both as aliases |

**P0 Assessment:** No blocking bugs found. Dead code cleanup is the only concrete action.

---

## P1 — Fix After Launch (Sprint 1)

| # | Issue | Effort | Risk | Acceptance Criteria |
|---|-------|--------|------|---------------------|
| P1.1 | Refactor `useAdminContent.ts` (498 lines) — migrate 10+ admin hooks from useState/useEffect to useQuery | 8pt | Medium | All admin CRUD pages work; query keys invalidate correctly; no regressions in admin flows |
| P1.2 | Deprecate `useSupabaseQuery.ts` — migrate consumers (useRestaurants, etc.) to standard useQuery | 5pt | Medium | All hooks using useSupabaseQuery migrated; file deleted; no regressions |
| P1.3 | Align restaurant query keys across prefetch, admin, and public hooks | 2pt | Low | Single canonical key factory in queryConfig.ts; prefetch keys match runtime keys |
| P1.4 | Add ESLint `react-hooks/exhaustive-deps` rule to catch missing deps | 2pt | Low | Rule enabled; zero warnings in CI |
| P1.5 | Type-safe admin mutations — remove `as any` casts in useAdminContent.ts | 3pt | Low | All insert/update calls use proper types from supabase types |

---

## P2 — Backlog (Sprint 2+)

| # | Issue | Effort | Risk | Acceptance Criteria |
|---|-------|--------|------|---------------------|
| P2.1 | Restaurant menu data — migrate useEffect to useQuery in useRestaurant() | 2pt | Low | Menu data cached; re-navigation uses cache |
| P2.2 | Filter URL persistence — encode active filters in URL query params | 5pt | Medium | Filters survive page refresh and are shareable |
| P2.3 | Admin cache → Public cache invalidation — ensure admin edits are reflected in public views | 3pt | Medium | Admin updates invalidate relevant public query keys |
| P2.4 | Context provider performance — audit rerender impact of 10+ nested providers | 2pt | Low | Measure with React DevTools; split if needed |
| P2.5 | Add canonical query key factories for all verticals in queryConfig.ts | 3pt | Low | All hooks use centralized key factories |

---

## Assumptions Made

1. No new features are needed for launch — current journeys J1–J8 are sufficient
2. `useAdminContent` hooks work correctly despite non-standard patterns — verified via code review
3. RLS policies are adequate — verified via architecture memory notes
4. The `useSupabaseQuery` custom hook works but lacks TanStack Query benefits (caching, dedup, background refetch)
5. Dead data files have zero runtime impact but increase bundle analysis noise