# Tranche 2C — Calendar UX simplification

## Runtime files

- `src/pages/owner/OwnerCalendar.tsx`: full wrapping title; Add Booking is the
  primary action in the existing single-property context, Add Task secondary
  beside property selection. Portfolio retains its existing lack of a direct
  create action. Coherent two-mode control with `aria-pressed`; original
  desktop/mobile defaults retained. Single-property selection uses Select,
  with the full current name below. Portfolio keeps its original group filter,
  shows property count and the full active-filter label. iCal remains collapsible.
- `src/components/owner/MultiPropertyTimeline.tsx`: date controls stack with
  the period on phones, Today is 44px, horizontally scrolling dates are an
  explicitly bounded/focusable region. Original 180px labels/44px days retained.
  Mobile rows are taller to separate booking bars from task targets; verification
  initially reproduced a task click intercepted by the booking bar. Day cells
  no longer nest a native button inside another native button. Keyboard booking
  activation reaches the same detail state; full booking/status/date labels
  and property titles available accessibly. Existing colors/legend preserved.
- `src/components/owner/AirbnbCalendarGrid.tsx`: bounded wrapping month label,
  labelled day cells, focus states and keyboard booking activation via the
  existing day-events boundary. No new date navigation state or Today action.

MCBookings and shared design controls are unchanged. No Today, Homes, Stay 360,
identity, finance, permission, schema, backend or writer changes were made.

## Preserved contracts

Data hooks, queries, group predicates, defaults, date calculations, pricing,
availability, booking/task status semantics, event data and writer callbacks
are retained. New keyboard access changes only activation presentation:
portfolio booking → BookingDetailSheet, task → TaskDetailSheet; single booking
→ existing CalendarDayEventsSheet. Add Booking/Task use their original dialogs
and original property/date props. No successful mutation was fabricated.

## Isolated QA

`scripts/qa/calendar-ui.mjs` bundles the actual page and both calendar bodies,
with synthetic property/project/booking/task hooks. Queries return empty overlay
fixtures; database and task writers throw. Creation/detail/day-events, Today
tasks and iCal boundaries are stubbed. Browser requests are intercepted to serve
only generated local assets; no session, production record or external request
is used. Artifacts live in `/tmp/browser/calendar-isolated`.

Run `node scripts/qa/calendar-ui.mjs` against the running preview (CSS only).
RU/EN × 375/390/430/1280: **8/8 passed**. Initial mode, mode switching, property
selection, group filtering/count, previous/next month, previous/next/Today
portfolio period, booking/day-events and task detail, Add Booking/Add Task
boundaries passed. No document overflow, out-of-viewport non-grid controls,
runtime errors or external requests. Grid scrolling is intentionally local.

Existing MCBookings isolated regressions: **12/12 passed**.
Automatic preview build: **build OK**; whitespace checks passed. No manual
build/typecheck or full-suite claim is made.

Reviewed screenshots: `ru-375-single.png`, `en-390-portfolio.png`,
`ru-1280-portfolio.png`. They show complete heading, bounded scope/date/mode
controls and existing booking/task projections. Full active-filter label added
after the first screenshot review to avoid relying on a truncated Select value.

## Runtime-only limits and separate risks

- Real detail/creation/sync dialogs, their data, notifications and mutations
  remain untested here; authenticated shell and production-scale portfolios
  need read-only review. Boundary stubs prove dispatch, not business success.
- Existing single-view event selection includes checkout, while booking spans
  use exclusive checkout. Documented risk only: no date predicate changed.
- Existing date-only `new Date` parsing and timeline millisecond offsets need
  a separate timezone review; no silent correction in this presentation tranche.
- Single mode has previous/next month only; portfolio has previous/Today/next.
  This difference is retained rather than introducing new date behavior.
- Existing legends/status mappings are retained, not certified as a new
  inventory source of truth or restyled into new status meanings.

## Next recommendation

Today UX is the next smallest controlled tranche after read-only review of the
live Calendar shell: prioritize arrivals/departures/task hierarchy only, retaining
the existing data/writers and separate booking/detail boundaries. Not started.