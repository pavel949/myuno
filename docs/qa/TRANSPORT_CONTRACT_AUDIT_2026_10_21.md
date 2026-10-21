# Airport transfer contract audit — 21 October 2026

Source base: `fb4b944a4c736f680ddb8e4b178f833030e021b1`. This is a finite producer/consumer/source contract audit and no-network reproduction, not production verification. No live database, order, payment, message, account, role, migration, Edge deployment or permission was changed.

**Release limitation: local Deno runtime/npm-specifier resolution and deployed PostgREST/RLS integration are NOT TESTED. Source-only review GO does not authorize deployment/activation or certify the full transfer/payment journey.**

## Verified baseline source

| Boundary | Evidence | Consequence |
| --- | --- | --- |
| Airport producer | AirportTransferBooking.tsx creates `order_type: vehicle`, metadata `transfer_type: airport`, item type `transport`; destination/flight/terminal/pricing fields are in metadata | A vehicle row can represent an airport request, but its client-authored metadata is not server financial authority |
| Rental producer | TransportBooking.tsx creates `vehicle` with `vehicle_rental` items and rental dates | A blanket vehicle whitelist would admit unrelated rental orders as transfers |
| Current operator list/webhook | OperatorTransfers.tsx filters vehicle then airport-related metadata; stripe-webhook/index.ts requires vehicle + `metadata.transfer_type === airport` | The runtime producer/list/webhook agree on vehicle + subtype, not transfer alone |
| Historical schema/types | June11 migration permits transfer in orders constraint; current OrderType union documents vehicle as rentals/transfers | A source migration's presence is not deployed-schema proof. No current public transfer-type producer was found |
| Signed operator ingress | confirm-transfer-operator checks transfer and pending/confirmed, then repeats type/status in conditional mutation | Current airport producer row is rejected403 before mutation. Do not remove the type/status guard or merely permit all vehicle rows |
| Checkout persistence | create-checkout updates `metadata: {stripe_session_id}` | It destroys airport/route metadata required downstream; changing type alone does not restore the journey |
| Checkout price guard | create-checkout loads stored total/currency and rejects a foreign customer before Stripe | Preserved defense; it does not establish that the earlier stored price was a server catalogue quote |
| Creation authority | useOrders invokes create_order_checked; migration0006 derives actor but still accepts supplied amount/items/metadata | Known canonical P0 blocker. Persisted client metadata cannot itself authorize financial/operational mutation |
| Notification/split | notify-transfer-booking accepts payload; no actor/object verification in handler, then enriches split, sends messages and calls ledger for claimed cash/advance | Gateway deployment state is unknown. A valid caller token alone would not establish object authority. Do not make this path reachable by broadening a type check |
| Financial confirmation | confirm-transfer-operator calls record_ledger_entries on operational confirmation | Operational acceptance does not establish verified money or capacity. Existing financial-recognition contract needs resolution |
| Refund | refund-transfer-order deliberately stops409 when no approved atomic reversal writer exists | Type parity cannot make refunds operational. No Stripe reversal/manual-success marker may be restored |

Source references: `src/pages/transport/{AirportTransferBooking,TransportBooking}.tsx`; `src/types/orders.ts`; `src/pages/operate/OperatorTransfers.tsx`; `supabase/functions/{create-checkout,confirm-transfer-operator,notify-transfer-booking,refund-transfer-order,stripe-webhook}/index.ts`; `drizzle/migrations/0006_harden_money_functions_and_provider_org_links.sql`; `supabase/migrations/20260611125034_c9969bd8-4efb-4ad1-b555-49fbf0ca854b.sql`.

Existing canonical evidence `docs/convergence/FINAL_ORDER_MUTATION_SECURITY.md` already records client-price, operational-ledger and refund boundaries; this audit does not supersede those gates.

## Actual-entrypoint reproduction

Run from repository root with the repository's Node runtime:

```sh
node docs/qa/reproductions/transport-contract.mjs
```

The script evaluates actual create-checkout and confirm-transfer-operator handler bodies from frozen baseline `fb4b944`, using `git show`. It deliberately reproduces the pre-fix behavior; current-source acceptance is tested separately. SDK, credentials, order data, HMAC secret and provider responses are explicitly synthetic. Fetch, financial RPC, notification/refund dispatch and actual DML are unavailable; the checkout fake records the proposed update only.

Eight cases were captured: airport confirm/reject403 (two failing journey cases); unrelated rental and terminal transfer refused before any side effects; checkout deterministically drops transfer/route metadata (third failing case); persisted amount/currency beats a tampered checkout request; foreign owner denied before Stripe/update; live integrations explicitly NOT TESTED. Exit0 means **the baseline defects were reproduced and existing guards were preserved**, not business acceptance. Results are written under `/tmp/myuno-transport-contract/results.json`.

## Minimal technical restoration proposal — review required

The source-only candidate below implements the bounded metadata/session-link restoration. It does not resolve the type/financial-contract mismatch or authorize activation.

Removing the metadata write is not parity: abandoned-checkout cleanup and legacy service webhook consume its session link. Naive read/spread/update can lose concurrent fields. No existing atomic metadata-patch RPC was found in repository SQL; do not invent or silently deploy one.

A bounded candidate can preserve JSONB via compare-and-swap against the exact metadata snapshot plus owner/order predicates, check affected rows, and retry only against freshly verified metadata with the same session pointer. Actual postgrest-js serializes `.filter(column, operator, value)` directly; JSONB CAS therefore requires an explicitly JSON-stringified value, with null handled separately. A real disposable PostgreSQL race test and actual SDK request-construction test are required before calling this safe.

Stripe creates a session before the metadata write. A proven lost CAS must never overwrite another active session; only a demonstrably unexposed losing session may be retired with the existing retrieve/expire API. A database error has an uncertain outcome: reread state before compensation, return no checkout URL on unresolved outcome, and do not pretend expiration or persistence succeeded. A matching owned open session may be reused only after provider-side order/actor/amount/currency checks; completed, mismatched or unknown sessions require explicit refusal/reconciliation. This restores link lifecycle only, not quote/settlement/refund correctness.

## Exact business fork and gate

Minimum question for Pavel: **For airport transfers, is the intended contract REQUEST (operator accepts a quote before settlement), or instant BOOK+PAY (server-verified tariff and capacity before payment)?** Do not pick the financial recognition event from existing cash/confirmation side effects. PROJECT.md requires a configured verified commercial/financial event, independently of operator acceptance.

Until that contract and a trusted server writer/object authorization are accepted, type broadening, paid-flow activation, ledger/refund changes and real dispatch remain **NO-GO**. A source-only metadata correctness candidate can be reviewed separately; passing its tests cannot certify the full transport journey.

## Source candidate and isolated evidence

`checkout-session-link.ts` now applies the existing payable-order status set, explicit actor ownership and known JSON metadata. It verifies provider session identity, authenticated actor, order, stored amount/currency, open/unpaid state and a usable HTTPS URL. A matching expired session may be replaced; complete/mismatched/unknown sessions cannot. The handler creates no second customer/session on verified reuse.

The metadata update includes exact JSONB snapshot, owner/id, stored quote and status predicates, and requires exactly the expected affected row. Non-pointer concurrent changes get bounded fresh-snapshot retries; competing pointers are never overwritten. A known losing write may retire only the newly created, provider-verified open session after another database read. Errors/acknowledgement loss require a reread; an unresolved outcome never exposes a URL or expires a possibly committed checkout. Provider retirement errors remain reconciliation, not success.

Validation (all synthetic/disposable, no live calls):

- 34 lifecycle/actual installed Supabase SDK serialization tests PASS.
- 8 actual create-checkout entrypoint regression cases PASS, including stored-price guard, explicit foreign/null-owner refusal, actual adapter affected-row/error behavior, reuse and acknowledgement loss.
- 7 existing checkout payment guard regressions PASS (financial validation unchanged).
- 3 real disposable PostgreSQL tests PASS: stale JSONB rejection with concurrent metadata preservation; simultaneous pointer CAS exactly one winner; owner/quote/status/SQL NULL guards. This is a synthetic local table proving SQL semantics, **not** deployed schema/RLS acceptance.
- Frozen baseline actual-entrypoint reproduction: 8 cases captured, three known failing journey cases reproduced (two airport actions plus metadata loss); current metadata regression is covered above.

No order type, price/total writer, ledger, refund, role, booking capacity, schema or deployment changed. Full quote/capacity/notification/settlement/refund integrations remain NOT TESTED and blocked by the contract above. This change does not solve the earlier canonical client-price authority P0.

Focused ESLint and narrow TypeScript checks PASS. The actual Edge handler is transpiled/executed in isolated regression tests; a Deno runtime and live PostgREST server are unavailable, so Deno deployment type-resolution and deployed RLS/PostgREST integration remain NOT TESTED. No full application build is claimed for this Edge-only source candidate.
