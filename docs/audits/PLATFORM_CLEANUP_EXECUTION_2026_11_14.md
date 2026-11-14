# Platform cleanup execution — 2026-11-14

## Pre-change inventory and execution boundary

Requested scope: uploaded `Master_prompt_for_Lovable_-_complete_myUNO_cleanup.md`.
Starting source: `9d6ed4dbc42434b034dced0aee23ef455eb34b1b`, sandbox branch `edit/edt-a18a19b9-ffa7-4ecd-89e9-f8ffa3e78cf1`; initial worktree clean. Local history contains `47e64830efa59ae795a4f434141bb161ca564fd7` and `6837890113321af5bd3621043293cc4616a049af`. The sandbox origin is Lovable's managed storage, not a verified direct GitHub/Vercel connection. Local refs do not establish current GitHub state.

### Shared source inventory

- Consumer composition: `NavShell`, `ConsumerHeader`, `BottomBar`, `AppLayout`, `FeatureLayout`, `MiniAppLayout`, `UnifiedCatalogShell`, `UnifiedHeader`, `Footer`, `CompactFooter`.
- Specialized existing layouts: `AdminLayout`, `MCLayout`, `VendorLayout`, `ProviderDashboardLayout`, `DeveloperPortalLayout`, `NewbuildsLayout`, `CapitalLayout`, `TeamLayout`, `StaffLayout`, `GuestLayout`, `MeShellLayout`, onboarding and landing layouts. They retain independent role/domain admission; mechanical replacement is not authorized.
- Canonical visual source: `src/styles/tokens.css`, consumed by `tailwind.config.ts`, `src/index.css`, `src/styles/unified-experience.css` and shared shadcn primitives. `DESIGN.md` documents civic DS 2.1; older architecture/font summaries are stale references, not permission to restore retired fonts/palettes.
- Legacy migrated pages: SchoolFinder, CostOfLiving, MarketCatalog, VisaQuiz. Existing migration report is evidence to recheck, not current acceptance.
- Route/content audit entrypoint: `scripts/qa/content-route-inventory.mjs`; route registry, aliases, nested route declarations and content links will be evaluated separately from HTTP SPA status.
- Existing browser fixtures: `scripts/qa/*-ui.mjs` plus Python drivers; `e2e/tests/navigation/migrated-legacy-pages.spec.ts`.
- Version path: `package.json` prebuild → `scripts/generate-version.mjs` → `public/version.json`; Vercel invokes `npm run build`, and version cache headers already specify no-store. Branch identity is currently missing from generated payload.
- Current preview blocker: RPC `property_order_has_active_hold` absent from generated frontend types. Its migration exists in source; no claim that migration is deployed. Older observability entries also contain Edge type failures and require separate current-state disposition.

### Safety and release decisions

No new shell, schema/model, grants, production business writes, notifications, Auth changes, invitation enablement, enforcement or financial activation. Browser mutations must be synthetic and network-denied. Do not read secret files/values. No deletion without exhaustive references. No direct Git mutation or manual build/typecheck in this managed sandbox; use automatic build evidence, permitted tests and validators. Vercel exact-commit deployment is not replaced with a Lovable-hosted publication. Final readiness depends on actual gate results, not existing audit claims.

## Results

### Decision: NOT READY

The requested full cleanup and production release are **not completed**. A bounded confirmed-defect pass is implemented and checked; release is not requested because nested overlay acceptance and full role-flow/deployment evidence are missing. No business data, migrations, Auth/invitations, notifications or publication were changed.

### Implemented corrections

1. Pharmacy reads now propagate failures through the existing QueryClient, preserve same-key stale data and expose retry; entity/category/actor keys prevent another pharmacy or actor's result being reused. Explicit display projections exclude moderation fields; pharmacy list/detail require active + approved. No RLS changes.
2. Shared catalog list/map distinguishes error from empty and suppresses unknown counts; pharmacy detail/product sections show safe localized recovery. List/map controls have 44px geometry and pressed state.
3. Developer profile read failure no longer redirects as if no profile exists; private outlet remains unmounted. Projects/leads have error/retry; overview unresolved counts remain `—`. Failed developer lookup propagates from the leads hook instead of successful `[]`.
4. Owner/MC property-source failure no longer opens first-time onboarding. Aggregated fetch state disables retry during refresh. Vendor orders expose error/retry/data presence; failed initial reads no longer show zero KPIs, empty orders or all-clear alerts/charts.
5. Developer slug/UUID alias uses existing resolver. Four Vercel offplan redirects removed because they reversed canonical client destinations and lost direct detail routing. Host redirect now matches requested/observed www canonical host.
6. Prebuild and direct Vite version emission share verified SHA/branch resolution; no fabricated main/commit. Narrow named existing-client wrapper repairs generated-type drift for existing hold RPC without changing arguments, payment/inventory behavior or managed generated files. Source migration existence does not prove hosted RPC deployment.
7. Reproduced nested popover `pointer-events:none` inside modal repaired via explicit pointer events. **Escape still dismisses enclosing Sheet in the browser fixture; not fixed or accepted.** Experimental Escape handlers were reverted.
8. Test fixtures repaired: calendar saved-record/preparation suite isolates portal timing while retaining exact outcome assertions; source-route fixture binds the new alias; landing clearance assertion follows current 64px token. No business assertion was weakened.

### Inventory and route classification

Current source inventory: 42 chrome-named component files (not 42 independently mounted shells), 16 style files, 4/4 named legacy migrations structurally present; workspace page files: developer 14, owner 88, vendor 38, MC 16, admin 95. These counts are inventory, not exhaustive acceptance.

`node scripts/qa/content-route-inventory.mjs /tmp/cleanup/content-after.json`: before/after **307** content-link occurrences, **208** static matches, **33** dynamic matches, **66 unmatched / 49 unique hrefs**; 714 authored route records including wrappers/indexes. All unmatched content links are marked unavailable and render disabled spans through `LandingActionLink`, classified **intentional future/draft links** rather than enabled broken links. Dynamic families require entity verification: 19 unavailable, 4 unverified, 10 enabled constrained cluster links. This script covers its authored-content inputs, **not every Link/navigate in the repository**; exhaustive link census remains incomplete. No fictitious route was added to reduce counts; no proven literal two-node redirect cycle was found.

Canonical DS remains tokens.css + Tailwind; shared recovery uses semantic tokens and existing Button. No new shell/palette/font system. Intentional cinematic landing, role workspaces, opt-in admin/MC theme and token-backed newbuild aliases remain. No files deleted: exhaustive dead-code proof was unavailable. Badge/status/domain ownership consolidation beyond inspected primitives remains incomplete.

### Exact validation results

| Command/evidence | Result |
|---|---|
| Initial `npm test -- --reporter=dot` | 419 files passed / 3 failed; 4891 tests passed / 5 failed / 23 skipped; PostgreSQL init environment failed |
| Isolated intake rerun with Nix PostgreSQL bin/share/lib | **23/23 PASS**, temporary local cluster only; no hosted writes |
| Full rerun after first corrections | 427 files passed / 1 failed; 4936 tests passed / 3 failed; source-route fixture lacked new alias binding |
| Latest complete run with PostgreSQL environment | 427 files passed / 1 failed; **4939 passed / 1 failed / 4940 total**; design fingerprint flagged unchanged max-width on modified popover line |
| Final affected suites including design convergence/mobile-overflow/accessibility | **14 files / 51 tests PASS**; previously flagged geometry separated from pointer utility, no baseline relaxation |
| `npm run lint` | PASS, 0 errors / 2230 existing warnings |
| `npm run design:check` final | PASS, 4062 findings / 0 new-structural / 219 resolved baseline entries; not zero total design debt |
| `npm run validate:fonts` | PASS, 15 declared families |
| `npm run validate:service-tags` | PASS, 69 tagged services |
| `npm run validate:catalog-life-map` | Exit 0, one warning: management_company/vendor_onboarding situations unmapped |
| `git diff --check` | PASS |
| Automatic managed build | Latest checked entries **build OK**, including 06:57:50 UTC; manual build/typecheck prohibited here and not claimed |

The latest complete suite was not rerun after the final formatting-only design correction; its failing test and all affected suites were rerun successfully. Do not report 4940/4940 as an observed full run.

PostgreSQL command environment: `POSTGRES_TEST_BIN_DIR=/nix/store/z2f083ivabcgibvnmlva7da7dgn5q619-postgresql-17.11/bin`, `POSTGRES_TEST_SHARE_DIR=/nix/store/z2f083ivabcgibvnmlva7da7dgn5q619-postgresql-17.11/share/postgresql`, `POSTGRES_TEST_LIB_DIR=/nix/store/z2f083ivabcgibvnmlva7da7dgn5q619-postgresql-17.11/lib`; same `npm test -- --reporter=dot` runner. Initial missing dict_snowball environment issue was resolved, not hidden as pass.

Focused suites: usePharmacy.recovery, useDeveloperLeads.recovery, buildIdentity, deploymentMetadata, propertyOrderHold, AddBookingFromCalendarDialog.preparation, Landing.anonymous-home, VendorDashboard.frame, developer-portal/queryRecovery, cleanupAliases, stableLoadingShell, mobile-overflow, NavShell.accessibility, convergence-guard.

### Browser evidence and role acceptance

`python3 /tmp/browser/platform-cleanup/public_smoke.py`: **36/36 initial-render probes**, 9 routes × widths 375/390/430/1280, height 1800, reduced motion. All nonblank, no horizontal overflow or pageerror. Routes: `/`, `/property/search?mode=rent`, `/property/map?mode=rent&view=map`, `/newbuilds`, `/discover/services`, `/school-finder`, `/cost-of-living`, `/visa/quiz`, `/market/categories`. Non-GET/HEAD/OPTIONS, function calls and nonallowlisted data requests blocked. Screenshots reviewed for mobile search and calculator. Search screenshot was **still loading**: these probes do not prove settled catalogue loading or full E2E.

Shared primitive fixture built using `node scripts/qa/shared-surfaces-ui.mjs --build-only`, then bundled Chromium via adapted temporary Python driver (no manual app build). Network denied. **FAIL** at first RU/320/light nested sheet→popover→Escape→options flow: pointer issue fixed and retested, parent dismissal remains. No 32-case shared-primitive PASS claimed. Upstream Python fixture was not rewritten; only temporary diagnostic copies adjusted browser launch and screenshot behavior.

| Role/flow | Disposition |
|---|---|
| Guest public entry/layout, four legacy pages | Initial rendered layout PASS; settled search/detail/inquiry write journey BLOCKED/unverified |
| Developer profile rejection, projects/leads retry, unknown overview counts | Synthetic tests PASS; hosted create/edit/publication/CRM changes unverified |
| Owner/MC false onboarding | Source correction + full-suite coverage; dedicated hosted/isolated outcome matrix still incomplete |
| Vendor frame/cancelled order | Existing synthetic test PASS; dedicated failure/stale action matrix incomplete |
| Admin loading/denial/sibling routes/back-forward | Actual Router/guard synthetic tests PASS; hosted multi-role operational mutations not exercised |
| Seller/provider/developer/MC onboarding/create/archive/restore and fulfilment | BLOCKED: no contained hosted test environment; production mutation QA prohibited |
| 200% zoom, forced colors, complete keyboard/image/labels audit | Not exhaustively verified |

No auth account creation, employee assignment, payment, booking, export, email or WhatsApp used for testing.

### Production/version and Git evidence

Read-only public observation at 06:37 UTC: apex `/version.json` redirected to www; www returned 200 JSON, Cache-Control no-store, `version=3.55.5`, `buildTime=2026-11-14T02:33:08.392Z`, **no commit or branch**. Exact deployed SHA acceptance therefore FAILS. No Vercel project/deployment ID, READY state, alias attachment or origin/main parity verified. No Vercel credentials available/created, no direct provider deployment performed. Lovable publication would not establish the requested Vercel release identity and was not substituted.

Starting SHA: `9d6ed4dbc42434b034dced0aee23ef455eb34b1b`; latest implementation SHA checked before final report: `fa81bd4881ac5f7adf88c7acb721c07c51e6b57f`. Managed platform creates intermediate commits automatically; no manual commits, pushes, branch changes or co-author trailers were made. Exact observed managed cleanup commits through that checkpoint:

```text
347ab326fe4e95387ef10e8f6943e76688bc4fc6
b98928cc3f0bbf2f7f47ba7448a01122d06334ae
ea13fd5f3cbd78e0a7c883cd518b6e18a2d85d95
d4dd5abaa55dc38bdd413a659700f7b5c1637d69
fd90b8eaf999dd2aa3e4f653ceb22e19b539eed2
1aeae2c7637bf7af35b690cf0864cba160ef1ba8
eed7e67b1cbdb40913228d1d6c3616ae9f6ab3cf
f18db558a0e24510a44f47c8fca3ddfaae2373b2
4c7c66b63b5f0fe73bb02124
```

Correction: the last abbreviated entry above is not a SHA record; use the exact record below:

```text
85c2859f4e889acd4c7c66b63b5f0fe73bb02124
877a9415fcf9282eb77cd88311d83005ef885f28
6b3bde870d863381809838caf1f07ac5ace8f1e1
8bad7da3d3dbfd40abf605d4a8d04bd2b7ad4632
d56818fbb058f28f045502b845b23d492ad731a6
5d59aad6f5e043fa3060972d0c30e7b8451726c2
fa81bd4881ac5f7adf88c7acb721c07c51e6b57f
```

### Changed files / rollback

No removed files, dependencies, secrets, environment changes or build artifacts added. Automatically rewritten taxonomy audit date restored to its initial value. Source changes:

```text
AGENTS.md
roadmap.md
docs/audits/PLATFORM_CLEANUP_EXECUTION_2026_11_14.md
scripts/build-identity.d.mts
scripts/build-identity.mjs
scripts/generate-version.mjs
scripts/vite-deployment-metadata.ts
src/components/catalog/UnifiedCatalogShell.tsx
src/components/layout/AnimatedRoutes.tsx
src/components/layout/FeatureLayout.tsx
src/components/layout/__tests__/stableLoadingShell.test.tsx
src/components/newbuilds/DeveloperPortalLayout.tsx
src/components/owner/__tests__/AddBookingFromCalendarDialog.preparation.test.tsx
src/components/property/DepositPaymentOptions.tsx
src/components/routing/__tests__/cleanupAliases.test.tsx
src/components/shared/QueryRecovery.tsx
src/components/ui/popover.tsx
src/hooks/__tests__/useDeveloperLeads.recovery.test.tsx
src/hooks/__tests__/usePharmacy.recovery.test.tsx
src/hooks/useAssignedProperties.ts
src/hooks/useMyProperties.ts
src/hooks/useNewbuildLeads.ts
src/hooks/useOrders.ts
src/hooks/usePharmacy.ts
src/lib/__tests__/buildIdentity.test.ts
src/lib/__tests__/deploymentMetadata.test.ts
src/lib/__tests__/propertyOrderHold.test.ts
src/lib/propertyOrderHold.ts
src/pages/__tests__/Landing.anonymous-home.test.tsx
src/pages/developer-portal/DeveloperLeads.tsx
src/pages/developer-portal/DeveloperOverview.tsx
src/pages/developer-portal/DeveloperProjects.tsx
src/pages/developer-portal/__tests__/queryRecovery.test.tsx
src/pages/owner/OwnerDashboard.tsx
src/pages/pharmacy/PharmacyDetail.tsx
src/pages/pharmacy/PharmacyIndex.tsx
src/pages/vendor/VendorDashboard.tsx
vercel.json
```

Rollback reference: restore only this bounded source diff through a reviewed platform change against initial SHA; no live DB rollback is required because none was changed. Prior production deployment identity is UNKNOWN; do not invent a rollback deployment ID. Preserve unrelated later edits and do not reset history.

**Remaining release blockers:** nested overlay browser failure, incomplete exhaustive role/domain flows and accessibility/dead-code/all-links inventory, exact GitHub-main/Vercel deployment identity and public version SHA acceptance. No successful production release claim.