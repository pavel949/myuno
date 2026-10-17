# Booking writer date correctness — Tranche 2C.2

Baseline: `3f710885f581ac21e772098eab412ca9d6f1e218`.
Scope: proven blocked-night preflight corrections and read-only timestamp audit.
No UX, pricing, payment, status, permission, CRM, inventory release predicate,
exclusion constraint, migration or historical row change. No real submissions.

## Proven defect fixed

`usePropertyBookings.createBooking` and `updateBooking` both fetched blocked
availability with `date >= check_in AND date <= check_out`. Both now use
`date >= check_in AND date < check_out`. A block on checkout alone no longer
rejects the preceding stay; an occupied-night block still rejects it.

The runtime diff consists of exactly two `.lte('date', …)` → `.lt('date', …)`
changes in `src/hooks/usePropertyBookings.ts`. DATE strings are passed unchanged;
no additional timezone conversion is needed. CTD/CTA remain separate. Nothing
else in the writer, including timestamp construction and query error behavior,
was changed.

## Timestamp contract evidence

### Live schema/catalog (read tools, SELECT only)

- `orders.start_at/end_at` and `order_items.start_at/end_at`: timestamptz.
- `property_bookings.check_in/check_out`: DATE.
- `create_order_atomic`: accepts timestamptz, persists parent parameters
  unchanged, casts item strings to timestamptz and copies metadata; no timezone
  normalization. `create_order_checked` forwards to it after actor/amount checks.
- `check_property_dates_available`: blocked dates are half-open, booking overlap
  is strict; order dates use `o.start_at::date` / `o.end_at::date`.
- `check_property_availability`: wrapper around that RPC.
- `get_property_unavailable_dates`: order conversion and range clipping use
  `(o.start_at::timestamptz)::date` and matching end casts; occupied nights end
  before checkout; departure-only metadata remains separate.
- `trg_sync_order_to_property_booking`: derives dates using session-dependent
  parent timestamp casts; enabled `sync_order_to_property_booking` on orders.
- `trg_sync_order_item_to_property_booking`: enabled on items; touches the parent
  order to reuse order sync. It does not normalize item dates independently.
- `create_property_booking_from_order`: explicitly converts with
  `AT TIME ZONE 'Asia/Bangkok'`; its order trigger also remains enabled. Thus
  two live booking producers disagree at timestamp date boundaries.
- `trg_release_availability_on_order_cancel`: item/parent coalesced timestamps
  cast to session dates, with an inclusive `WHILE v_current <= v_end_date`.
  This release path is documented only; changing it could affect historical
  lock ownership and is not part of a timestamp conversion under uncertainty.
- `assign_room_for_category` and `get_category_availability`: DATE predicates,
  strict stay overlap and checkout-exclusive blocked/booked dates.
- `trg_lock_availability_on_property_order`: no matching live function returned;
  absent from the attached order/item trigger inventory. Its historical SQL is
  not evidence of a currently active writer.
- Catalog search for timestamp/date casts additionally returned
  `check_yacht_availability`, outside accommodation scope and unchanged.
- Observed database session timezone: UTC. No function override to Bangkok in
  the inspected availability/sync definitions.

### Safe production aggregates — no personal data or row payloads

At audit time: 391 property-vertical orders, 390 with start timestamps.
UTC-vs-Bangkok start-date and end-date disagreements: **0 / 0**. Source/clock
groups: 387 iCal orders and 1 Agoda order at 14:00/12:00 UTC; 2 unspecified-source
orders at 06:58 UTC with null end; 1 unspecified undated order.
93 property items; none had `metadata.check_in` or `metadata.check_out`;
UTC/Bangkok item date disagreements: **0 / 0**.

These counts do not establish intended wall times, valid stay intervals, complete
parent/item reconciliation or future correctness. PostgreSQL stores an instant,
not the original offset spelling: current rows cannot prove whether a producer
originally sent `Z` or `+07:00`. No broad data export or personal sample was used.

### Source writers/readers inspected (deployment parity not asserted)

- `src/hooks/usePropertyBookings.ts`: create/update append `Z` to date-only
  input plus a user wall time; default timestamps are 14:00Z/12:00Z; checkout
  metadata defaults to 11:00. Reader `mapOrderToBooking` splits at `T`.
- `src/hooks/useMultiPropertyBookings.ts`: portfolio adapter splits parent
  timestamps at `T`. `src/hooks/useOrders.ts`: Date inputs become `toISOString`,
  string inputs pass through unchanged.
- `supabase/functions/create-property-deposit-checkout/index.ts`: parent/item
  stay boundaries 14:00Z/12:00Z, via `create_order_atomic`; occupied-night pricing
  override reads are already `< check_out`. Restriction reads include checkout
  intentionally for CTD and were not modified.
- `supabase/functions/stripe-webhook/index.ts`: resolves existing checkout
  order via session order_id; no independent timezone normalization.
- `supabase/functions/ical-scheduled-sync/index.ts`: truncates DATE-TIME event
  text to written dates, manufactures 14:00Z/12:00Z order/item boundaries.
- `supabase/functions/ical-sync/index.ts`: DATE/DATE-TIME text reduced to civil
  strings and written directly to booking DATE fields.
- `supabase/functions/calendar-export/index.ts`: booking DATE values exported
  as `DTSTART/DTEND;VALUE=DATE`, preserving exclusive checkout. Other export
  date arithmetic was not changed.

Historical definitions inspected for provenance, **not rewritten**:
`supabase/migrations/20260119042142_c1535ed5-ce1d-455e-aa79-81a5b1b7de1e.sql`,
`20260111050423_8e404144-a882-48e6-b082-44bd1158e68e.sql`,
`20260208121930_ac8db36c-2587-4313-a47f-f5ff46232cd3.sql`,
`20260225151030_0ed97e09-0b73-49dc-8af8-deb6a244bce3.sql`,
`20260311180000_booking_lock_and_conflicts.sql`,
`20260314004525_f9886457-9613-4f5d-b08f-d7f9b0ff6048.sql`;
`drizzle/migrations/0019_canonical_inventory_status_predicate.sql` and
`0020_preserve_property_booking_lifecycle_status.sql`.
Live catalog definitions take precedence over migration text.

## Safety decision: no SQL conversion or timestamp write change

Accommodation intent is civil-date based, but actual persistence has no enforced
single timezone contract: synthetic midday-Z boundaries, arbitrary Date/instant
inputs, truncated iCal events, UTC readers/sync and Bangkok legacy sync coexist.
14:00Z means 21:00 Bangkok, not 14:00 Bangkok; midday hides date disagreement.
Changing all casts to Bangkok without changing provenance could move an intended
late civil date forward. Changing all new writes to +07 without coordinated
readers could move midnight/early boundaries backward in UTC consumers.

Therefore **stop short of timestamp-semantic changes**. No migration, function
deployment, new-write offset change, timestamp backfill or metadata rewrite.
SQL fixtures prove risk at Bangkok midnight and for 23:00 mislabeled Z; they
do not establish which interpretation a historical row intended.

## Tests/results

- `src/hooks/__tests__/bookingWriterDates.test.tsx`: **23/23** per timezone:
  10 cases × actual create/update mutation preflight, plus 3 timestamp risks.
  Tests execute the real preflight and stop at a throwing synthetic insert/update
  boundary: reaching it means preflight acceptance, **not successful booking**.
  Database client/auth/query hooks are replaced; no network or production writer
  is imported. Cases cover adjacent 10→13 / 13→15, checkout/occupied blocks,
  one night, month/year/leap boundaries, occupied overlap; results match shared
  `stayOccupiesDate`, `occupiedCivilDates`, `civilStaysOverlap`.
- Retained calendar/date/inventory files: hotelDates (16), day-events (3),
  calendar hook dates (3), inventory (16): combined **61/61 in UTC,
  Asia/Bangkok, America/New_York — 183 executions**.
- `scripts/qa/booking-writer-dates.sql`: synthetic VALUES/SELECT only;
  **7/7 SQL predicate cases** passed against the database without invoking RPCs;
  4 timestamp fixtures demonstrate the expected UTC/Bangkok divergence. This is
  evidence for copied live predicates, not end-to-end RPC execution.
- Automatic preview build OK after correcting an initial test API mismatch;
  `git diff --check` passed. No manual build/typecheck, threshold lowering,
  full-suite or real authenticated booking-success claim.

## Exact changed files

1. `src/hooks/usePropertyBookings.ts` — two blocked-date upper bounds only.
2. `src/hooks/__tests__/bookingWriterDates.test.tsx` — isolated real preflight tests.
3. `scripts/qa/booking-writer-dates.sql` — read-only predicate/timestamp fixtures.
4. `docs/convergence/BOOKING_WRITER_DATE_CORRECTNESS.md` — this evidence/decision.
5. `roadmap.md` — controlled tranche checklist.

## Remaining blockers and supervised strategy

1. Approve an accommodation contract separating authoritative civil DATE keys
   from actual arrival/departure instants and explicitly naming Asia/Bangkok.
2. Read-only reconciliation by producer/version cohort: source clocks, original
   iCal VALUE=DATE vs TZID/UTC events, explicit input date metadata where available,
   parent/item/booking agreement and both trigger outputs. Unclassifiable rows
   require manual review; never infer intent merely from stored `Z` output.
3. Prepare additive, reviewed contract rollout and executable rollback, with
   synthetic SQL trigger/RPC tests in isolated storage. Deploy readers, sync and
   new writers together; avoid divergent dual triggers.
4. Backfill only reviewed cohorts with old/new date evidence and rollback values;
   no blanket ±7-hour shift. Preserve exclusion constraint and release statuses.
5. Review custom-time writer overlap separately: it compares timestamp instants,
   so unusual departure/arrival clocks can reject civil-date adjacent stays.
   Tests here establish adjacency for existing 12:00/14:00 defaults, not arbitrary
   clocks. Resolve with the approved contract, not a hidden timestamp rewrite.
6. Authenticated live submission, availability race behavior, deployed edge-source
   parity and real iCal timezone reconciliation remain unverified. No real booking,
   payment, cancellation, sync or task submission was attempted.

Today and all other UX work remain unstarted.