# FINAL PRE-E3 — Order mutation security

**Result: partial containment, E3 NO-GO.** This is not a completed financial-integrity certification. No E3, enforcement, spaces, assignments, real order/payment/booking/refund, outbound notification or business DML was executed.

Baseline HEAD: `1f40588db94e8d0e1e83cd024bf5556034bafcb0` (verified at start). Evidence: [final_order_mutation](final_order_mutation/). Source-only findings are distinguished from actual live catalog definitions and disposable-PostgreSQL reproductions. The July historical protected-column guard/policy replacements **are absent live**; they cannot be relied upon. Captured live `extra-functions.json` is empty. No historical migration was changed.

## Applied fixes and exact manifest

1. **0033_restrict_unchecked_wallet_mutations.sql**, byte-identical to `final_order_mutation/wallet-containment.sql`, SHA-256 `b9358af2c6319e938d69a9632d86d568bd8f5eefd6955c068284541ba83c90c1`.
   - `pay_from_wallet_atomic(uuid,numeric,text,text,text,text)` and `topup_wallet_atomic(uuid,numeric,text,text)`: revoke PUBLIC/anon/authenticated EXECUTE; service_role retained.
   - Both reject NULL, zero, negative, NaN and infinities before mutation; drift hashes checked before replacement.
   - Proven live-definition exploit reproduced locally: uno_team credits another user's wallet with forged refund reference; provider changes amount/currency/customer/refund metadata/status through the live guard.
   - Wallet exploit contained live. Provider/order exploit is **not fixed live** by this migration.
   - Rollback: `docs/hardening/rollback/0033_wallet_containment.sql`, never restore client money primitives.
   - Compatibility consequence: legacy `useWallet.payFromWallet/refundToWallet` now fails closed. No promise that legacy wallet checkout still works; Stripe service top-up retains EXECUTE, but concurrency/currency issues remain below.
2. **confirm-transfer-operator/index.ts**: deployed after actual-entrypoint synthetic tests. Signed link accepts only transfer pending/confirmed objects; terminal/foreign-vertical objects denied. Conditional confirm requires pending; reject requires pending/confirmed, both constrain order_type. No financial actor expansion.
   - Entry file SHA-256 `906850a530eed9cbd3af7098134b5b66086f548079f9ed14ac5954f93d204615`.
   - Deployment tool submitted bundle/settings SHA-256 `784e5e32b2a2ff86c30bb85a0595e1f0fe2df5cbde5316ef713bac4a2a12f6bd`; deploy acknowledged, no real handler invocation.
   - Rollback: retain terminal/type predicates; disable signed dispatch if compatibility fails, never revert to `neq confirmed` resurrection. Payment confirmation authority and refund recovery remain blocking.

No order-policy/guard/child/property-booking changes applied; no other edges deployed. `restrictive-fixes.sql` is an **UNAPPLIED synthetic containment candidate**, not migration authority. Its broad compatibility, nested-trigger trust, pending child creation, and creation/cancellation race need review; do not apply it as a finished fix. The 75 passing cases do not prove these missing contracts.

## Canonical path and present defects

`orders` owns commercial truth → `order_items/participants/addresses` → `payment_intents` (provider settlement) → `record_ledger_entries` → ledger; property items touch parent order → definer `trg_sync_order_to_property_booking` → `property_bookings` inventory. `create_order_checked` derives actor but validates only total bounds and org existence before atomic insertion; it does not derive catalog price or validate resource/provider authority. Direct INSERT bypasses even this wrapper. `bookings` and wallet booking primitives remain legacy adapters, not a second canonical model.

Inventory remains half-open `[check_in,check_out)` with original exclusion/predicate. Current bridge maps cancelled/refunded/expired/deleted order to released booking and catches overlap as alert instead of aborting order. A successful order result is not proof of inventory hold. No date/status semantics were modified.

## Field / transition matrix

The target below is **required contract**, not claimed deployed behavior. Every unspecified mutation fails closed; missing checked workflows are blockers, not implicit grants.

| Actor | Price/currency/customer/provider/org/items/participants/payment/timestamps/metadata | Allowed transition contract | Current live disposition |
|---|---|---|---|
| Customer | No post-create alteration; only server-issued initial quote/identity; request/cancel fields explicitly finite | Unpaid waiting cancellation only; no confirmed/refunded/payment truth | UPDATE whole-row guard broadly holds, but cancel accepts any old state; direct INSERT/child append and checked underpricing PROVEN BYPASS |
| Active provider/org member | No financial/identity/metadata rewrite | Proven fulfillment only; confirmed→in_progress→completed candidate, settlement prerequisite for completion; no financial confirmation/refund | Live guard returns NEW for any org member, ignores active flag: PROVEN BYPASS |
| Agent | No generic payment power | Only existing explicit object/action duty, never implicit role | No certified money contract; client/PMS writers blocked for certification |
| Company staff/manager | Booking edit + property/space duty cannot imply finance | Nonfinancial booking actions via checked object path; paid/confirmed/refund requires explicit finance | Parent order lacks matching property ceiling; private helper retains generic staff exemption: PROVEN BYPASS / unknown full authority |
| Finance staff | Authoritative stored quote/amount + object finance authorization; atomic payment/ledger record | Checked settlement/reconciliation only | Role helper recognizes admin/staff/finance; object authority not established; manual non-atomic path PROVEN BYPASS |
| Platform admin | Protected identity; no raw rewrite of financial truth | Checked repair/settlement; audit/reconciliation in same transaction | Direct full-table financial writes remain; target matrix not enforced |
| service_role/webhook | Internal server authority only; caller must prove event or finite actor/object capability | Verified provider event, transactional/idempotent settlement/refund/expiry | Primitive access intended INTERNAL ONLY; several handlers violate state/recovery invariants |

Concrete fields checked synthetically: total_amount, subtotal, discount_amount, tax_amount, platform_fee_amount, vendor_payout_amount, concierge_fee_amount, currency, customer_user_id, provider_org_id, source_company_id, start_at, end_at, created_at, paid_at, metadata, notes, deleted_at; paid child inserts and property owner/reparent/deposit/refund mutations. `updated_at` must be server-controlled, not customer-exempt arbitrary timestamp. Arbitrary statuses were tested against the unapplied order guard candidate, not live production.

## Writer dispositions

Raw live functions/ACLs/policies/triggers/columns are committed in JSON. [source-writers.csv](final_order_mutation/source-writers.csv) enumerates **65** mechanical exact-table mutations with path/line/table/action/disposition; [writers-live.json](final_order_mutation/writers-live.json) lists **15** direct SQL writer functions. Regex inventories do not certify dynamic SQL, RPC transitive writers, external integrations or deployed source parity. UNKNOWNs in money-mutating handlers are blocking unless demonstrated unreachable.

| Writer family | Disposition and evidence |
|---|---|
| Customer order INSERT policies (`Customers can create orders`, `orders_insert_own`) | PROVEN BYPASS: own customer only, arbitrary price/status/provider/metadata; guard is UPDATE-only |
| guard_customer_order_update | PROVEN BYPASS: NULL actor, generic staff finance exemption and any org member bypass; customer can cancel confirmed/paid order and release booking |
| create_order_checked | PROVEN BYPASS: client price/currency/items/resources accepted; no catalog quote, item sum or object duty; no corrected price contract yet |
| create_order_atomic/create_booking_with_wallet_payment/credit_cashback | INTERNAL ONLY ACL; inputs and legacy bridge not globally certified |
| pay_from_wallet_atomic/topup_wallet_atomic | PROVEN BYPASS fixed by 0033 server-only grants/finite-positive validation; Stripe replay/currency not fixed |
| get_or_create_wallet | UNKNOWN outside scope of money minting: arbitrary user can read/create zero wallet; not certified as private read access |
| record_ledger_entries | INTERNAL ONLY; check-before-insert without order lock, full-order amount posting even deposit, missing refund reversal/partial reconciliation: blocking integrity gaps |
| order_items/participants/addresses INSERT | PROVEN BYPASS: customer appends after creation/settlement; no frozen-state predicate live |
| payment_intents INSERT | PROVEN BYPASS: live own-order policy allows forged status/reference/amount/currency; historical restrictive replacement absent; ordinary UPDATE has no granting policy |
| ledger_entries | Ordinary customer/provider mutation SAFE at RLS boundary; admin full mutation not append-only, no canonical finance action enforcement |
| property_bookings owner policies | PROVEN BYPASS: submitted owner_id not persisted property owner; reparent/financial state unrestricted; restrictive scope ceiling alone is not ownership proof |
| trg_sync_order_to_property_booking / item touch / create_property_booking_from_order | INTERNAL ONLY, client-origin parent/child allows bypass into inventory; first-item/adoption/caught-conflict contract remains blocking |
| fn_sync_financial_to_ledger | INTERNAL ONLY trigger; upstream property_financials mutation capability and atomic accounting semantics not fully certified |
| sync_booking_to_owner_calendar / process_cashback_on_booking_complete / process_referral_bonus | LEGACY trigger adapters; upstream booking status must be audited, no unconditional SAFE certification |
| handle_new_user_wallet | INTERNAL ONLY lifecycle trigger; zero initial balance, no real user creation tested |
| usePropertyBookings / ManualPaymentForm | PROVEN BYPASS: direct client order/child creation; manual confirmed total; parent mutations can invoke privileged booking sync |
| useOrders.createOrder | Checked creation still price bypass; client paid-intent UPDATE usually denied for ordinary user but admin allowed; no server settlement proof |
| useOrders.cancelOrder/vendor status / useConciergeAdvance / MC bulk / admin status / operator status | LEGACY direct state writer using live table policies; financial transitions not certified; do not treat UI role gating as authorization |
| useOwnerStays / GuestTripDetail | LEGACY direct booking writer; persisted owner/deposit/refund/linked inventory checks missing |
| shared checkout handler + vertical builders | INTERNAL ONLY authenticated pipeline; partial opt-in line total guard is not authoritative catalog quote; restaurant anonymous-price lines, restaurant_id-as-org and arbitrary extra metadata PROVEN BYPASS, not fixed |
| create-property-deposit-checkout / create-yacht-checkout | INTERNAL ONLY; retained hold preflight/price defenses, full financial writer certification incomplete |
| confirm-manual-payment | PROVEN BYPASS integrity: admin ingress but request set confirmed before unchecked order update; retries skip, client actual RUB amount lacks server reconciliation; no canonical payment intent/atomic ledger |
| confirm-transfer-operator | Terminal/type resurrection fixed; signed bearer link still can confirm/ledger-post unpaid order; refund failure retry stranded: blocking |
| refund-transfer-order | INTERNAL ONLY ingress; live schema has provider_ref, no stripe_payment_intent_id; fails query then claims manual refund; no Stripe idempotency key/success-state requirement/reversal ledger; blocking |
| stripe-webhook | INTERNAL ONLY verified signature + amount/currency payment guard; confirmed short-circuit before recoverable payment/ledger writes; ledger SDK error ignored; wallet replay race/currency mismatch; expiry unconditional race; partial_refunded/expired enum absent: blocking |
| cleanup-abandoned-orders / escalate-stale-transfers / notify-transfer-booking | INTERNAL ONLY/UNKNOWN actor+state reconciliation; not declared safe without finite handler tests |
| ical-sync / ical-scheduled-sync | LEGACY internal booking adapters; source/date/parent authority and multi-parent rules not globally certified |
| e2e-mark-paid | INTERNAL ONLY test secret; client e2e_seed metadata is not trusted isolation, live paid enum/schema mismatch; no invocation |
| Archived expiry handlers / historical migration DML | LEGACY, never replayed as QA |

## Tests and what is not verified

- New `finalOrderMutation.postgres.test.ts`: **75/75**. Disposable Unix-socket PostgreSQL, no TCP/production credentials; captures actual live guard/wallet exploit before fixes. Exact wallet migration tested separately before full **unapplied** candidate. Tests do not certify all live triggers/constraints, checkout completion, space-limited parent isolation or cancellation payment race.
- Combined selected date/inventory/E1–E2.9/payment regressions: **296/296** = new 75 + retained 221. Prior separate agent run 43/43 is not added to this total.
- `scripts/qa/final-order-handlers.mjs`: **19/19** actual signed ingress/terminal/type/conditional-state cases, no financial RPC/mail/refund/network. Success-side effects deliberately stop at stub boundary, not end-to-end fulfillment.
- Retained actual handler suites: booking-message **21/21**, operating-security **10/10**. No real webhook/payment/order/cancel/refund was invoked.
- Automatic build log OK. No manual build/typecheck. Full canonical finance atomicity, duplicate Stripe settlement/refund, wallet concurrent replay, foreign-space parent mutation and legitimate legacy wallet checkout remain **unverified/blocking**.
- Retained civil-date/inventory suite: **58/58 each** in UTC, Asia/Bangkok and America/Los_Angeles (174 executions, not additional unique tests).

## Production read-only evidence

Before `2026-10-17 06:54:45.191957+00`; after 0033 `2026-10-17 07:00:49.87996+00`:

| Aggregate | Before = after |
|---|---:|
| enforced/spaces/assignments/members | 0 / 0 / 0 / 0 |
| orders / total | 416 / 7,558,520.00 |
| items / total | 100 / 3,221,830.00 |
| payment intents / total | 7 / 253,630.00 |
| ledger entries / total | 136 / 20,505,150.00 |
| property bookings / total | 82 / 1,559,500.00 |
| wallets / balance / transactions | 19 / 0 / 12 |

All compared aggregates identical. Read-only ACL query confirms both wallet RPCs: anon false, authenticated false, service_role true. Aggregate equality does not prove absence of concurrent value-only business edits; this work issued no business mutations. Deployment invoked no handler.

## E3 decision and next gate

**NO-GO.** Remaining defects above are blocking proven integrity paths, not cosmetically labelled non-blocking UNKNOWNs. Broad catalog/support work was not continued.

**Recommendation:** close canonical creation/quote + finance settlement/refund transaction contracts and migrate existing manual/wallet writers before applying broader restrictions. This is required to preserve legitimate workflows without granting invented finance authority. Then run the full actor/space/idempotency/inventory matrix against exact live definitions; E3 remains a separate decision.

Observed commit SHA and final evidence manifest: [verification.json](final_order_mutation/verification.json). The observed SHA is a tool-managed repository checkpoint, not a claim of a manually created final commit.

Observed completed-code checkpoint: `20b47ac85ea55266da5f6d205f6d9ac47195b8e8`; final documentation checkpoint may advance automatically after this observation.