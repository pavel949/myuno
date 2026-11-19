# Services #235: bounded synthetic acceptance, 2026-11-19

Base: `pavel949/myuno` `b4bbfde5dca7a301940d3baf8c04695221ae0701`, package v3.55.5. Separate local branch `audit/services-235-acceptance`. Not myUNO-final.

## Decision

**NO-GO for a production claim of complete, internally routed service requests.** GO only for review of the bounded success-copy correction and isolated tests. No live request, message, payment, role/schema change, migration, merge or deployment performed. Tests do not certify deployed code, delivery, DB persistence, provider availability or visual browser acceptance.

## Corrected locally

- TransferSuccess renders saved request / awaiting myUNO confirmation, not Booked / Confirmed. It no longer promises a driver meeting or that myUNO has approved credit. Payment behavior itself is unchanged.
- Shared useOrders creation toast says Order created, not Order confirmed. Writer/RPC and status behavior unchanged.
- Existing transfer component tests now render the real success component instead of a success stub. Added guest authentication→one creation→saved request, and notification `success:false` without a confirmed-trip claim.

## Verified synthetic boundaries

- Fast Track `/transport/fast-track`: arrival and departure; unauthenticated submit preserves session draft and goes to auth return. Submission is authenticated, NOT anonymous intake. Synthetic page tests cover validation, retained failed draft, no passport in review, valid passport payload.
- Fast Track edge handler `supabase/functions/notify-fasttrack-booking/index.ts`: executed its actual transpiled handler in an isolated VM with fake auth/DB/config, no outbound network. Verified actor replaces body user_id. Booking failure returns 500. Successful booking+passengers returns saved ID even with notification APIs absent. **Passenger insert failure still returns success:true**: characterization test is green because it reproduces this defect, not because defect is accepted.
- Transfer `/transport/airport-transfer`: from-airport and to-airport are supported. No airport-to-airport/return-trip acceptance claimed. Synthetic hook boundary verifies one authenticated `createOrder` call and notification call. `useOrders` calls `create_order_checked`; this test does NOT execute that RPC or prove persisted orders. It creates a commercial `orders` workflow, not service_orders; no migration attempted.
- Transfer tests cover stale/zero fares, removed vehicle, delayed auth price revalidation, failed create, Stripe checkout failure/no premature notification, night configuration admission, and saved-state wording.

Command: `npx --no-install vitest run src/pages/transport/__tests__/AirportFastTrackPage.safety.test.tsx src/pages/transport/__tests__/AirportTransferBooking.fare.test.tsx src/test/acceptance/fastTrackWriter.acceptance.test.ts`.
Result: 27 tests in 3 files passed. Focused ESLint: 0 errors, 7 pre-existing explicit-any warnings in transfer fixture. Dependencies installed via npm ci --ignore-scripts. No full CI/typecheck/browser E2E or screenshots claimed.

## Remaining launch blockers and safe next tranche

### Fast Track incomplete request and retry

Current canonical implementation writes `airport_bookings(status=draft)` then `airport_passengers` separately. Passenger failure is swallowed. Caller clears draft after `{success:true, booking_id}`. Notification paths log missing APIs or catch errors; successful response does not prove WhatsApp/email delivery. No durable request idempotency key observed in this handler.

Safe contract requires booking + passenger save to be atomic/idempotent, or explicit recoverable incomplete state bound to original booking ID. Do not merely throw after booking creation: unchanged retry may create a duplicate. Review schema/constraints and approved writer before staging a forward migration or replacing writer. Isolated acceptance should prove replay returns same ID, passenger failure never becomes complete, actor ownership, notification failure cannot corrupt persistence, and retry cannot duplicate requests. Separate delivery outcome from receipt. No such writer change made here.

### Transfer is NOT internal-only today (source evidence)

`notify-transfer-booking/index.ts` selects active transfer_operators; uses operator phone/email, and hardcoded extra operator email fallback in addition to protected admin contacts. It generates an external confirmation link. Customer template promises operator contact. Same function also enriches order operator metadata, computes vendor/platform split, invokes record_ledger_entries for offline payment, and logs sent even when delivery helpers swallow failures. Thus a single helper filtering recipients would not establish internal-only business flow.

Surgical staging plan (requires explicit contract review, NOT an instruction to deploy):
1. Derive authoritative stored order/actor admission before dispatch; never infer delivery/fulfilment from caller-provided payload.
2. Introduce a narrow admin-recipient allowlist boundary using existing protected myUNO contacts. Remove operator/extra fallback fanout for the approved internal-intake mode, including customer-facing operator promise/confirmation-link exposure. Test every recipient with synthetic spies and configuration failures fail closed.
3. Preserve existing money/split/ledger code unmodified in this tranche; explicitly review whether it may run on a request-only intake. If not, stop for finance-domain design rather than silently suppressing or duplicating it.
4. Make receipt, dispatch attempted, provider accepted, delivered, and fulfilment confirmed distinct truthful evidence; log only verified result. Test failure/no config/retry.
5. Govern release separately after isolated tests and review. No production calls to this notifier for QA.

## Boundaries

Current supplier fanout is a source-level confirmed issue, not evidence that any real supplier was contacted during this work. No real personal data used in tests. Remaining 375/390/430/desktop RU/EN/TH screenshots, actual checked-RPC persistence, delivery reconciliation, capacity and production verification remain unaccepted.

## Follow-up: bounded Fast Track partial-persistence containment (local only)

The preceding partial-success finding describes base b4bbfde. A follow-up local patch now returns `{success:false, receipt_status:'incomplete', booking_id, error:'PASSENGERS_NOT_SAVED'}` immediately when passenger insert fails. HTTP 200 is intentional transport-level delivery of the explicit non-success result through functions.invoke. The already-created airport_bookings row remains `draft`; no row is deleted, rewritten, retried or labelled complete. WhatsApp/email dispatch is skipped for this branch.

The page preserves the returned booking ID and draft, displays that a request exists but passenger data was not saved, directs the person to myUNO with that ID, blocks a second submission, and restores the block after route remount/reload through the existing draft hook. Uncertain failures are also retained in the existing draft rather than silently inviting a retry after navigation. This is browser-session containment (existing draft TTL 24h), NOT durable server idempotency, multi-device recovery or atomic persistence. Cleared/expired storage and response loss still require the broader governed writer/reconciliation contract above. Existing UI versions only show the generic failed-receipt state; deploy client/server together only after review.

Actual handler tests with synthetic configured notification ports prove the partial branch calls neither email nor WhatsApp; saved-ID and no additional mutation are asserted. A component test proves blocked resubmission and restored receipt after unmount/remount. Focused suite now **29/29 passed** (8 Fast Track UI + 16 transfer UI + 5 actual Fast Track handler tests). No live deployment performed. NO-GO for full service launch remains.
