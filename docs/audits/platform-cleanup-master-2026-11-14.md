# Platform Cleanup Master Audit

**Date:** 2026-11-14
**Repository:** `/home/ubuntu/myuno-audit`
**Inputs:** six bounded cleanup audits (design systems, routes, legacy/dead code, accessibility, consumer journeys, and role workspaces)

## Executive decision

**Decision: accept the bounded safe fixes, do not merge the cleanup as fully validated yet, and sequence the remaining work through contract-first follow-up batches.** The tracks found and corrected several concrete defects without changing business contracts, authentication, or route intent. Focused tests and scoped lint/design checks are green where reported. However, a clean repository-wide TypeScript pass was not obtained: multiple concurrent `tsc` processes were present and the bounded runs timed out. That is the principal merge gate.

No P0 production outage, security issue, data-loss issue, or confirmed broken mounted route was identified in the supplied results. The open work is predominantly P1 validation/state-recovery debt and P2 consistency, IA, localization, and dead-code ownership debt. No further code changes or commit should be made as part of this audit synthesis.

## Verified fixes

The following changes were reported as completed and verified by the bounded agents:

- **Design tokens:** replaced the literal `text-[11px]` in `src/components/ui/status-pill.tsx` with the canonical `text-caption` utility. `npm run design:check` completed with **0 new/structural findings** and 219 resolved baseline entries; the existing baseline still reports 4,062 findings.
- **Route integrity:** corrected legacy investment aliases in `src/lib/config/routes.ts` to target canonical `/invest`, `/invest/dashboard`, and `/invest/raise` route constants. Tightened `routeRegistry` matching to recognize concrete community slugs while rejecting nested undeclared overmatches. Added regression coverage. Focused route checks passed **4 files / 103 tests**.
- **Verified dead code removal:** removed seven components with no production or script references: `SkipToContent`, `NextStepNudge`, `OwnerReferralCard`, `TripPositioningHero`, `PeylaaLeadForm`, `PeylaaROICalculator`, and `PeylaaUnitCatalog`. Reference scans found no remaining names under `src` or `scripts`. Focused checks passed **4 files / 26 tests**.
- **Accessibility and responsive UX:** raised public landing CTA hit areas to the 44px contract; raised CompactFooter social/install targets; added reduced-motion resets for descendant scroll behavior and document horizontal overscroll. Focused checks passed **4 files / 14 tests**, and scoped `tsc --noEmit` plus `git diff --check` completed without diagnostics for this track.
- **Consumer journey states:** `FeatureLayout` now consumes catalog loading/empty props and renders localized loading or canonical empty states. `UnifiedCatalogShell` now requires `items !== undefined` before treating a read as confirmed empty. Focused lint passed; consumer checks passed **4 files / 99 tests**.
- **Developer workspace:** `DeveloperOverview` now renders an accessible profile-loading skeleton and distinguishes partial-data, project/lead loading, errors, and valid empty states. Focused workspace checks passed **17/17** with scoped lint reporting no errors (four pre-existing `any` warnings noted).
- **Cross-track focused validation:** the design track reported **4 files / 31 tests**, and the accessibility track reported **4 files / 14 tests**, in addition to the focused suites above. These counts are track-local and should not be added as a claim of one canonical aggregate run.

## Unresolved priority register

### P0 — none confirmed

No supplied finding meets the P0 threshold of an active outage, security/privacy exposure, irreversible data corruption, or confirmed production-wide navigation failure. This is a bounded-audit conclusion, not a claim that every runtime path has been exercised.

### P1 — resolve before merge or broad rollout

1. **Obtain a clean repository-wide TypeScript result.** Every track that attempted the broad check either timed out or was contaminated by concurrent `tsc` processes; only the accessibility track has a completed scoped no-emit result. Do not claim type safety until all concurrent processes are stopped and one clean run exits 0.
2. **Close query-error recovery gaps in role workspaces.** `src/pages/developer-portal/DeveloperLeads.tsx` still treats query failure like an empty list, and `DeveloperProjects.tsx` lacks an explicit query-error state. Vendor data-hook error states also need a focused pass. These can misrepresent unavailable data as valid emptiness and suppress retry paths.
3. **Complete the catalog error contract.** `UnifiedCatalogShell` now avoids a false empty state for `items === undefined`, but it has no explicit error prop. A failed read with `isLoading=false` can still fall through to the normal list branch without a dedicated retry message. Define and adopt an error/retry contract before expanding migration.
4. **Triage the 66 unmatched content-route hrefs.** The inventory reports 66 unmatched hrefs among 307 occurrences across concierge, health, legal, owner, wedding, and water-activity areas. Assign each to a canonical route, an intentional external destination, a parameterized builder, or removal; do not add speculative redirects.
5. **Run the required clean validation gate.** Re-run focused tests after the clean typecheck and inspect the final diff/worktree so deleted files and all safe fixes are included without absorbing unrelated pre-existing changes.

### P2 — schedule after P1, with explicit owners

1. **Touch-target exceptions:** audit all callers of `Button size="sm"` before changing its documented 36px dense variant; review `FeatureLayout` h-8 toggles and `TopBar` tablet h-9 toggle individually.
2. **Design primitive ownership:** document when `Badge` versus `StatusPill` is authoritative, then consolidate or provide an intentional compatibility layer.
3. **Surface API cleanup:** coordinate migration of `Surface` radius names that all resolve to `rounded-none` and legacy elevation aliases; remove misleading options only after caller inventory and visual review.
4. **Competing visual systems:** govern or migrate `cinematic-home.css`'s scoped `--home-*` palette and literal sizes/colors toward the token foundation. Treat this as a visual design project, not a blind replacement.
5. **Compatibility aliases:** migrate all `--bg-surface`, `--bg-elevated`, and `--bg-base` callers before retiring the aliases from `tokens.css`.
6. **Repeated local contracts:** reduce typography/spacing literals in `ContextualCTA`, `UnifiedSectionHeader`, and `UnifiedHeader` after confirming intended exceptions.
7. **Dead-code ownership decisions:** resolve Knip candidates including `LaunchSwitch`, unconnected newbuild/PWA components and tabs, owner team sheets, dashboard barrels, `InstallBanner`, `MobileInstallSheet`, `MemberActivitySheet`, and `MemberPermissionsSheet`. Preserve items coupled to mocks, deep-tab tests, compatibility entry points, or reserved PWA surfaces until owners decide.
8. **Unwired guest-stay draft:** keep `/guest/messages`, `/guest/area`, and `/guest/rules` inactive until product confirms mounted routes or parameterized builders.
9. **Localization and browser accessibility:** localize developer-portal hardcoded Russian labels where required; provide Thai empty-state copy or formalize the localization contract; run keyboard/focus-return, 200% zoom, forced-colors, and Chromium widths 375/390/430px. Verify dynamic image titles and external destination labels have non-empty accessible names.
10. **Landing theme and content IA governance:** assign owners for the cinematic home palette and unmatched route inventory rather than allowing parallel conventions to grow.

## Duplicated and competing design systems

The repository has a canonical token foundation in `src/styles/tokens.css` and shared experience rules in `src/styles/unified-experience.css`, but several parallel or compatibility layers remain:

- **Typography:** the safe status-pill fix binds one primitive to `text-caption`, while `ContextualCTA`, `UnifiedSectionHeader`, and `UnifiedHeader` still repeat literal typography and spacing values. This is drift risk, not a confirmed visual regression.
- **Status semantics:** `Badge` and `StatusPill` overlap as status primitives without an ownership rule. Their APIs should be compared before either is expanded.
- **Surface/elevation:** `Surface` exposes radius names resolving to no radius and legacy shadow/elevation aliases despite the canonical no-radius/no-shadow direction. The names communicate distinctions the implementation does not provide.
- **Landing theme:** `src/styles/cinematic-home.css` defines a scoped `--home-*` palette plus many literal colors/sizes, creating a deliberate but competing visual system relative to the shared token layer.
- **Background compatibility:** `TopBar` and `AppDrawer` still consume `--bg-surface`, `--bg-elevated`, and `--bg-base`; they resolve today, but are migration debt rather than canonical contracts.
- **Touch targets:** the shared 44px minimum contract coexists with intentionally dense 36px/40px controls. Exceptions must be explicit and caller-reviewed rather than changed globally.

## Route and dead-code risks

- The investment alias and community route-registry defects were fixed and regression-tested. No actionable duplicate mounted route declaration was confirmed.
- The guest-stay navigation draft is explicitly unwired; it is a future integration risk, not an active dead link unless surfaced by a caller.
- The 66 unmatched content hrefs are the largest route/IA inventory risk. They need ownership decisions, not speculative route creation.
- The seven verified-unreachable components were removed safely, while compatibility routes and referenced landing pages were retained.
- Remaining Knip candidates are not automatically dead: `LaunchSwitch` is mocked to assert retired controls do not mount; newbuild/PWA components are coupled to deep-tab or composition tests; dashboard barrels may be compatibility entry points. Each needs an owner/test-contract decision.
- `PeylaaLanding` remains as a compatibility route that redirects to the canonical off-plan detail route; its former unreferenced child components were removed.

## Exact next fix batches

### Batch 0 — clean verification gate (merge blocker)

1. Stop/avoid concurrent TypeScript processes.
2. Run the repository-wide typecheck to completion and capture exit status.
3. Run `git diff --check`, inspect `git status --short`, and verify only intended fixes/audit documents are present.
4. Run the focused suites listed below once from the same clean worktree.
5. If any failure appears, classify it as pre-existing versus introduced before proceeding.

**Exit criteria:** one clean typecheck exits 0; focused suites pass; no accidental edits or missing deleted-file changes.

### Batch 1 — state correctness and recovery

1. Add explicit query error/retry states to `DeveloperLeads` and `DeveloperProjects`.
2. Inventory vendor data hooks and add consistent loading/error/empty distinctions.
3. Add an `error`/retry contract to `UnifiedCatalogShell` and update representative callers, including Thai localization behavior.
4. Add regression tests for failed reads, retry actions, and valid zero-result reads.

**Exit criteria:** unavailable data never presents as confirmed empty, and every affected surface has a visible recovery action.

### Batch 2 — route/content IA closure

1. Export the 66 unmatched href inventory grouped by domain and owner.
2. Decide canonical route, external destination, parameterized builder, or removal for every entry.
3. Confirm guest-stay draft destinations with product before wiring.
4. Add route-registry/content-inventory regression checks for resolved entries and intentional exclusions.

**Exit criteria:** every unmatched entry has a recorded decision and no speculative redirect is added.

### Batch 3 — contract consolidation

1. Audit `Button size=sm`, `FeatureLayout` toggles, and the tablet `TopBar` toggle against the touch-target policy.
2. Define `Badge`/`StatusPill` ownership and migrate callers incrementally.
3. Inventory `Surface` radius/elevation consumers and publish a deprecation/migration plan.
4. Migrate background compatibility aliases only after caller inventory.

**Exit criteria:** exceptions are documented, shared APIs describe actual behavior, and visual snapshots/focused tests cover migrations.

### Batch 4 — dead-code and visual-system governance

1. Assign owners to all remaining Knip candidates and classify production, test-contract, compatibility, reserved, or removable.
2. Review `cinematic-home.css` as a deliberate theme migration; do not bulk-rewrite literals.
3. Consolidate repeated shared-header/CTA literals where the design contract is proven.
4. Run browser accessibility, zoom, forced-colors, and responsive checks; resolve localization gaps.

**Exit criteria:** every candidate has a disposition, parallel design systems have documented boundaries, and public-shell accessibility checks are recorded.

## Validation command set

Run from `/home/ubuntu/myuno-audit`, with no concurrent `tsc` process:

```bash
# Repository cleanliness and whitespace
 git status --short
 git diff --check

# Merge-blocking full type verification
 npm exec -- tsc --noEmit

# Design-system audit
 npm run design:check

# Route/navigation focused regression set
 npm exec -- vitest run \
   src/lib/nav/__tests__/routeRegistry.test.ts \
   src/components/layout/__tests__/routeOwnership.test.ts \
   src/components/layout/__tests__/routeLayoutRegression.test.tsx \
   src/components/layout/__tests__/appLayoutComposition.test.tsx

# Accessibility/public-shell focused set
 npm exec -- vitest run \
   src/components/__tests__/mobile-overflow.test.tsx \
   src/components/__tests__/startup-loading.test.tsx \
   src/components/__tests__/sticky-scroll-root.test.tsx \
   src/components/__tests__/publicChromeContracts.test.tsx

# Consumer/state focused set
 npm exec -- vitest run \
   src/pages/services/__tests__/ServicesIndex.test.tsx \
   src/pages/services/__tests__/ServiceRoutes.integration.test.tsx \
   src/pages/home/__tests__/HomeDiscoverySearch.test.tsx \
   src/pages/home/__tests__/discoverFilterState.test.tsx

# Workspace/dead-code regression set (use the repository's exact paths if renamed)
 npm exec -- vitest run \
   src/pages/developer-portal/__tests__ \
   src/components/layout/__tests__/routeOwnership.test.tsx \
   src/components/layout/__tests__/routeLayoutRegression.test.tsx

# Content route inventory
 node scripts/qa/content-route-inventory.mjs

# Dead-code review (interpret candidates; do not delete automatically)
 npx knip

# Reference scan for the seven removed component names
 rg -n "SkipToContent|NextStepNudge|OwnerReferralCard|TripPositioningHero|PeylaaLeadForm|PeylaaROICalculator|PeylaaUnitCatalog" src scripts || true
```

The prior track results establish successful focused runs of 31, 103, 26, 14, 99, and 17 tests in their respective scopes, but those are historical bounded-run results. The clean Batch 0 execution is required before treating the platform cleanup as merge-ready.

## Audit conclusion

The safe fixes materially reduce route drift, unreachable code, false empty states, blank developer loading states, and public-shell touch-target/reduced-motion defects. The cleanup should proceed, but only behind the clean typecheck gate and the P1 recovery/IA work. The remaining design and dead-code work is valuable but should be handled as owned migration batches, not broad mechanical replacement.
