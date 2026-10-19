# Atomic property-order gate — review candidate

Status: **IMPLEMENTED CANDIDATE, NOT APPLIED; production NO-GO**.

Repository: `pavel949/myuno`. Source baseline: `99bec56c2`, preserving the concurrent-writer and late-rollback regressions merged through #117.
The SQL is deliberately outside both migration journals. Neither merge nor a
frontend deployment must apply it implicitly. PROJECT.md §§14, 16 and 20 require
critical-stage review before activation or the next critical tranche.

## Verified predecessor and problem

SELECT-only inspection of connected myuno project
`dcc2b024-7627-4ad9-a915-a3df3dd839f0` on 19 October 2026 captured:

| Function | Definition MD5 | Boundary |
| --- | --- | --- |
| `create_order_atomic` | `11d66e688a45f681cec66bf474c9eefb` | Existing service-only commercial writer; used by checked customer RPC and deposit checkout |
| `trg_sync_order_to_property_booking` | `ffde1cb26b1ee1f2f04a9935b601b6ad` | Existing inventory bridge swallows overlap and may adopt an unlinked stay by equal dates |

`predecessors.json` contains those exact definitions, not guest records. The
existing PostgreSQL regression reproduces successful orders outnumbering holds.
Preflight availability and a later cancellation do not make creation atomic.

## Candidate contract

For `p_order_type = 'property'`, the **existing** writer must either commit one
commercial order with one explicitly linked active inventory hold, or return
`success=false` after rolling back every write in that call.

- Require one property item, a real resource, consistent metadata/item dates and
  a positive stay in Bangkok civil dates. No multi-unit cart is introduced.
- Serialize this writer on the existing property row. Keep the existing
  `property_bookings_no_overlap` exclusion constraint as final booking authority.
- Reject already stored manual blocks over `[check_in, check_out)`.
- Never adopt an unlinked/imported stay merely because its dates match. A
  conflicting legacy row stays intact and requires explicit reconciliation.
- Preserve existing explicit legacy `order_id` links to the same order/property;
  never infer a link from a calendar label or a supposed guest identity.
- Use explicit `Asia/Bangkok` dates in the existing bridge, independent of the
  SQL session timezone. Preserve lifecycle status mapping and explicit links.
- Re-run that bridge after participants exist, then verify the exact order,
  property, civil dates and active hold before returning success.
- On failure the existing exception subtransaction rolls back order, children,
  payment intent, booking and reconciliation alert together. No financial
  success, payment receipt or external Stripe action is synthesized.
- Keep the signature, owner, execution ACL and checked-RPC authentication
  unchanged. The candidate rejects unexpectedly public primitive privileges and
  predecessor drift before changing either function.

Price, commission, merchant mapping, receipt verification, installment allocation
and ledger formulas are **unchanged and not certified**. Existing `service_orders`
and nonproperty commercial writers are outside the inventory guard.

## Isolated verification

`src/lib/__tests__/propertyInventory.postgres.test.ts` runs the real SQL on a
temporary Unix-socket PostgreSQL instance. No hosted backend is used. The new
candidate cases cover concurrent creation, full rollback after a late failure,
legacy-row preservation, adjacent stays, existing manual blocks, malformed
resource/date payloads, three database timezones, denied customer/anonymous
primitive invocation, drift and the stop switch. The preexisting cases continue
to test the predecessor and canonical inventory rules separately.

Command: `npm test -- --run src/lib/__tests__/propertyInventory.postgres.test.ts`.
On candidate `73286c2`, CI verify and connected-system verification both passed:
38 PostgreSQL cases; 2,337 aggregate tests in 153 files. After integrating main's
additional concurrency regressions, all checks must pass again on the new head.
Test source alone is not a passing result or production acceptance.

Source review on 19 October: the bounded guard preserves function signatures,
ACLs, financial formulas and explicit legacy links. The rollback stops the
property primitive and keeps the safer bridge. Review decision: suitable for
review as an isolated inventory correction; **NO-GO for activation** while the
canonical migration registration, manual writer and read-only activation checks
remain open. This decision does not approve another critical tranche.

Read-only provenance follow-up: of 61 active holds lacking `external_id`, 60
already have explicit legacy `order_id` links and come from the active Airbnb
iCal calendar. They are imported date blocks; paid/real-guest status is not
established by that source. The remaining direct record has the explicit
`TEST_BOOKABLE_LOOP` / AI smoke-test marker. None was changed or deleted. This
distinction requires preserving legacy links, not treating all 61 as unlinked
or automatically classifying every imported block as a real reservation.

## Activation blockers and bounded acceptance

1. Review the changed rejection behavior for existing unlinked stays and the
   single-property-item boundary using read-only aggregate evidence. Do not
   relink or seed real records as a test.
2. Register a forward migration through the repository's canonical runner only
   after this critical tranche is reviewed. Recheck live hashes and ACL then.
3. The PMS calendar still creates orders/items in separate browser requests.
   This candidate fixes the existing atomic writer, **not that manual writer**.
   A compatible actor/object-authorized replacement and retry contract remain
   necessary before direct paths can be revoked. Do not claim all bookings atomic.
4. Concurrent creation/editing of manual blocks by writers that do not take the
   property lock is not certified. Inventory changes/rescheduling, lifecycle,
   financial PC-01–PC-05, direct paths and Space enforcement remain separate gates.
5. GO-A and full PMS production acceptance remain **NO-GO**. Passing this isolated
   inventory candidate is not approval to enable Spaces, change receipt/FX rules,
   apply #95 blindly, deploy Edge handlers or perform a real payment/booking QA.

## Rollback

`rollback.sql` disables property creation through this primitive with an explicit
failure, preserving the corrected bridge and existing records. It does not restore
unlinked-row adoption, broaden privileges, fabricate a successful booking, or
change nonproperty creation. Legacy direct writers remain a known preexisting
gap, not an endorsed workaround. Restore service only through a reviewed forward
correction; do not replay the unsafe predecessor as an operational workaround.
