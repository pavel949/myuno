# Calendar date correctness — Tranche 2C.1

Baseline: accepted Calendar UX `1438b1d471cd11c239fb60c1677490659c7679c1`.
This tranche changes date interpretation only; no visual classes, hierarchy,
controls, routes, status predicates, pricing rules, payment logic or DB writers
are redesigned. No production bookings/tasks were written.

## Canonical semantics

- Occupied nights: `check_in <= day && day < check_out`.
- Overlap: `existing.check_in < requested.check_out && existing.check_out > requested.check_in`.
- Checkout may be displayed as a departure event, but is not an occupied night.
  The existing day sheet already supports a Check-out marker. It now distinguishes
  events from occupancy for its Book/Block actions. Both calendar projections
  retain departures as event metadata, with bars stopping before checkout.
- Task `scheduled_date` and availability `date` are individual civil dates;
  inclusive task/block-picker ranges are not stay intervals. Block-picker ranges
  become `[from, to+1)` only for conflict comparison.
- CTD and pricing restrictions remain untouched. A free checkout night does
  not override restrictions evaluated elsewhere.

## Proven defects corrected

1. Single-grid selected-day lookup included checkout and the day sheet treated
   every event as occupied, suppressing booking on a departure-only date.
2. Booking bars/labels/details parsed date-only values with `new Date(string)`:
   UTC midnight becomes the previous civil date in a negative-offset browser.
3. Portfolio bars subtracted milliseconds then floor/ceil rounded; UTC parsing
   versus local midnight added an occupied cell in Bangkok, with DST risks too.
4. Hook day lookups serialized local date-picker values through `toISOString`,
   moving Bangkok midnight to the previous date. Month lookup included departure
   at the first day and missed last-day arrivals in some timezones.
5. Availability reads parsed date-only rows as UTC dates; blocked/overridden
   entries could render on the wrong day.
6. Booking/block-form conflicts mixed UTC booking dates and local picker dates;
   checkout picker disabled the next booking's arrival date although it need not
   be an occupied night of the proposed stay. It now checks the proposed interval
   and blocked nights, not checkout itself.
7. Calendar anchors, defaults, highlights and Today task filters used browser
   today, rather than Bangkok today. Date-only task/detail labels could shift.

## Shared helper and exact runtime files

Extended `src/lib/hotelDates.ts`, retaining `bangkokTodayISO` as the only timezone
authority. Local `parseISO`/`format` carriers preserve picker civil fields;
`addDays` and `differenceInCalendarDays` avoid fixed-millisecond arithmetic.
`civilStaySpan` is shared by weekly and portfolio bars. Separate
`stayOccupiesDate` and `stayHasDayEvent` prevent departure/occupancy conflation.
These Date carriers must not be serialized as instants or fed timestamp fields.

Runtime files corrected:

- `src/lib/hotelDates.ts`
- `src/pages/owner/OwnerCalendar.tsx`
- `src/components/owner/AirbnbCalendarGrid.tsx`
- `src/components/owner/MultiPropertyTimeline.tsx`
- `src/components/owner/CalendarDayEventsSheet.tsx`
- `src/components/owner/BookingDetailSheet.tsx`
- `src/components/owner/LegacyTaskDetailSheet.tsx`
- `src/components/owner/CalendarTodayTasks.tsx` (date input only, no Today UX)
- `src/components/owner/CreateServiceTaskDialog.tsx` (date defaults/shortcuts only)
- `src/components/owner/AddBookingFromCalendarDialog.tsx` (date conflict/picker only)
- `src/components/owner/BlockDatesDialog.tsx` (date conflict only)
- `src/hooks/usePropertyBookings.ts` (calendar read helpers only; mutations untouched)
- `src/hooks/usePropertyAvailabilityManagement.ts` (read mapping only)
- `src/hooks/useOperationalTasks.ts` (today helper only; query/writer unchanged)

Support files: `AGENTS.md`, `roadmap.md`, this report;
`src/lib/__tests__/hotelDates.test.ts`,
`src/components/owner/CalendarDayEventsSheet.test.tsx`,
`src/hooks/__tests__/calendarDates.test.tsx`,
`scripts/qa/calendar-ui.mjs`, `scripts/qa/calendar-ui.py`.

## Tests and checks

- Focused date tests: **22/22 in each of UTC, Asia/Bangkok, America/New_York**
  (66 executions). Covers 10→13, one night, adjacent stays, January/year
  boundaries, leap day, DST crossing, weekly/portfolio agreement, local
  availability/task keys, Bangkok midnight, departure-only Book action,
  back-to-back departure/arrival and real hook day/month helpers.
- Existing inventory-status and MCBookings regressions: **28/28 passed**.
- Isolated real-page browser matrix: **24/24** = 3 timezones × RU/EN ×
  375/390/430/1280. Checkout event visible and `occupied=false` in both grids;
  scope, navigation, booking/task/detail/create boundaries still pass, no page
  overflow, no runtime errors or external requests. Hooks/dialog boundaries
  use synthetic stubs; no business success is inferred from them.
- Automatic preview build **OK**; `git diff --check` passed.
- Reviewed EN 390 portfolio screenshot; prior layout preserved. Browser screenshots
  under `/tmp/browser/calendar-isolated` are overwritten by the final TZ pass.
- No manual build/typecheck or full-suite result claimed; thresholds unchanged.

## Read-only backend evidence and remaining risks

Live catalog SELECTs confirm `property_bookings_no_overlap` uses
`daterange(check_in, check_out, '[)')`, dates-valid CHECK is `check_out > check_in`,
and the release-status predicate is unchanged. `check_property_dates_available`
uses strict half-open comparisons; unavailable-date RPC generates nights only
through checkout minus one and separately returns `checkout_only`. No proven
half-open inconsistency in these live definitions; no migration/RPC changed.

Backend timezone risk remains **unresolved**, not silently repaired:
order `timestamptz::date` conversions in availability RPCs depend on the database
session timezone (observed UTC), not explicit Asia/Bangkok. Existing order adapters
split timestamp strings, and manual booking writers label entered clock times
with `Z`. Their interpretation cannot be changed safely without reconciling the
existing order timestamp contract/data. No affected production order was asserted
or modified; this needs a separate read-only timestamp audit and supervised fix.

Other outside-scope risks intentionally preserved:

- `usePropertyBookings` mutation blocked-date preflight includes checkout (`lte`),
  unlike the form/canonical availability RPC; this is a writer-path defect,
  documented and not modified in this calendar-only correction.
- Lifecycle task writers use UTC today and date-only ISO slicing; guest/owner
  summary helpers elsewhere in the same file and `useTodayOperations` retain
  their old today logic. No unrelated summary/writer changes made.
- Portfolio order fetch overfetches boundary records, but corrected clipped bars
  cannot occupy a boundary-only night. Query/status behavior preserved.
- CalendarSyncManager expiry/sync instants and task completed_at/history remain
  timestamp displays; they must not be mistaken for date-only occupied nights.
- Mounted calendars do not proactively refresh Bangkok midnight; rollover needs
  runtime/lifecycle review. No timer architecture introduced here.

Runtime-only checks: authenticated live shell and real detail/form data, real
restrictions and timestamp reconciliation remain unverified. No submit, block,
task completion, sync or payment against production was attempted.

Today and all other UX tranches remain unstarted.