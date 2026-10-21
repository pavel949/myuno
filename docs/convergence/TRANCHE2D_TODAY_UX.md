# Tranche 2D — Today UX simplification

Date: 2026-10-17. Baseline: `9098a3c13a3be94e9dc842ba6e631b8195b011c5`.
Verified runtime/test revision: `ebea8cf31ac4bd542c3c69a2f1ecb1f7e9676e4a` (before this report/checklist).
Authority: [Connected Product Blueprint](../canonical/MYUNO_CONNECTED_PRODUCT_BLUEPRINT.md), [UX Foundation Audit](UX_FOUNDATION_AUDIT.md).

## Exact changed files

**Only runtime file:** `src/pages/mc/operations/PmsTodayPage.tsx`.
No shared runtime components changed.

Supporting files:
- `src/pages/mc/operations/__tests__/today.fixtures.ts`
- `src/pages/mc/operations/__tests__/PmsTodayPage.test.tsx`
- `scripts/qa/today-ui.mjs`
- `scripts/qa/today-ui.py`
- `docs/convergence/TRANCHE2D_TODAY_UX.md`
- `AGENTS.md` — isolation boundary rule, not a domain decision.
- `roadmap.md` — scoped checklist.

## Confirmed source facts (unchanged)

| Source | Contract / evidence |
|---|---|
| `src/hooks/usePmsToday.ts:20–49` | Booking fields: guest, phone, property, dates, count, source, status. Request fields: type, priority, status, guest, description, scheduled/created timestamps. Units: property, title, derived state, optional booking. |
| `usePmsToday.ts:53–60,75–105` | Existing active booking/open request sets, cleaning/maintenance regexes, Phuket date helper, property scope and query limits retained exactly. No new hook, API or joins. |
| `usePmsToday.ts:107–110` | Booking/request errors throw; CRM task errors are suppressed by the existing hook. |
| `usePmsToday.ts:114–148` | Existing arrivals/departures/in-house definitions unchanged, in-house excludes checkout date. Unit-state precedence remains maintenance > occupied > dirty > clean. |
| `usePmsToday.ts:150–158` | Page receives arrays, title lookup, hasProperties, aggregate isLoading, query error and refetch. Raw task records are NOT exposed. |
| `src/hooks/useMyProperties.ts:161–209` | Active-property projection retained; no separately exposed property-source error for Today. |
| `src/pages/owner/ServiceRequest.tsx:368–378` | Existing request priority choices include high and urgent. No AI/age-derived urgency. |
| `src/components/layout/routes/mcRoutes.tsx:34,47–50,99` | Existing property detail, Today, Calendar and Tasks destinations. |
| `src/lib/config/routes.ts:446–447,459,469` | APP_ROUTES constants reused; no new route or shell. |
| `src/pages/owner/OwnerPropertyDetail.tsx:310–333` | Property detail already includes service requests under its Operations tab. Today links open the property, not a falsely promised request/booking-specific detail. |

## Before / after

Before: four KPI tiles repeated list counts; arrivals, departures and in-house were similarly framed panels; unit board preceded guest requests; calendar/tasks were full outlined buttons at the bottom. Long metadata was truncated without full titles. Query error alert could coexist with empty/zero projections.

After:
- One H1 and existing Bangkok-context date, with restrained Calendar / Tasks / Refresh utilities.
- First section: **Needs attention**, partitioning existing guest requests by explicit `urgent` / `high` priorities, then existing maintenance and dirty unit states. These are recorded signals, NOT verified blockers/readiness.
- Routine arrivals/departures/in-house retain their exact arrays and counts; dates, status and source are visible alongside guest/property/count. No arrival/departure is assigned invented urgency.
- Other open guest requests follow; total request count still includes prioritized requests, which appear above exactly once.
- All units and exact per-state counts remain available below. The `clean` label no longer promises verified readiness: the original state derivation is unchanged and explicitly qualified.
- Booking/request/unit rows navigate to existing property detail. Phone remains a separate sibling action. No new state-changing action, confirmation or permission logic.
- Long names wrap; descriptions clamp to two lines with complete title text. Status text is not color-only. Named links, heading hierarchy, visible keyboard focus and >=44px controls.
- Existing error suppresses data projections, including stale fixtures; loading and no-properties remain distinct. No invented errors or global “all clear”.

## Signals deliberately not fabricated

- **Arrival readiness / departure completion:** no inspection/ready/checkout-action field returned. Keep routine lists; no readiness score or inferred late arrival.
- **Verified housekeeping readiness:** unit state is inferred; open maintenance overrides occupancy, occupied overrides cleaning. An occupied unit may have cleaning work not visible as dirty. No change to precedence or new join.
- **Payment attention:** no balances, amounts or payment records here. Booking `pending_deposit`/`deposit_paid` are displayed only as existing booking labels, not verified payment facts or finance exceptions.
- **Overdue tasks / maintenance severity:** raw tasks are not returned and task query selects no due date or priority. No new task cards, deadline inference, second task system or severity claims.
- **Separate property/task errors:** not exposed, with task errors suppressed upstream. Qualified “recorded signals” cannot establish completeness or successful task access. The page cannot display a truthful independent task error without an explicitly authorized hook change.
- Existing 200-row request/task query limits are unchanged; this tranche does not claim portfolio-wide completeness beyond current data.
- Date-only booking fields have no clock times. The page displays the existing civil date prefix; it adds no timestamp interpretation. Existing Today fixed-offset helper and completed_at query boundary remain untouched; mixed timestamp risks from earlier audits are not reopened here.

## Safe verification results

Commands:

```text
bun run test src/pages/mc/operations/__tests__/PmsTodayPage.test.tsx src/hooks/__tests__/pmsToday.test.ts src/pages/owner/__tests__/MCBookingsPage.test.tsx
# 30/30: Today 12, unit derivation 6, accepted booking-list 12

TZ=<UTC|Asia/Bangkok|America/New_York> bun run test src/hooks/__tests__/calendarDates.test.tsx src/hooks/__tests__/bookingWriterDates.test.tsx src/lib/__tests__/hotelDates.test.ts src/lib/__tests__/propertyInventory.test.ts
# 58/58 in each TZ; 174 executions

node scripts/qa/today-ui.mjs
# 8/8 RU/EN × 375/390/430/1280; five states each (40 rendered cases)

git diff --check
# exit 0
```

Browser checks: urgent/high only in priority section, normal request only in routine section, three unchanged stay projections with dates, item routes, keyboard Enter, visible focus ring, Calendar/Tasks routes, refetch counter, loading/empty/error/no-properties, all control bounds >=44px, no document overflow. Zero attempted external requests and zero runtime errors. Bundler rejects inclusion of the real data hook/client; all data/feedback boundaries stubbed. Browser intercepts local HTML/JS/preview CSS only and blocks all other requests. No app authentication, production query or write executed.

Automatic harness build: latest observed entries report **build OK** after correcting a test-selector typing error. No manual app build/typecheck or lowered thresholds. Read-only review found no proven domain changes. Diff against baseline is empty for `src/hooks`, `src/lib`, `src/components`, owner/calendar pages, schema and backend folders.

Screenshots live under `/tmp/browser/today-isolated/` (test artifacts, not app assets). Reviewed: `ru-375-populated.png`, `en-430-populated.png`, `ru-1280-populated.png`, `ru-375-focus.png`, `ru-375-error.png`, `en-430-empty.png`, `ru-375-units.png`, `en-430-requests.png`. Fixture route output is QA-only, never in the runtime page. Full viewport screenshots intentionally stop at 1800px; element screenshots cover lower sections.

## Runtime-only gaps / next recommendation

Isolated QA proves presentation and existing route dispatch, NOT live guarded destination reachability, real service-request permissions, CRM-task completeness, realtime refresh or operational resolution. Property links intentionally stop at the safe route boundary; no real phone call, booking/task/payment submission or lifecycle transition tested. No claim of complete live operational workflow verification.

**Recommendation:** perform a separately supervised read-only check of Today and property Operations under the requesting operator account, including property/task error visibility and real request labels, before authorizing any broader operational detail tranche. Do not start Stay 360, Homes, Identity/CRM, Finance or Agent work. Historical timestamp-contract and independent CI/payment E2E blockers remain unchanged.