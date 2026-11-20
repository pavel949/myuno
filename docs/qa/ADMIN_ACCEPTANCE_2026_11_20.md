# myUNO admin acceptance — 20 November 2026

Repository: `pavel949/myuno`. Source baseline: `dcb70408de29faef9fa780f72fdf88b86c542107`.

## Result

Partial acceptance. This run passed 276 local checks. Authenticated production CRUD, deployed policy equivalence and visual acceptance remain open.

| Check | Result | Environment |
| --- | --- | --- |
| Existing admin editor, mutation receipt, cache, bulk linkage, provider picker and role-guard tests | 80/80 | Vitest, mocked transport, network restricted to loopback |
| Existing managed property publication | 113/113 | Disposable PostgreSQL 18.7, actual source SQL with synthetic schema and identities |
| Existing managed complex publication | 75/75 | Disposable PostgreSQL 18.7, including candidate SQL, synthetic schema and identities |
| New developer/project CRUD and relation acceptance | 8/8 | Disposable PostgreSQL 18.7, source DDL/policies, synthetic identities |
| New test TypeScript | PASS | Focused compilation with NodeNext resolution |
| Full project TypeScript | PASS | Bounded 3 GiB heap; initial 2 GiB heap exhausted and an 8 GiB retry was killed |
| ESLint on new test | PASS | No errors or warnings |
| Published `/admin/projects`, guest | Redirected to `/auth?redirect=%2Fadmin%2Fprojects` | Cloud browser, existing unsigned session |
| Complex form/review browser fixture | 12/12 | RU/EN/TH at 375, 390, 430, 1280 px; 36 screenshots, synthetic writes only |
| Admin tools browser fixture | 14/14 | 390 and 1440 px, synthetic SDK/query boundaries |
| Published build SHA | UNKNOWN | `/version.json` has version 3.55.5, buildTime `2026-11-20T01:49:00.911Z`, branch `master`, no commit |

The host prohibits Unix-domain sockets. System Chromium could not start; a temporary headless Chromium 153 with software rendering and a fresh browser per context completed the existing browser assertions. Screenshots of the desktop English and mobile Russian complex form were inspected. The browser scripts in the repository were not changed.

The host prohibits Unix-domain sockets. Local PostgreSQL runs temporarily changed only test transport to fixed loopback ports and disabled Unix listening. All SQL, role switches, assertions and timeouts were retained. The committed tests retain the repository's Unix-socket-only transport. These runs do not establish the policies deployed in Lovable Cloud.

The two existing publication suites include candidate contracts. Their passing results apply to their isolated fixtures and do not establish production activation of those candidates. `property_complexes` and `property_projects` are distinct tables.

## New coverage and actual access contract

`src/lib/__tests__/adminCatalogueRelations.postgres.test.ts` installs source table definitions, creator policies, Developer Module helpers/policies, the later developer read restriction and both source foreign keys. It reads these SQL statements from the repository instead of reimplementing their predicates.

- Two synthetic accounts with the existing `admin` role and one `broker` account complete developer/project create, readback through RETURNING, update and delete. The second admin represents a second admitted identity, not a separately verified Superadmin permission tier.
- Guest and unassigned authenticated actors cannot create developers or mutate another actor's existing developer/project.
- The existing creator policy explicitly permits a signed-in user to create, update and delete their own project. It refuses reassignment of authorship. This is an existing source contract, not a newly granted permission.
- An active developer seat can edit its developer and cannot update a different developer or move its project to another developer.
- The source foreign keys reject deletion of a developer with projects and a project with physical-property references. Invalid parent IDs fail, and the relation survives the failures.
- Physical-property rows in the new suite are synthetic FK fixtures written by the fixture owner. This suite makes no additional claim about their RLS or admin UI mutation paths.

The new suite is diagnostic source-policy coverage. It adds no application feature or permission. Project deletion currently has no delete control in `AdminProjects.tsx`; source-level permission and FK tests do not establish a complete UI deletion workflow.

## Remaining acceptance

1. Run the actual admin routes against a genuinely isolated clone of the deployed schema with test accounts for Admin, Superadmin as actually implemented, developer, ordinary user and guest. Verify full forms, reload/readback, files and parent deletion. The connected Supabase list did not expose this app's Lovable Cloud database or a named staging clone.
2. Compare the live read-only policy/grant/function manifest with the tested SQL. In particular, preserve legitimate creator/developer permissions and test direct API denials with non-admin tokens. Neither a context switch in an admin session nor a mock rejection establishes server denial.
3. Confirm the published commit identity and complete desktop/mobile RU/EN/TH editor screenshots and interactions in an authenticated session. Google sign-in reached the Lovable callback, which returned `Authorization failed / State verification failed / invalid_request`. A fresh myuno.app admin tab still redirected to sign-in, so authenticated production acceptance remains blocked.

## Evidence in this run

Local execution evidence is preserved in [the GitHub evidence directory](evidence/admin-2026-11-20/README.md). It contains all 50 synthetic browser screenshots, three result JSON files and six local test/typecheck/lint logs. The committed Unix-socket PostgreSQL test passed CI before PR #293 was merged.

Existing corroborating CI for the earlier release candidate `27d0c9143c1b016e95fbbcc9f75897c1bf6b09b1` is at https://github.com/pavel949/myuno/actions/runs/44552644119. It is evidence for that earlier commit only.

No production records, policies, migrations, grants or deployments were changed by this acceptance run.

## CI follow-up

On test commit `2b658da3a478ee273af41ea37f94d5fbaf1e027b`, Verify passed typecheck, the complete unit/PostgreSQL suite and lint: https://github.com/pavel949/myuno/actions/runs/44661268998. Connected-system verification, focused security, semantic and cleanup checks also passed. The design-system core browser job was still running at this observation; its discovery job had passed: https://github.com/pavel949/myuno/actions/runs/44661269264. The manually dispatched E2E workflow was skipped. This documentation-only follow-up preserves the tested application and test source.

## Accepted integration and continuation

PR #293 was merged as `ba4a7b248c4a3c67f690fc803760490f733a0ae0` after all active gates passed on head `28489f0ddff79908cf9b456131cd539a0e38a713`. Verify, Connected system, Design system, Focused security, Semantic Core and cleanup succeeded. The manual E2E workflow was skipped. This integration adds tests and documentation. The main application also includes separately checked PR #289.

[Issue #294](https://github.com/pavel949/myuno/issues/294) preserves the outstanding authenticated production acceptance, build identity and project deletion UX work. The owner authorized publishing the checked code and preserving completed work through GitHub PRs. Publication status is recorded in that issue and the evidence PR.
