# Service confirmation read states — 21 October 2026

Routine read-only UI salvage from the PR 17/40 backlog. Base: `fb4b944a4c736f680ddb8e4b178f833030e021b1`. The stale checkout/webhook rewrite and indefinite polling hook are not imported. No payment writer, order mutation, service capacity model, role, RLS, schema, credential or production record changes.

## Problem and resulting behavior

ServiceOrderSuccess and WellnessOrderSuccess previously ignored read errors and fell through to UnifiedSuccessLayout's unconditional “Payment confirmed” header after missing-row retries. Wellness also claimed a confirmed booking regardless of persisted status. An error, absent row, checkout-return URL or commercial order is not payment/capacity proof.

Both pages now show separate checking, error, missing/unverified, signed-out, pending and persisted order states. Only known persisted confirmed/in-progress/completed order statuses receive a positive order-status heading. Neither page asserts that payment or service capacity was confirmed. Existing service request copy still requires price/time/provider confirmation. Unknown or cancelled/refunded statuses never become a positive confirmation. Missing wellness category/currency is not converted to Beauty/THB. Unverified service returns prioritize My orders over creating another request.

The shared layout accepts an optional title/tone/retry state; unrelated callers retain their existing defaults and are outside this tranche's acceptance. No claim is made that every other success page is corrected.

## Read contract

- Require a resolved signed-in actor; constrain every order read by `customer_user_id` and the intended vertical/order type. A URL or navigation order ID grants no authority.
- Keep the service legacy session link in order metadata. Wellness now follows the existing `payment_intents.provider_ref` → order relation written by the canonical checkout handler, rather than querying a nonexistent `orders.stripe_session_id` column. Ambiguous joins/read errors fail visibly; no arbitrary first-row fallback.
- Use explicit field projections and no global cache/new domain hook. The local result is bound to actor plus checkout reference and cannot flash a prior actor's details during an account switch.
- Missing/pending rows poll at most ten times at two-second intervals. A ten-second read deadline becomes a visible error. Query errors stop polling until an explicit retry. Cleanup clears timers, aborts the in-flight read and discards late responses after unmount/account/reference changes.
- No payment intent status, paid flag, ledger entry, reservation or financial transition is inferred or written.

## Verification evidence

The actual pages and shared layout passed **34 focused tests** across two files, including error/retry, unknown/terminal statuses, malformed responses, bounded missing/pending polling, request timeout, unmount cleanup, account changes with delayed responses, actor filters, canonical wellness linkage and existing layout defaults. Scoped lint and diff check passed.

A network-denying synthetic browser matrix covers both actual pages in RU/EN at 375/390/430/1440 for error, unknown, pending and confirmed order states, including retry and overflow/runtime assertions. Screenshots are local synthetic evidence, not a production transaction or live hosting claim. Final browser/type/CI outcomes must be reported against the pushed head; this note does not assert a running check is complete.

## Residual boundary

The broader PR 17 payment/refund/webhook/settlement contract remains unaccepted. This tranche reads existing canonical state; it cannot fix a stale backend order status or prove external provider, refund or inventory truth. Existing unrelated callers of UnifiedSuccessLayout still need their own source-backed acceptance before changing their payment wording.
