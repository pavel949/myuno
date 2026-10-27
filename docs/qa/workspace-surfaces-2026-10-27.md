# MC operational workspace: local visual tranche

Base main `046663d895ccdc4beedacaa436e6e7044938895b`; branch `codex/premium-workspace-surfaces-20261027`. Local only: no push/PR/merge/deployment. Predecessor branches37dd479,2ccaa8a,93c87c5 remain independent and unchanged.

## Canonical inventory and bounded scope

| Route/component | Existing owner | This tranche |
| --- | --- | --- |
| `MCLayout` over `/mc/*` | `MCGuard` admits the actor/company; `AppLayout`/`NavShell` owns navigation | Scoped MC class and44px sidebar targets. Same workspace variant, owner navigation role and guards |
| `/mc/today` | Existing `usePmsToday` projections | Compact shared workspace frame/header, retained useful task/attention/stay hierarchy. Unknown guest count is omitted rather than invented as1 |
| `/mc/tasks` | Existing `UnifiedTaskHub`, company/property/actor-bound hooks and writers | Shared frame/focus/checkbox styling; Thai KPI labels. Existing task query/detail/create behavior retained |
| `/mc/bookings-list` | Existing property-order projection and guarded actions | Shared frame and compact toolbar/cards, primary Thai UI/status labels, validated discrete status/sort/direction query state |
| `/mc/bookings` | Existing replace redirect | Unchanged redirect to `/mc/bookings-list` |
| `/mc/calendar` | Existing allowed-property selection and calendar widgets | Entry frame/header and Thai primary controls; distinguish failed property read from empty/unavailable selection; preserve selected query on retry |

The root `/mc` dashboard, `/mc/operations`, other management modules, financial pages and admin/workspace families are not fully migrated or accepted here. Calendar grid/editor engines and booking rules are unchanged. Task-type dictionaries and nested calendar/editor localization retain existing fallback behavior; this is not a claim that every nested widget is fully translated.

## Preserved contracts and dependencies

- No auth/RBAC/RLS/schema/data/writer/financial/inventory changes. Half-open stays, status semantics, totals/currencies, payment authority and allowed property scopes are untouched.
- Booking controls only interpret existing display-filter values from explicit allowlists. Query changes replace history, preserve unrelated query keys and location state. Free guest search remains local and is not added to shareable URLs; it intentionally resets on a fresh mount/reload. Selection and mutation state are not restored from URLs.
- Existing `propertyBookingStatus` receives Thai labels only. Unknown states remain unknown/outline; no new statuses or writer transitions.
- The calendar read-error UI hides creation controls and offers the existing refetch; it does not broaden property selection or substitute an empty read for success.
- Checkbox targets remain44px, with a compact visual box; native `[hidden]` controls are excluded from the display rule. No style unquarantines an access boundary.
- Uses existing workspace96rem, gutter, type and touch-target tokens. No dependency on unpublished predecessor branches. Shared dependencies to review on later integration: MCLayout, UnifiedTaskHub/TaskSummaryKPIs (also used by owner routes), display-only propertyBookingStatus, and the selected page roots. No shared global shell/guard rewrite.

## Validation

-132 tests/6 files PASS: Today, bookings, task navigation/scope transitions, calendar/rates navigation, role-guard verification and NavShell accessibility. New regressions cover unknown guest count, nonsecret query state/guest-search exclusion and calendar read-error retry.
- Typecheck PASS. Full lint0 errors/2460 warnings. Earlier lint rejected a conditional expression in the new URL handler; it was replaced with ordinary `if/else`, without changing checks.
- Production build7117 modules,1m46s PASS. Design audit4128 findings,0 new/structural,153 resolved baseline entries; baseline unchanged. Generated MCP/version artifacts excluded.
- Isolated Chromium:59 checks — Today, booking list, calendar entry, task hub and real SideRail/TopBar sampled with the tools directory;320/390/430/768/1440/1920, EN/RU/TH primary UI, empty/loading/error and discrete filtered reload. Final10 captures recheck corrected Thai/checkbox/error styling.
- Additional accepted interactions: calendar read-error Retry with creation hidden;44×44 checkbox selection without opening booking details; booking-detail boundary open/close; actual task-create modal open/Escape/reopen/Escape; keyboard/reduced-motion pass. Runtime errors0.

Browser evidence is an isolated component harness, not an authenticated SPA or live operational acceptance. Actual pages/shell components are bundled with synthetic auth/data hooks; nested booking/calendar/task-detail editors have explicitly mocked boundaries. Production backend imports are blocked by the harness and external traffic is aborted. Existing role/actor/company checks are exercised in isolated unit tests, not certified as deployed RLS or full real-role workflows. No task, booking, payment or other business record was written.

Harness source and fixtures remain outside the production graph under `/workspace/myuno-ui-evidence/workspace-harness-source`; temporary repo scripts were removed. Screenshots/results: `workspace-surfaces-20261027` and `workspace-surfaces-final-20261027` under the same evidence directory. Scripts/logs in `/tmp`. No Library transfer retry, new assets or externally published preview. Localhost is not a user-accessible live preview.
