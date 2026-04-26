## Goal

Make every booking — across `bookings`, `vendor_bookings`, and `property_bookings` — show a complete, trustworthy status timeline (current status + every transition with timestamp, actor, and optional note) on every surface where users, partners (vendors), and staff (MC/admin) view that booking.

## Current state (verified)

- `booking_status_history` table exists and is wired into `/bookings` (user list, `Bookings.tsx`) with realtime + module cache. 
- `BookingDetail.tsx` (user-facing single booking) **does not show** the timeline — only the current status badge.
- `vendor_bookings` (used by `VendorBookings.tsx`, `useVendor.updateBookingStatus`) has a `status` column but **no history table and no trigger** — transitions are lost.
- `property_bookings` (used by `MCBookingsPage.tsx`, `BookingDetailSheet`) has a `status` column but **no history table and no trigger**.
- No Postgres trigger auto-records transitions on `bookings` either; only the user-cancel code path inserts a row, so partner/staff status changes via `vendor_bookings` or direct updates would not appear.

## Plan

### 1. Database — make history automatic and complete (single migration)

- Create `vendor_booking_status_history` and `property_booking_status_history` tables (mirroring the shape of `booking_status_history`: `id`, `booking_id`, `from_status`, `to_status`, `changed_by`, `notes`, `created_at`), with FK + ON DELETE CASCADE.
- Add `BEFORE UPDATE` triggers on `bookings`, `vendor_bookings`, `property_bookings` that insert a row into the matching `*_status_history` table whenever `OLD.status IS DISTINCT FROM NEW.status`. `changed_by = auth.uid()`.
- Backfill: insert one synthetic “created” row per existing booking from each table where no history exists (so timelines are not empty for legacy data).
- RLS:
  - `vendor_booking_status_history`: SELECT for the booking’s `user_id` AND for vendor staff via existing vendor membership pattern; INSERT only via trigger (no client policy).
  - `property_booking_status_history`: SELECT for property `owner_id`, MC team members (existing helper), and the booking’s linked guest user; INSERT only via trigger.
  - Keep existing `booking_status_history` SELECT policy; **add** a SELECT policy for vendors/staff who own the related service so partners can see the same timeline.
- Enable Realtime publication on the two new tables.

### 2. Generalize the timeline component

- Keep `BookingStatusTimeline` (already solid). Extend `STATUS_CONFIG` with the few statuses used by `vendor_bookings` / `property_bookings` that are missing (`checked_in`, `checked_out`, `no_show`).
- Extract a small `useBookingStatusHistory({ table, bookingId })` hook (in `src/hooks/useBookingStatusHistory.ts`) that:
  - Fetches rows from the appropriate `*_status_history` table.
  - Subscribes to realtime INSERTs filtered by `booking_id`.
  - Exposes `events`, `isLoading`, `error`, plus the same dedup behaviour already used in `Bookings.tsx`.
  - Reuses the existing module cache pattern (parameterized by table).

### 3. User surface — `BookingDetail.tsx`

- Replace the single status card with a “Status” section that renders `BookingStatusTimeline` driven by `useBookingStatusHistory({ table: 'booking_status_history', bookingId })`, seeded with `currentStatus` and `createdAt`.
- Remove the manual `booking_status_history` insert in `handleCancel` — the new trigger covers it. Keep the optimistic UI update.

### 4. Partner surface — `VendorBookings.tsx` (+ detail sheet)

- In the row/expanded view (or open a Sheet on tap), render `BookingStatusTimeline` from `vendor_booking_status_history`.
- Drop the manual write that would otherwise be needed in `useVendor.updateBookingStatus` — the trigger handles it; just keep the existing `update({ status })`.

### 5. Staff surface — MC / Admin

- `BookingDetailSheet` (used by `MCBookingsPage.tsx`): add a “History” section rendering the timeline from `property_booking_status_history`.
- `AdminOperations.tsx` booking drill-in: same timeline component, choosing the table from the booking source.

### 6. Tests & QA

- Vitest: a test for `useBookingStatusHistory` covering initial fetch, realtime INSERT merge, and dedup.
- Manual QA matrix (documented in `docs/audits/`):
  - User cancels → user, vendor, and MC views all see the new row in <2s (realtime).
  - Vendor confirms in `VendorBookings` → user’s `/bookings` and `BookingDetail` show it.
  - MC marks `checked_in` in `MCBookingsPage` → guest sees it in `BookingDetail`.

## Out of scope

- Editing the auto-generated `src/integrations/supabase/types.ts` (regenerated automatically after migration).
- Refactor of `Bookings.tsx` realtime code — already correct; only switch its fetch through the new hook in a follow-up.
- Order timeline (`order_status_history`) — already covered by `useOrderTracking`.

## Technical notes

- Trigger function pattern (one shared `record_status_change()` plpgsql function parameterized by `TG_ARGV[0]` for the target history table name) keeps the migration small.
- `changed_by` falls back to `NULL` when `auth.uid()` is null (e.g., service-role webhook updates) — UI already handles missing actor.
- All new policies use existing helpers (`is_mc_team_member`, vendor membership) — no new security definer functions needed.
- Realtime channel naming: `bk-history-${table}-${bookingId}` to keep per-page subscriptions tight.
