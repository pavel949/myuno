# Property reservation lifecycle — critical source tranche

Base: main 815952632. Implementation milestone only; no production activation.

## Contract

- Reuse PR125 ae3d519 atomic manual-command locks, intent receipts and postconditions; retain PR140 refusal for payment-bearing/ambiguous historical orders.
- Guest reservation is authenticated, guest-owned, pending and unpaid. Only active, approved published property supply is eligible. Offered amount is an unpaid customer estimate, not server-certified price or payment; operator confirmation does not mark paid. No merchant, wallet, Stripe, refund or ledger writer is added.
- Existing canonical orders/order_items/participants own the commercial record; property_bookings owns inventory. Private receipts deduplicate commands and never become inventory truth.
- Create locks request then property, checks actor/intent again, commits order+guest+item+history+exact active hold together. Same-property overlap fails the complete transaction. Half-open Bangkok civil dates remain canonical.
- The request UUID survives response loss, rerender, reload and browser restart using actor-scoped hashed intent storage. Unknown outcome never silently creates a new identity. Replay returns the same order's current authoritative state after legitimate later changes.
- Manager/owner updates are actor/object checked and compare the persisted version. Guest may cancel only their own unpaid receipt-backed reservation. Payment-bearing, ambiguous legacy or terminal fulfilment states fail closed; this is not a paid refund path.
- Transition locks property then order, writes order/item/participant changes, audit history and bridge inventory in one transaction. Cancellation releases dates; stale/foreign commands cannot change state. Transition replay uses a bound intent receipt and does not repeat history.
- Guest and PMS read the same order and exact linked inventory through a checked reader. Missing/mismatched mirror is an error, never a success toast.
- Existing item bridge and order bridge must not swallow overlap or adopt unrelated imported stays. Existing required imported/calendar integrations are not deleted; activation preflight must identify incompatible writers before any live cutover.

## Activation boundary

Prepare registered forward SQL with predecessor/ACL/schema checks, restrictive rollback and isolated real PostgreSQL role/concurrency tests. Do not apply migrations, deploy handlers/frontend, enable enforcement or alter existing production rows in this tranche. Acceptance is source/isolated-backend evidence only; parent reviews the first milestone before the next process starts.

## Preflight and recovery (not executed against production)

Before activation, independently inspect the actual target schema, function
fingerprints, trigger order, grants/RLS, registered migration journal and all
writers of orders/items/participants/property_bookings/property_availability.
0036 refuses unknown guarded predecessors. The isolated acceptance database
uses actual command/bridge definitions and synthetic authorization dependencies;
it does not certify the entire production schema, Supabase Auth/PostgREST,
financial triggers or imported inventory writers. Confirm those dependencies in
a representative isolated copy before approving activation. Preserve the backup
and existing source deployment so the frontend can be rolled back independently.

No live backfill is included. Historical/paid orders are outside this new cohort.
New-cohort payment intents fail closed deliberately. Do not activate alongside a
frontend that still advertises instant payment for this cohort. Existing unrelated
paid flows are not certified by this milestone.

After approved migration and frontend activation: read back the exact migration
and frontend versions, verify read/list permissions with dedicated test identities
in a non-production environment first, then monitor command errors, mirror
mismatches, overlap rejections and unknown acknowledgements. Never repair an
uncertain request by deleting its receipt or writing a new order directly.

`docs/hardening/rollback/property-reservation-lifecycle-stop.sql` is a restrictive emergency stop:
revoke checked mutation entry points and private mutation functions, preserve
existing records, checked readers, strict overlap propagation, payment refusal
and write guards. It does not reopen legacy bypasses or delete evidence. Recovery
requires diagnosis and separately reviewed forward repair, not a blind migration
rerun (0036 creates named functions/tables and is intentionally not rerunnable).
