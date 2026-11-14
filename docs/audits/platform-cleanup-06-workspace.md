# Platform cleanup 06 — role workspaces and business flows

**Track:** `workspace`
**Scope:** owner, vendor, developer, management-company and admin pages
**Repository:** `/home/ubuntu/myuno-audit`
**Audit date:** 2026-11-14
**Status:** bounded review complete; no commit or push performed

## Executive summary

The role surfaces are mounted through the intended shells: vendor routes use `VendorLayout`, management-company routes use `MCLayout` behind `MCGuard` and `ActiveCompanyProvider`, developer routes use the standalone `DeveloperPortalLayout`, and admin routes are centralized in `adminRoutes.tsx`. Owner paths are compatibility aliases into the canonical management-company workspace (`/owner/*` redirects to `/mc/*`), rather than a second operational shell. The checked developer deal-room and project destinations are mounted.

One safe fix was applied in `src/pages/developer-portal/DeveloperOverview.tsx`: the overview previously returned a blank page while the profile query was loading and silently rendered zero-valued/empty sections when project or lead queries failed. It now shows a loading skeleton, an explicit partial-data alert, query-specific loading placeholders, and explicit empty states with a create-project action.

No database, auth/RLS, routing contract, financial writer, or canonical domain behavior was changed.

## Findings

### F-01 — Developer overview blank during profile loading (fixed)

- **Severity:** P1 usability / role dead end
- **File/line:** `src/pages/developer-portal/DeveloperOverview.tsx:18-28` (before the fix, line 17 was `if (isLoading) return null`)
- **Evidence:** The overview returned `null` during `useDeveloperProfile()` loading. In the developer portal this leaves the already-mounted shell with no page content and no progress indication.
- **Impact:** A developer can interpret a normal initial load as a dead or broken workspace.
- **Resolution:** Replaced the blank return with an accessible loading skeleton (`role="status"`), and retained the existing shell/profile gate. Added a defensive null return for direct/short-lived no-profile renders; the parent portal layout remains authoritative for redirect behavior.

### F-02 — Developer project/lead failures were presented as empty/zero data (fixed)

- **Severity:** P1 data trust / role dead end
- **File/line:** `src/pages/developer-portal/DeveloperOverview.tsx:14-15, 58-62, 87-99, 185-237`
- **Evidence:** `useDeveloperProjects()` and `useDeveloperLeads()` were destructured only for `data`, with `[]` defaults. Query errors were therefore indistinguishable from a valid empty project/lead account; KPI values could display zero and the recent leads section disappeared.
- **Impact:** Developers could miss operational data or conclude they have no projects/leads when the source is unavailable. This violates the project requirement that failed data must not become an empty success state.
- **Resolution:** Captured `isLoading`/`isError` for both queries; added an explicit partial-data alert, project and lead loading placeholders, a project empty state with a create action, and a lead empty state. Error sections are not rendered as successful empty sections.

### F-03 — Owner pages intentionally use the canonical MC shell (verified current, no fix)

- **Severity:** informational consistency finding
- **Evidence:** `src/components/layout/AnimatedRoutes.tsx:760-795` mounts `/mc` with `MCLayout` and redirects `/owner`, `/owner/guide`, `/owner/setup`, `/owner/portfolio`, `/owner/finance`, and other legacy owner paths to `/mc/*`. `src/components/layout/routes/mcRoutes.tsx:21` mounts `OwnerDashboard` as the MC index. Owner-page actions in files such as `src/pages/owner/OwnerProperties.tsx` and `src/pages/owner/OwnerCalendar.tsx` navigate to `/mc/*`.
- **Assessment:** This is consistent with the canonical “one operational reality” and avoids parallel owner/management-company shells. It is not a broken link. Copy/navigation should continue to call this canonical workspace consistently in future work.

### F-04 — Role route destinations checked are mounted (verified current, no fix)

- **Evidence:** `src/components/layout/AnimatedRoutes.tsx:412-423` mounts the developer portal child routes, including projects/new, project detail, company, leads, lead detail, analytics and team. `src/components/layout/AnimatedRoutes.tsx:549` mounts `APP_ROUTES.INVEST_SUBMIT` (`/invest/submit`). `src/components/layout/AnimatedRoutes.tsx:716-752` mounts vendor routes, including the `/vendor/tours` compatibility redirect. `src/components/layout/routes/adminRoutes.tsx:19-120` mounts the admin workspace and its compatibility redirects.
- **Assessment:** The developer overview links at lines 134 and 149 (`/invest/submit?...`) and the project-create link at lines 95 and 167 resolve to mounted routes. No safe link correction was warranted.

## Fixes applied

1. Updated `src/pages/developer-portal/DeveloperOverview.tsx` to render an accessible profile loading skeleton instead of `null`.
2. Updated the same page to preserve and surface project/lead query errors rather than defaulting failed reads to empty arrays.
3. Added explicit project and lead loading states and canonical `EmptyState` usage; the project state includes a mounted create-project action.
4. Did not alter owner compatibility redirects, vendor route aliases, admin redirects, management-company guard behavior, data writers, or authorization logic.

## Verification

- `npx vitest run src/pages/developer-portal src/components/layout/__tests__/stableLoadingShell.test.tsx src/test/navigation/mountedRouteOwnership.test.ts`
  - **Passed:** 2 executed test files in the selected command (the `src/pages/developer-portal` directory contains no matching test file), **17 tests passed**.
  - Stable loading boundary tests: 8 passed.
  - Mounted route ownership tests: 9 passed.
- `npx eslint src/pages/developer-portal/DeveloperOverview.tsx`
  - **0 errors**, 4 pre-existing `no-explicit-any` warnings on the page (lines 31, 34, 37, 109); this audit did not expand into a type-model refactor.
- `git diff --check`: passed for the changed file.
- `npm run typecheck`: launched but the repository already had multiple concurrent long-running `tsc -b --noEmit` processes in the shared sandbox; no completed exit status was available during this audit window. The focused tests and scoped lint completed successfully.

## Remaining risks / follow-up

1. `src/pages/developer-portal/DeveloperLeads.tsx:26-100` still destructures only `data`/`isLoading` from `useDeveloperLeads()` and displays “Лиды не найдены” for a failed query. The overview fix prevents this specific dashboard dead end, but the dedicated leads page still needs an explicit error state in a future bounded pass.
2. `src/pages/developer-portal/DeveloperProjects.tsx:14-75` similarly handles loading and empty data but does not expose the hook’s query error. A failed project read can still look like “У вас пока нет проектов.”
3. `src/pages/vendor/VendorDashboard.tsx:57-101` and its downstream widgets should receive a separate focused error-state pass; this audit verified shell/route mounting but did not claim every vendor data hook has a distinct error state.
4. The developer portal has hardcoded Russian labels in `DeveloperOverview.tsx` and neighboring pages while the surrounding shell reads language context. This is a localization consistency risk, not changed here because the safe fix was limited to state truthfulness and no translation contract was established in this pass.
5. The working tree contained unrelated deletions/modifications and pre-existing audit documents before this track. They were not edited or reverted. No commit or push was performed.
