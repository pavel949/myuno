# Guest → management reservation gate, 25 October 2026

Source status: bounded integration over the existing **PR160** contract; no second reservation writer and no production activation.

## Canonical semantics and source

PR160 `e97ad7427e46a59a232a29f0163569603ca7d874` defines an authenticated pending **unpaid reservation**, not a generic contact inquiry. Its registered `0036_property_reservation_lifecycle.sql` command atomically persists canonical order, property item, guest participant, command receipt, audit and the exact `property_bookings` inventory hold. Confirmation/cancellation use CAS commands; cancellation releases that same hold. The offered amount is an unpaid estimate for manager verification, not server-certified pricing or payment. No online-payment readiness is claimed.

This tranche reuses its exact `manualPropertyBooking.ts` and `propertyReservation.ts` gateway modules and their tests. It does not copy/register/apply the old branch's whole diff, SQL, calendar changes, edge handlers or migration journal.

Current source defect: the old inquiry page inserted `property_inquiries` and then separately created an order with `item_type='property_rental'` and `metadata.source_id` but no canonical `resource_id`. Live atomic creation does not normalize those fields, and the property bridge requires `item_type='property'`. A successful generic order therefore did not prove PMS/calendar inventory or a property receipt. Its CTA then opened a page querying `bookings.id/user_id` using an `orders.id`.

The adapted actual inquiry page calls only `create_property_reservation_checked`, retains durable command identity on an unknown outcome, freezes the verified actor token, and only accepts a complete canonical acknowledgment in the same actor/property/date/guest/contact context. There is no inquiry/raw-order fallback or notification dispatch in the new request branch. Actor or route changes, including A → B → A, discard old acknowledgments. Date inputs are memoized to prevent price-read loops.

The dedicated receipt dispatch `?propertyReservation=1` calls the existing PR160 checked reader. It never queries `bookings` using an order ID. Query parameters are routing intent, not authorization; the server reader is the authority. Exact order/item/guest/date/status fields are validated. Missing RPC, foreign order, malformed receipt or backend error is visible with retry, never successful empty data. A legacy `?propertyOrder=1` ID is explicitly unverified and does not claim a canonical hold. Other booking verticals retain their existing route branch. The receipt is read-only; no payment/cancellation command is introduced by this surface.

## Actual evidence

- Exact PR160 isolated suite rerun on PostgreSQL 17.6: **58 passed, one opt-in browser case skipped**. Its guest A/B, actor/object, overlap, durable command recovery, canonical item/participant/hold, manager transition and release tests executed. This is not live Supabase/PostgREST acceptance.
- A temporary additional compatibility regression applied the live `property_bookings.owner_id NOT NULL` constraint, then attempted a new ownerless managed shell. Creation failed and left **zero orders, zero holds and zero command receipts**. With that extra assertion, **59 passed, one skipped**. It changed only the owned temporary database and was not a production probe.
- The current actual inquiry page context suite passed all **eight** regressions after gateway adaptation: actor/property/date/guest changes, stale response, independent in-flight state, A → B → A, and bounded price RPC calls.
- **44** focused gateway/receipt tests passed: durable retry, missing RPC, malformed acknowledgment, foreign order identity, exact item and participant roles, actor-switch stale response, pending versus confirmed copy, and visible legacy uncertainty. No backend was contacted by those client fixtures.

Read-only live metadata, not business records, confirmed all four guarded PR160 predecessor fingerprints match exactly:

| Function | MD5 of pg_get_functiondef |
| --- | --- |
| create_order_atomic | `11d66e688a45f681cec66bf474c9eefb` |
| trg_sync_order_to_property_booking | `ffde1cb26b1ee1f2f04a9935b601b6ad` |
| guard_customer_order_update | `124a15c2f1df3a63cf56e0655b857773` |
| trg_sync_order_item_to_property_booking | `619fdedb524ceb6f763a4660f7ec8a93` |

The new lifecycle commands/readers are absent live. Matching four fingerprints is a prerequisite, not full migration GO. The complete PR160 metadata collector, dependent schema/grants/RLS, required writers and coordinated edge versions still need review.

## Explicit firebreaks and activation order

1. Finish authoring/catalogue activation independently. Real supply must be approved active rent supply with permitted short tenancy and real owner configuration. New MC authoring intentionally does not infer an owner from its creator. Live `property_bookings.owner_id` is NOT NULL; the existing bridge copies `properties.owner_id`. An ownerless draft cannot enter the reservation lifecycle. Use the real existing unit/verified owner relation, not fabricated creator ownership or a duplicate import.
2. Review the existing PR160 exact registered SQL and target metadata. Its private receipts, overlapping-writer guards, exclusion propagation, legacy reconciliation and payment refusal are critical activation scope. Do not concatenate it into the authoring packet by guesswork. Existing paid/ambiguous records are outside the unpaid cohort; no reconciliation evidence is manufactured.
3. Review and activate required DB contract first, only after explicit action-time approval. Verify `create_property_reservation_checked`, checked read/list/change commands and ACLs without business writes.
4. Coordinate the two PR160 guarded edge handlers before guest frontend activation so the unpaid cohort cannot enter legacy Stripe/manual-payment flows. Never deploy handlers ahead of their required eligibility RPC. No real notifications or payments are part of acceptance here.
5. Adapt the remaining MC consumers before declaring GO. `PropertyInquiriesWidget` currently uses inquiry rows or `orders.metadata.property_id`; it must consume `list_property_reservations_checked` and item identity. `MCBookingsPage` bulk status changes currently update raw `orders`; those must use checked CAS commands and report partial outcomes. The reserved route/calendar branch was not edited by this tranche. Main property booking list/detail readers must receive the bounded checked-cohort integration too.
6. Publish the coordinated guest request/receipt and MC consumers only after backend GO. Then perform separately authorized controlled real-listing acceptance: discover/search/detail/availability → guest A command and persisted receipt → guest B denial → MC list/confirm → same exact calendar hold → cancellation/release if authorized → task assignment/completion. No fictional public listing, payment, invitation or notification probe.
7. Recovery uses PR160's restrictive `property-reservation-lifecycle-stop.sql`, preserving records/readers/holds/evidence and payment refusal. Do not restore overlap-swallowing bridges or erase receipt uncertainty. Authoring/task rollback is a separate bounded action.

Production acceptance is still **NO-GO**. These source changes are not a standalone deployable guest release while the checked lifecycle RPCs and coordinated MC consumers remain absent.
