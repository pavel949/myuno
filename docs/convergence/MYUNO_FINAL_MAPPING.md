# myUNO ↔ myUNO-final convergence mapping

Status: Tranche 1 (foundation). Last verified against live code/schema: 2026-10-17.

## 1. Principles

- **myuno (this repo, production DB) is the only canonical production core.**
- **myUNO-final is a donor of UX and workflow patterns only.** No code, schema, or data model is imported wholesale.
- **One Operational Reality:** every business fact (a booking, a payment, a room, a price) lives in exactly one place. New UI reads and writes that place; it never introduces its own copy.
- **Reuse / reconcile before create.** A new table, RPC or service is allowed only when no existing owner can be extended, and the reason is written here.
- **Evidence order:** running code and live schema > migrations > tests > canonical docs > older prose/audits. Old audit findings are not backlog if already fixed in code.
- **No project-name hardcoding.** Layantara (or any resort) is a reference implementation configured through data (property_kind, categories, rate plans), never a branch, flag, slug check or fork.
- **Prohibited duplicates:** parallel PMS, booking model, pricing engine, CRM, ledger, auth/role model, inventory model, notification bus, or resort-specific fork.

## 2. Source-of-truth registry

| Domain | Owner (current myuno) | Notes |
|---|---|---|
| Identity / auth | `auth.users` + `profiles` | Roles only in `user_roles` (`app_role`), checked via `has_role` |
| Contact / CRM person | `crm_contacts` (+ `contact_identities`, `contact_identity_links`) | Leads attach here; no second contact table |
| Project / property (top level) | `properties` (`property_kind` = unit / resort / hotel) | Off-plan projects: `investment_projects` / developer tables |
| Room category | `property_room_categories` | Belongs to parent `properties` row |
| Physical unit / room / villa | `properties` row with `parent_property_id` + `room_category_id` | Keeps calendar, iCal, cleaning, PMS unchanged |
| Pricing (unit) | `properties` price fields + `property_rate_seasons` + `property_availability.price_override` | Computed by `_shared/property-quote.ts` |
| Pricing (category) | `property_room_categories` + `property_rate_plans` + `property_rate_seasons.category_id` + `property_stay_restrictions` | Computed by `_shared/hotel-quote.ts` (mirrored byte-for-byte in `src/lib/hotelQuote.ts`) |
| Availability / inventory | `property_bookings` (exclusion constraint `property_bookings_no_overlap`, half-open `[check_in, check_out)`) + `property_availability` blocks | Category count: `get_category_availability`; assignment: `assign_room_for_category` (service_role) |
| Booking (commercial) | `orders` + `order_items` (+ participants/status history) | `bookings` is legacy; `service_orders` is the active service-request workflow |
| Payment | `payment_intents` (Stripe state) + Stripe webhook | Deposit checkout: `create-property-deposit-checkout` |
| Finance / accounting | `ledger_entries` + `ledger_accounts` | Written only by service_role money RPCs |
| Operations | `property_bookings`, cleaning/maintenance tasks, PMS `/mc/*` | `/mc/today` is the existing ops view |
| Permissions | RLS + `can_manage_property`, `staff_can_access_property`, `is_finance_staff` | No client-side role checks as authority |
| Notifications | `_shared` WhatsApp / email / Telegram helpers, `enqueue_email` | No new notification channel tables |
| Provider ↔ org counterparty | `provider_org_links` | `providers.id` ≠ `orgs.id` |

## 3. Concept mapping

Status legend: ADOPTED (used as-is), ADAPTED (pattern applied onto a myuno owner), REJECTED (would duplicate an owner), SUPERSEDED (myuno already has a better/live equivalent), NOT_REVIEWED (donor source not inspected in this tranche).

| myUNO-final concept | myuno entity | Status |
|---|---|---|
| Resort / hotel project | `properties` with `property_kind` resort/hotel | SUPERSEDED (live) |
| Room type / category | `property_room_categories` | SUPERSEDED (live) |
| Physical room / villa | child `properties` row | SUPERSEDED (live) |
| Rate plan | `property_rate_plans` | SUPERSEDED (live) |
| Seasons / date prices / restrictions | `property_rate_seasons`, `property_stay_restrictions`, `property_availability` | SUPERSEDED (live) |
| Server quote | `_shared/hotel-quote.ts`, `_shared/property-quote.ts` | SUPERSEDED (live) |
| Separate reservation table | `orders` + `property_bookings` | REJECTED |
| Separate guest/contact store | `crm_contacts` | REJECTED |
| Separate ledger / P&L store | `ledger_entries` | REJECTED |
| Agent Workspace | — | NOT_REVIEWED (Tranche 2+) |
| Today / Stay 360 views | `/mc/today`, booking detail | NOT_REVIEWED (Tranche 2+, ADAPTED expected) |
| Owner Portal redesign | `src/pages/owner-portal/` | NOT_REVIEWED |
| Command Center / P&L | — | NOT_REVIEWED |

The myUNO-final repository was not available in this workspace; every donor row marked NOT_REVIEWED must be checked against the donor before adoption.

## 4. Canonical resort booking path (verified 2026-10-17)

```text
properties (resort) -> property_room_categories -> property_rate_plans
  -> seasons / date prices / restrictions (category + resort-wide, merged)
  -> quoteHotelStay (server, authoritative; client total must match ±1 THB)
  -> assign_room_for_category (advisory lock, service_role)
  -> create_order_atomic -> trigger writes property_bookings (exclusion constraint)
  -> inventory hold check (booking row exists or order is cancelled, 409)
  -> Stripe deposit (10%) -> webhook -> ledger
```

- Dates are half-open `[check_in, check_out)`: checkout day is not priced and its stop-sell does not block; CTD is checked on the checkout day, CTA and arrival min-stay on the check-in day.
- Accepted price is stored on the order item (`nightly`, `quoted_total`, `quoted_at`, `rate_plan_id`) and on the order total; later rate edits do not change it.
- The booking page may display a quote from the same shared module but is never the authority.

### Tranche 1 correction evidence (2026-10-17)

**Inventory status contract.** Live `property_bookings.status` is nullable TEXT, not
an enum; no status CHECK is present. Live constraint inspection found exactly one
exclusion constraint, `property_bookings_no_overlap`, with `[check_in, check_out)`
and `status NOT IN ('cancelled','rejected','expired')`. The historical
`property_bookings_no_overlap_active` closed-range constraint is **not live**.
Migration 0018 therefore matches the live constraint; reverting it would restore
a defect, not fix one.

- `property_booking_holds_inventory(status)` is the shared SQL predicate;
  `src/lib/propertyInventory.ts` and `_shared/property-inventory.ts` mirror it.
- All non-null statuses except cancelled/rejected/expired hold their stored date
  range, including pending, completed, checked_out and **no_show**. No-show alone
  does not release a future room: staff must explicitly cancel/release the booking.
  A past date range cannot overlap a future stay regardless of status.
- NULL evaluates to SQL NULL and does not participate in the exclusion constraint;
  live inspection found zero NULL status rows. Cancellation aliases and unknown
  non-null statuses remain conservative holds; no automatic data normalization.
- Money statuses are a separate domain: orders cancelled/refunded/expired or
  soft-deleted map to booking cancelled. Check-in/out/no-show labels are now
  preserved rather than silently mapped back to pending. Expired is allowed as
  booking TEXT but the Stripe expiry writer writes order expired → booking cancelled.
- Unit admission and date-list RPCs now include owner stays and all inventory rows,
  not just commercial orders or channel-linked bookings. Category count and
  assignment use the same predicate. Calendars, owner-stay checks, iCal export,
  overlap diagnostics and pricing occupancy readers follow the contract.
- `property_availability` has available/blocked/booked states. Category assignment
  additionally honours booked calendar rows; unit checks/date lists preserve their
  existing manual-block plus booking/order hold semantics. The old inclusive
  item-lock writer is not bound to a live trigger, so checkout-day locks are not
  currently produced by that writer. No inactive historical migration is rewritten.

**Concurrency — compensation, not atomic allocation.**
`assign_room_for_category` uses `pg_advisory_xact_lock`; PostgREST commits that RPC
and releases the lock before the separate availability and `create_order_atomic`
RPCs. Two assignments can return the same room. Order creation and its item→order
touch→inventory trigger execute in one transaction, but the trigger catches
`exclusion_violation`, records an alert and permits a losing commercial order.
The post-order hold lookup is a compensation guard: only a held order proceeds
to Stripe; a losing order must be cancelled, and cancellation errors/missing rows
now return `inventory_compensation_failed` (500), never a payment session.
No retry/atomic-assignment redesign is introduced in this correction pass.

An isolated PostgreSQL regression uses the repository's real assignment functions,
order RPC body and inventory sync trigger with a minimal temporary schema and
the verified live exclusion constraint. Two committed assignments select one
room, concurrent orders produce one hold and one overlap alert, and the real
pre-payment gate admits one payment **stub** and cancels the loser. This is not
a production race or a real Stripe payment test. Temporary data never reaches
production.

**Drizzle snapshot convention.** `drizzle/schema.ts` is deliberately blank and
`drizzle.config.ts` points to it. All snapshots 0000–0018 are v7 PostgreSQL with
empty tables/enums/schemas; 0018 has the correct 0017 predecessor. These are
tool-generated custom-SQL migration markers, **not production schema dumps**.
Do not hand-edit them or attempt to regenerate a full ORM schema. New migration
metadata is maintained exclusively by the managed migration tool.

**Rollback.** `.sql` rollback files are executable SQL under existing 0017 and
0013–0015 precedents. The 0018 rollback now contains exact pre-0018 function
bodies, with an explicit warning that restoring them restores the mismatch.
Use `0019_0020_inventory_correction.sql` to revert this pass's SQL functions only;
do not revert the unrelated good Tranche 1 checkout/pricing fixes.

**Parity.** The existing hotel-quote parity assertion remains authoritative and
both copies remain byte-identical; a second parity assertion covers inventory
helpers. No pricing engine was added or replaced.

**Unverified / outside this correction.** No production booking/payment or full
guest→Stripe→ledger journey was executed. Stripe failure/abandoned pre-session
hold cleanup, production race load and managed CI typecheck results require
separate evidence. No new UX, inventory model or Tranche 2 work was started.

Quality-gate policy in this workspace forbids manually invoking builds/typechecks;
the harness performs them automatically. Report its actual build log separately,
never label it as a locally run `npm run typecheck` or assign an invented exit code.

## 5. Definition of Done (all tranches)

A change is done only when an actual business transition was executed end-to-end (for example: booking created → room held → payment recorded → ledger entry → visible to owner/ops) and its downstream effects were verified. Schema, API or UI alone is not done.
