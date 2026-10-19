# Checked manual unpaid property booking — review candidate

Scope: the PMS operator records an off-platform/unpaid stay, including a zero quote. No real payment, supplier-data completeness or populated catalogue is an acceptance requirement. Authorization, a real inventory hold and persisted guest details are requirements.

The calendar currently writes orders, items and participants in separate browser requests. Its overlap preview cannot serialize concurrent writers, an item-trigger overlap may be swallowed, and retrying after a lost response can create a second order. The accepted #120 bridge correction is a prerequisite, not a replacement for this manual writer.

## Contract

`public.create_manual_property_booking(request UUID, property UUID, input JSON)` is an authenticated **security-invoker** wrapper. Its implementation is in the unexposed `pms_commands` schema and explicitly authorizes the current `auth.uid()` before privileged mutation: protected platform admin, independent property owner, or existing actor/property/company `bookings/edit` capability. It rechecks the property after acquiring its lock. Generic employment roles, client company/customer IDs, payment flags and metadata markers do not authorize the command.

The input allowlist covers civil arrival/departure and local times, guest contacts/count, nonnegative quote/expected deposit, currency, pending/confirmed status, source, external reference, notes and document URLs. Bangkok local time is converted once on the server. Arrival/departure is `[in,out)`. The expected deposit remains existing booking metadata; it does not assert receipt of money. Existing order/commission triggers remain unchanged, and no wallet, payment intent, paid transition or ledger primitive is invoked by the command.

One transaction writes the existing canonical order, guest participant, property item, initial status history and bridge-produced inventory hold. Success requires the exact active property/date/status hold and guest/item postconditions. The response allowlists booking fields; it never returns an entire order row or unrelated financial columns. The private receipt records request intent only; it is never a second booking, calendar, payment or inventory authority. Errors abort all command writes, including bridge alerts and the receipt.

A request-level transaction lock serializes identical IDs; the property-row lock serializes competing commands for one unit. The receipt binds the full normalized payload, property and actor. A retry rechecks authority and actual persisted state before returning the original order. Changed payload, actor, property, cancelled/altered order, missing guest or missing hold fails. A forged raw order cannot become a receipt. Retry identity uses epoch timestamps so changing connection timezone does not change intent.

## Evidence and verification

Read-only inspection on 2026-10-19 captured the exact deployed authorization helpers and customer-update guard in `predecessors.json`. `forward.sql` rejects changed helper definitions and a bridge without the accepted explicit-link/Bangkok correction. This candidate is intentionally outside both migration journals. The production bridge is still the old predecessor until the prerequisite is registered and activated.

`manualPropertyBooking.postgres.test.ts` runs in a disposable Unix-socket PostgreSQL cluster, with synthetic rows and no network backend. It loads the actual captured authorization helper definitions and customer guard. Their downstream membership/scope dependencies are controlled fixtures: these tests certify the new command's use of existing authority and denial boundaries, **not a fresh end-to-end certification of every deployed Space policy**. Existing inventory exclusion predicate and corrected bridge are exercised in PostgreSQL.

Cases cover zero quote, atomic guest/history/hold, replay/concurrent replay, competing stays, adjacent nights, blocks, imported stays, Bangkok/UTC/Los Angeles, owner/admin/delegated/outsider/anonymous paths, enforced-scope denial, revoked authority, changed retry intent, altered/cancelled state, forged raw order IDs, invalid/nonfinite/privileged fields, late rollback, private receipt ACL and restrictive rollback. CI results must be attached before review; test source is not test success.

## Activation and rollback

**Production NO-GO at this stage.** No SQL was applied and no production business rows were written for QA. The branch includes client adoption in `usePropertyBookings`; it must not be deployed ahead of SQL activation. Main still uses the existing browser writer. Register the reviewed prerequisite and this command through the canonical migration runner, then deploy the reviewed client, which retains one request UUID through failed responses and has no raw-write fallback. On replay the client explicitly marks secondary preparation for review instead of recreating non-idempotent tasks. Preparation runs only after an actual confirmed acknowledgement; message transport errors cannot turn a committed booking into a failed save.

`rollback.sql` revokes the wrapper, implementation and schema access while retaining orders, stays and deduplication evidence. Never restore separate raw writes as an automatic fallback. Re-enable only by a separately reviewed forward change.

Open boundaries: concurrent raw/manual-block writers do not yet share the new lock; rescheduling, cancellations and checked-in/out lifecycle are separate critical work. This tranche does not certify all PMS writers or justify a 9/10 operational score.
