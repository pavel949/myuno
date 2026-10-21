# MC Today → exact task, bounded read-only slice

## Audit and design

Base: `d101798bc` (PR117 source candidate), repository `pavel949/myuno`.

- `usePropertyBookings` writes preparation tasks into `property_operational_tasks` (cleaning/check-in/check-out). It does not write CRM tasks or reliably persist a booking ID on those preparation rows.
- `usePmsToday` previously omitted that table and inferred work from requests and CRM rows. `UnifiedTaskHub` already reads CRM + operational tasks but held a copied detail object independently of company context.
- Reuse both task tables and existing detail/writers. This slice introduces no booking/task/identity model, migration, auth policy, commercial transition or financial reconciliation.

## Read contract

Today reads only current authenticated actor's active-company, active-property scope from the existing property resolver; RLS remains authority. Empty, loading or failed scope must not become an unrestricted query. CRM rows must additionally match current company. Query/cache identity includes actor/company/property IDs/date.

The work queue consists of open CRM and operational tasks due on/before the Bangkok business date plus explicitly undated work. Date-only values remain civil dates; timestamps are converted with the shared Bangkok date helper. Closed/completed/done/cancelled rows are not active work. Property readiness stays inferred, never certified.

Each source has a 200-row snapshot bound, with an extra-row/count completeness check. Any source failure blocks an all-clear snapshot. Truncation is explicit and suppresses snapshot conclusions/counts; navigation to existing full workflows remains available. No task write is issued by Today.

## Navigation contract

Task identity is `(source, id)` where source is `crm` or `ops`; identical raw IDs do not imply identity. Today links to `/mc/tasks` with exact source/id, company context, and return URL. The URL is navigation state, never permission.

Task Hub resolves selection from currently authorized loaded rows only, verifies company/property scope, suppresses stale detail on scope changes and displays loading/failure/unavailable explicitly. No direct-ID fallback or guessed cross-source mapping. Filters persist in URL across detail open/close/Back/Forward. A return destination accepts only the local `/mc/today` route, retaining its query/hash. PR117 create intent remains one-shot.

## Verification and limits

Synthetic hook/component tests only, with real database/network access forbidden. Exact results and final SHA will be recorded after verification. No production read/write, remote push or deployment.

This does not establish full booking identity, preparation-task idempotency, booking lifecycle completion, operating-space enforcement, ledger/P&L reconciliation, or production workflow acceptance. Existing server authorization and reader completeness outside the Today snapshot are not re-audited here.

Rollback: revert the isolated UI/read-projection commit; no data migration or runtime configuration rollback is needed.

## Implemented details

- Source projections are explicit `TodayTask` display values over existing rows, not stored entities. CRM source carries company + property predicates; ops carries authorized active property IDs. Unknown dates/status remain visible as unknown instead of being invented.
- CRM cache isolation now includes authenticated actor ID in the existing `crm-tasks` key and requires actor + company before querying. Prefix invalidation behavior is unchanged. This is cache isolation, not new server authorization enforcement.
- Returning to Today always re-reads recorded state, and refreshing hides previous snapshot conclusions until the read finishes. Existing task mutation/notification semantics are unchanged.
- Bounds follow repository schema evidence: property booking dates and operational scheduled_date are DATE; CRM due_date is timestamptz. Booking predicates use civil dates; CRM uses next-Bangkok-midnight-exclusive to include sub-millisecond timestamps. Evidence: migrations `20260111050423_8e404144-a882-48e6-b082-44bd1158e68e.sql:9–10`, `20260122092624_eaddabb6-641f-4470-ae49-e1223914dbe6.sql:198`, `20260220112707_4dc62613-5cb6-4ae9-87f8-0a1987dc4d4f.sql:131`. This is repository evidence, not a live schema check.

## Verification actually executed

All commands ran locally against synthetic/stubbed data. Network-denying preload: `NODE_OPTIONS='--require ./scripts/qa/local-network-only.cjs'`.

- Six focused Vitest files: **142/142 passed**.
  - `src/hooks/__tests__/pmsFlow.integration.test.tsx`: 35
  - `src/hooks/__tests__/pmsToday.test.ts`: 6
  - `src/lib/__tests__/hotelDates.test.ts`: 18
  - `src/pages/mc/operations/__tests__/PmsTodayPage.test.tsx`: 27
  - `src/components/owner/tasks/__tests__/UnifiedTaskHub.navigation.test.tsx`: 43
  - `src/test/navigation/mcIntentRoutes.test.tsx`: 13
- Hotel date + real-hook synthetic suites passed **53/53 in each** of `UTC`, `Asia/Bangkok`, `America/New_York` (159 timezone executions). Includes actual preparation-source projection, all closed statuses, exact source identity, future/foreign exclusion, all four source failures/truncation, stale-refresh suppression, missing scope, company switch and same-company actor cache switch.
- Focused ESLint: exit 0, no errors; 16 existing `any` warnings in the retained Hub/CRM writer code.
- `git diff --check`: pass.
- `node --check scripts/qa/today-ui.mjs`, Python syntax compilation and `node scripts/qa/today-ui.mjs --bundle-only`: pass. Real Today JSX/CSS compile with synthetic data and poisoned production imports; no browser/server/app/auth boot required.
- `npm run build`: prebuild validators passed with the existing catalog-life-map warning (orphan situations: management_company, vendor_onboarding). Vite transformed 6,921 modules, then was killed at chunk rendering (exit 137). Generated version/MCP files were restored; no generated backend changes retained. **Full build not passed.**
- Full `tsc -b --noEmit`: default heap exhausted; resource-increased run was killed (137) before diagnostics. **Typecheck unverified; no repeated attempt after the parent stop.** Central CI remains the type/build gate.

No local Chromium/DevTools launch was attempted. Prior environment restrictions were honored. Browser screenshots and viewport assertions remain **unexecuted**; no visual-pass claim.

## Central CI follow-through

Existing `.github/workflows/connected-system-check.yml` invokes `scripts/qa/today-ui.mjs`. The adapted harness prepares EN/RU/TH × 375/390/430/1280 × populated/empty/loading/error/no-properties/truncated-with-stale-data/long-task-titles = **84 planned state checks**. It asserts task source/id/company/return query/hash, task-first order, keyboard routing, focus, minimum control bounds and overflow. It denies all external requests and does not boot destination task editors or prove RLS.

Central command: `NODE_OPTIONS='--require ./scripts/qa/local-network-only.cjs' node scripts/qa/today-ui.mjs`.

Gate: isolated implementation/test evidence is ready for integration review; build/typecheck, actual browser execution and screenshot inspection must pass in central CI before a broader acceptance claim. No remote push, PR, merge or deployment was performed by this task.

## Follow-up: missing exact-count metadata

The initial implementation detected over-limit rows and known count/loaded-row mismatches, but allowed a missing requested exact count when ≤200 rows arrived. That is insufficient evidence of completeness: a server-side row cap could be lower. The follow-up exposes `countUnavailableSources` separately from proven `truncatedSources` and withholds all snapshot projections for either condition. EN/RU/TH warning text now covers both incomplete records and unverifiable completeness without asserting that an unknown result definitely exceeded a limit.

The synthetic adapter now returns an explicit exact count by default and can independently omit it. Added eight hook regressions (four sources × null/omitted count), including empty and populated responses, and three language-specific stale-data suppression cases. Final six-suite aggregate: **153/153 passed** (hook integration 43, unit derivation 6, dates 18, Today page 30, Hub 43, create-intent 13). Focused lint of changed files, browser-free bundle/CSS compilation and `git diff --check` passed. No browser, full-build/typecheck retry, production operation, scope-guard expansion, or writer change in this follow-up.
