# Customer unpaid commercial-order cancellation — unapplied contract

This branch prepares the client journey and a review candidate. **Production cancellation is not enabled.** No SQL, privileges, RLS, real orders, payments, notifications or inventory were changed. The sibling SQL is deliberately outside migration directories and grants no client execute access. `FINAL_ORDER_MUTATION_SECURITY.md` remains an unresolved security audit, not authority to apply its older candidate.

## Current source and bounded change

`useOrders.cancelOrder` previously selected a status, performed a direct UPDATE with no affected-row check, then inserted history separately and reported success. It now uses the same checked command boundary as the confirmation control. There is no direct-write/history fallback. Until reviewed server commands exist, the old cancellation path fails closed and the new control is unavailable. Existing create/provider writers are unchanged and are **not certified** by this work.

`/me/payments` waiting orders and `/orders/:id/tracking` use a shared Cancel order → confirm → server result → Cancelled flow. No delete, hide, refund or service-order adapter exists. The versioned eligibility reader passes only the order id. The command passes only order id, expected server revision and a retry UUID. It never accepts a caller-selected customer, status, payment flag or total. Unknown response versions, foreign ids, missing history receipt, timeout and missing RPC never produce success. The confirmation retains the same UUID on retry. Order and payment readers refresh after confirmed success, including the existing timeline.

The payments reader now includes the actual waiting enum states, excludes deleted/paid rows from its due bucket, retains cancelled order history and propagates errors rather than fabricating an empty account. Mixed-currency balances are not added together. Missing financial values are not treated as zero/default THB.

## Required server contract and activation blockers

The read and public command wrapper use INVOKER. A private, checked DEFINER writer is proposed because revoking raw customer UPDATE/history INSERT also removes an invoker's ability to commit those writes. It derives `auth.uid()` internally, enforces persisted customer ownership, locks the order, requires its unchanged server revision and waiting/unpaid state, and commits the order transition and existing history together. Its search path is pinned and all privileged tables/helpers are schema-qualified. No command is granted to clients in this proposal. Existing order→property-booking trigger/inventory semantics must participate unchanged. A history UUID is the idempotency receipt: retrying the same request returns the existing cancelled event and creates no duplicate. A request UUID belonging to another order/actor/transition fails. Replays must still pass the financial governor so a late payment cannot be hidden behind an older receipt.

The mandatory **unimplemented governor** `private.assert_customer_order_cancellation_safe(order_id,actor)` prevents this candidate being mistaken for deployable authority. It must enforce all of the following against complete authoritative data, with no customer-editable metadata assumptions:

- Paid/deposit-paid/processing/refund/confirmed/started-work/active-checkout or ambiguous payment state refuses cancellation. Order `paid_at`, every linked payment/manual-receipt source and fulfilment/booking state must agree. Unknown or unreadable state refuses.
- Every competing checkout/payment/fulfilment writer follows a reviewed common locking and durable-attempt protocol. A row lock cannot span a Stripe HTTP call; a durable pending attempt must exist before the external side effect. Never infer quiescence from absent intents or a missing session reference.
- Shared checkout inserts a pending intent before session creation, links `provider_ref` after it, and currently treats insertion/linkage failure as non-fatal. Property/yacht and manual/wallet/legacy paths require their own writer trace. This branch does not claim that race is resolved.
- Current customer/provider direct mutation, child/payment-intent/history policies and existing guard bypasses from the security audit must not let the actor forge the facts or cancellation receipts used by this governor. Closing direct history INSERT is essential; an own-order insert policy does not establish server provenance. Trigger compatibility with the private checked writer requires separate proof.
- Property inventory release is a checked atomic consequence of the canonical transition, never a `deleted_at` UI operation. No linked `service_orders` or legacy `bookings` status is silently translated.

No helper, capability flag, grant, broad definer bypass, payment engine or second order/history table was invented to make the UI look ready. The current absent RPC produces an unavailable control. The SQL candidate must not be activated by granting execute alone.

## Acceptance gate before any separate production action

Run disposable PostgreSQL integration tests with actual applicable guards, policies and bridge triggers: foreign customer/guest/role denial; every blocked financial/fulfilment state; source read failure; zero-row/stale revision; history/trigger failure rollback; linked inventory release; duplicate/concurrent cancellation; same UUID with wrong actor/order; cancel versus checkout-intent creation/session-link/webhook/manual receipt; retries after transport uncertainty. Prove no committed charge is stranded and no inventory is released on refusal.

Client synthetic tests cover missing/malformed/denied contracts, confirmation, uncertain results, retry identity, unavailable states, locale labels and payment error/mixed-currency behavior. They are not a substitute for the unimplemented governor, disposable SQL tests or production evidence. Root coordinates exact reviewed SQL and action-time access separately; no migration application is authorized in this task.

The payment reader retains paid-at order activity regardless of current valid order status, alongside completed, refunded and cancelled orders. History amounts are labelled order amounts: an unpaid cancelled order is not a charged payment. This bounded reader is not certification of the complete financial ledger. Unknown actors have no inferred currency or balance.
