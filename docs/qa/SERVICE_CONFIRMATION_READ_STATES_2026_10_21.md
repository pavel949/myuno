# Service confirmation read states — 21 October 2026

Routine read-only UI salvage from the PR 17/40 backlog. Base: `fb4b944a4c736f680ddb8e4b178f833030e021b1`. The stale checkout/webhook rewrite and indefinite polling hook are not imported. No payment writer, order mutation, service capacity model, role, RLS, schema, credential or production record changes.

## Problem and resulting behavior

ServiceOrderSuccess and WellnessOrderSuccess previously ignored read errors and fell through to UnifiedSuccessLayout's unconditional “Payment confirmed” header after missing-row retries. Wellness also claimed a confirmed booking regardless of persisted status. An error, absent row, checkout-return URL or commercial order is not payment/capacity proof.

Both pages now show separate checking, error, missing/unverified, signed-out, pending and persisted order states. Only known persisted confirmed/in-progress/completed order statuses receive a positive order-status heading. Neither page asserts that payment or service capacity was confirmed. Existing service request copy still requires price/time/provider confirmation. Unknown or cancelled/refunded statuses never become a positive confirmation. Missing wellness category/currency is not converted to Beauty/THB. Unverified service returns prioritize My orders over creating another request.

The shared layout accepts an optional title/tone/retry state; unrelated callers retain their existing defaults and are outside this tranche's acceptance. No claim is made that every other success page is corrected.

## Read contract

- Require a resolved signed-in actor; constrain every order read by `customer_user_id` and the intended vertical/order type. A URL or navigation order ID grants no authority.
- Keep the service legacy session link in order metadata. Independent review rejected an initial wellness `payment_intents.provider_ref` lookup: checkout writes `cs_*`, but the webhook later overwrites it with `pi_*`. It is not durable session identity. No backend writer was changed to conceal that gap.
- The existing `useStripeUnifiedCheckout` now retains only explicit server-returned session/order IDs as one actor-bound sessionStorage navigation hint with a 30-minute TTL. No Stripe URL parsing, payment state or order data is cached. Storage failure never changes a created checkout into a failure. Wellness treats that ID as an untrusted selector and freshly reads only the current actor's beauty/fitness/medical order. A missing, expired, wrong-actor/session or unreadable hint remains explicitly unverified with My orders access; there is no broad or transient-payment-reference fallback. Another device/session without the hint cannot resolve this historical session-only return automatically.
- Use explicit field projections and no domain cache or new hook. The local result is bound to actor plus checkout reference and cannot flash a prior actor's details during an account switch.
- Missing/pending rows poll at most ten times at two-second intervals. A ten-second read deadline becomes a visible error. Query errors stop polling until an explicit retry. Cleanup clears timers, aborts the in-flight read and discards late responses after unmount/account/reference changes.
- No payment intent status, paid flag, ledger entry, reservation or financial transition is inferred or written.

## Verification evidence

The actual pages and shared layout passed **51 focused tests** across three files, including error/retry, unknown/terminal statuses, malformed responses, bounded missing/pending polling, request timeout, unmount cleanup, account changes with delayed responses, actor filters, the cs→pi webhook sequence, exact actor/session/TTL navigation hints, blocked storage, explicit server ID capture without URL parsing, and existing layout defaults. Scoped lint and diff check passed.

A network-denying synthetic browser matrix covers both actual pages in RU/EN at 375/390/430/1440 for error, unknown, pending and confirmed order states, including retry and overflow/runtime assertions. Screenshots are local synthetic evidence, not a production transaction or live hosting claim. Final browser/type/CI outcomes must be reported against the pushed head; this note does not assert a running check is complete.

## Residual boundary

The broader PR 17 payment/refund/webhook/settlement contract remains unaccepted. Durable server-side checkout-session linkage and cross-device return recovery remain a separate writer-contract gap; this UI deliberately reports unknown when its navigation hint is absent. This tranche reads existing canonical state; it cannot fix a stale backend order status or prove external provider, refund or inventory truth. Existing unrelated callers of UnifiedSuccessLayout still need their own source-backed acceptance before changing their payment wording.
