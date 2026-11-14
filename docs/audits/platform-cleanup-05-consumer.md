# Consumer journeys and conversion UX audit

**Track:** `consumer`
**Title:** Consumer journeys and conversion UX
**Repository:** `/home/ubuntu/myuno-audit`
**Audit date:** 2026-11-14
**Scope:** Homepage discovery entry, public service/property discovery, search and filter transitions, result/detail return paths, and loading/empty/error recovery.

## Executive summary

The bounded review found that the principal consumer discovery surfaces already have strong intent-preserving URL state and explicit recovery patterns. The services hub keeps query/category/situation state in the URL, preserves return context into detail/request routes, and distinguishes catalogue loading, unavailable, and confirmed empty states. The property search surface similarly preserves search criteria, bookmark hashes, map/list state, and offers retry controls for full-read, availability, and pagination failures.

One high-confidence shared-shell defect was identified and fixed: `UnifiedCatalogShell` passed `isLoading`, `isEmpty`, `emptyText`, and `emptyIcon` into `MiniAppLayout`, but `FeatureLayout` did not consume those props. Migrated catalogues could therefore show an uncommunicated blank area while data loaded and after a confirmed zero-result filter. A second guard prevents an undefined collection from being interpreted as a confirmed empty catalogue, preserving the repository rule that failed or unknown data must not become a false zero.

No business contracts, routes, query parameter names, data writers, or pricing/availability behavior were changed.

## Findings

### C-01 — Shared migrated catalogues dropped loading and empty states (fixed)

**Severity:** High UX consistency / conversion risk
**Evidence:** `src/components/catalog/UnifiedCatalogShell.tsx:272-278` supplied `isLoading`, `isEmpty`, `emptyText`, and `emptyIcon` to `MiniAppLayout`. Before this audit, `src/components/layout/FeatureLayout.tsx` destructured neither the state props nor rendered a state branch; the normal list branch at the former `children` render location always rendered children. Representative migrated callers such as `src/pages/pharmacy/PharmacyIndex.tsx:24-35` explicitly provide `isLoading`, and `src/pages/pharmacy/PharmacyIndex.tsx:84-85` provide empty copy/icon.

**User impact:** A user entering a migrated catalogue could see no feedback during the initial read, or a visually blank results region after a confirmed empty search/filter. This weakens intent comprehension and gives no clear next action.

**Fix applied:** `src/components/layout/FeatureLayout.tsx:185-188` now consumes the state props. At `src/components/layout/FeatureLayout.tsx:498-509`, the list surface renders a content-scoped localized `LoadingState`, a compact canonical `EmptyState` with supplied icon/copy and filter-recovery guidance, or the existing children branch. The map branch remains unchanged.

### C-02 — Undefined catalogue data must not become a false empty result (fixed)

**Severity:** High trust/recovery risk
**Evidence:** `src/components/catalog/UnifiedCatalogShell.tsx:137-141` normalizes `items` with `items ?? []` for filtering. The prior empty predicate at the shell boundary only checked `!isLoading && filteredForList.length === 0`, which could classify an undefined collection as a confirmed zero if a failed/unknown read was not accompanied by a loading flag.

**Fix applied:** `src/components/catalog/UnifiedCatalogShell.tsx:272-275` now requires `items !== undefined` before setting `isEmpty`. This keeps unknown/failed reads distinct from a verified empty result and avoids asserting that no catalogue supply exists.

### C-03 — Services discovery state and return transitions are coherent (no fix needed)

**Severity:** Informational positive evidence
**Evidence:** `src/pages/services/ServicesIndex.tsx:43-83` composes rapid URL updates and preserves unrelated query context. `src/pages/services/ServicesIndex.tsx:99-105` distinguishes ready, loading, error, and no-results conditions. `src/pages/services/ServicesIndex.tsx:144-152` exposes applied filters, reset, legacy-sort disclosure, loading status, and retry. `src/pages/services/ServicesIndex.tsx:182-197` carries `returnTo` into service detail/request transitions. `src/components/services/MarketplaceServiceGrid.tsx:24-49` keeps loading, read error, confirmed no supply, and no-match search states separate with retry/copy.

### C-04 — Property search recovery and intent preservation are coherent (no fix needed)

**Severity:** Informational positive evidence
**Evidence:** `src/pages/property/PropertySearchPage.tsx:267-275` preserves query/hash/state on clear and submit transitions. `src/pages/property/PropertySearchPage.tsx:346-353` explicitly discloses availability checks and offers retry when verification fails. `src/pages/property/PropertySearchPage.tsx:404-464` distinguishes skeleton, full-read error with retry, next-page error with retry, availability pending/failed, and confirmed empty with reset. `src/pages/property/PropertySearchPage.tsx:360-377` keeps sort, compare, map/list, and clear actions together near results.

## Fixes applied

1. Added shell-level loading rendering to `src/components/layout/FeatureLayout.tsx:185-188,498-500` using the existing content-scoped `LoadingState`.
2. Added shell-level confirmed-empty rendering to `src/components/layout/FeatureLayout.tsx:500-506` using the canonical `EmptyState`, preserving supplied catalogue icon/text and adding localized filter-recovery guidance.
3. Added an undefined-data guard to `src/components/catalog/UnifiedCatalogShell.tsx:272-275` so failed/unknown reads do not become false zero-result claims.

## Verification

- `npx eslint src/components/layout/FeatureLayout.tsx src/components/catalog/UnifiedCatalogShell.tsx` — passed.
- Focused consumer suite with `--testTimeout=10000` — passed: **4 files, 99 tests** (`ServicesIndex`, `ServiceRoutes.integration`, `HomeDiscoverySearch`, `discoverFilterState`).
- A broader focused run including `PropertySearchRoutes.integration.test.tsx` produced **156 passing tests and 1 timeout**. The timeout was the existing `preserves a result bookmark hash and unapplied editor draft through sort history` test at `src/pages/property/__tests__/PropertySearchRoutes.integration.test.tsx:72`; rerunning the same suite with the broader 10-second timeout was not part of the final pass set. No failure was attributable to the two changed shell files.
- `npm run typecheck` was started but exceeded the 300-second command window and exited without diagnostics; this remains a verification limitation rather than evidence of a type error.

## Remaining risks / follow-up

- `UnifiedCatalogShell` has no explicit error prop in its public contract. The new `items !== undefined` guard prevents a false empty claim, but a consumer hook that returns `items: undefined` with `isLoading: false` can still leave the list branch without a dedicated error message. Individual migrated pages should expose error/retry at the page or shell contract when their hooks support it.
- The shared empty copy is English/Russian only in the new fallback branch, while several catalogue surfaces support Thai. Thai callers should pass localized `emptyText`, or the shared shell should later receive a localized copy contract as a separate UX tranche.
- The change intentionally does not add skeleton cards because catalogue card shape differs across verticals; the shared content loading state is safer than fabricating a universal card layout.
- Existing unrelated worktree changes were preserved and not modified. No commit or push was performed.
