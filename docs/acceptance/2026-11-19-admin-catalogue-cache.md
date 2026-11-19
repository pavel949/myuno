# Admin catalogue acceptance: isolated lane

Baseline: pavel949/myuno main b4bbfde5dca7a301940d3baf8c04695221ae0701 (remote HEAD rechecked unchanged).
Scope: existing developers / property_projects / properties; no new entities, migrations, auth policy changes or production writes.

## Concrete defect and correction
Admin developer create/update/delete invalidated only admin queries (and one detail on update). Previously visited public developer lists and slug routes could retain inactive/deleted/renamed records for their five-minute stale window. All successful writes now invalidate the existing public list, id and slug query families, plus admin list/detail. Rejected writes do not claim a refresh.

The exported private useDeveloper hook also shared ['developer', id] with the safe public projection. Its key is now ['admin-developer', id]. No current UI importer of this private hook was found, so this is latent cache separation hardening, not evidence of an observed production disclosure. Public queries and server authorization are unchanged.

## Evidence
New test: src/hooks/__tests__/useAdminDevelopers.cache.test.tsx. On untouched source: 4 failures / 1 pass. After patch: 5 passes. Fixtures mock the Supabase module; no production client or records are used.

Commands:
```
npx vitest run src/hooks/__tests__/useAdminDevelopers.cache.test.tsx src/hooks/__tests__/useAdminProperties.write.test.tsx src/hooks/__tests__/useAdminProperties.read.test.tsx src/hooks/__tests__/projectCatalogPublication.test.ts src/hooks/__tests__/useDevelopers.public.test.ts src/lib/developerProjectPublication.test.ts src/components/admin/PropertyProjectBulkLinkPanel.integration.test.tsx src/components/admin/projects/ProjectUnitsTab.test.tsx src/components/layout/__tests__/developerPortalRouteGuard.test.ts src/pages/admin/__tests__/AdminDevelopers.recovery.test.tsx --maxWorkers=1
npx vitest run src/components/layout/__tests__/stableLoadingShell.test.tsx src/hooks/__tests__/useIsAdmin.actor.test.tsx --maxWorkers=1
```
Results: 10 files / 45 tests PASS; additional 2 files / 18 tests PASS. Includes explicit inactive-draft preservation, rejected/stale property update responses, property read race isolation, failed relationship mutations, physical unit authoring, public publication conditions, developer recovery, actor admin-boundary reset, stable protected route transitions.

## Boundaries / residual acceptance
These are synthetic React/hook tests, not database role acceptance or live CRUD. They do NOT prove deployed RLS, admin persistence across separate browser sessions, unauthorized-user database denial, or project deletion semantics. Current route files preserve existing AdminRouteLayout boundary. No publication or live actions occurred. No visual changes made; no new screenshot claimed. Full role-matrix CRUD and draft/public persistence need an explicitly isolated database, not Lovable preview (shared production).

Rollback: revert this small cache/test patch; no persisted data or schema rollback needed. No merge/deploy authorized in this lane.

Typecheck attempt: `npx tsc -b --noEmit` ended with Node heap exhaustion (`Ineffective mark-compacts near heap limit`), not a completed typecheck. No green build/CI claim. `git diff --check` passes. Do not merge based on these tests alone; full typecheck/CI remains required.
