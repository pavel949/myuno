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

## 2026-10-17 · Revised master task P0-A continuation

Starting HEAD `c839a53568b8e14ee277f5739e85c3f1b56f6262`. Approved execution starts at P0-A only. Previous evidence above remains historical; no GO-A or cutover authorization is inferred.

### Proven refund defect and bounded containment

The previous `refund-transfer-order` queried nonexistent `payment_intents.stripe_payment_intent_id`, ignored the SDK error, then wrote `metadata.refunded_at/refund_method=manual` and returned success when no payment was resolved. Live read-only schema at `2026-10-17 08:27:06.304502+00` confirms `provider_ref/provider_session_id`, not that column. It also treated metadata as completed refund proof and moved Stripe money without an approved reversal ledger contract.

`supabase/functions/refund-transfer-order/index.ts` now keeps internal-secret ingress, validates UUID-only order identity plus bounded reason, rejects additional fields and non-transfer objects, uses the existing payment columns, and **performs no Stripe call or business mutation**. Lookup errors return 503; missing/ambiguous payments and all unproved refund reconciliation return 409. It never returns refund success based on metadata or status. Automated refunds are intentionally unavailable until canonical reversal is approved; this is containment, not a working replacement refund process.

Changed files: refund entrypoint; `scripts/qa/refund-containment.mjs`; `docs/hardening/rollback/p0a_refund_containment.md`; this report; `roadmap.md`; root `AGENTS.md`. No schema, grants, RLS, prices, deposit rules, inventory semantics or commercial model changed. Deployment status and source checkpoint are recorded separately in `final_order_mutation/p0a-continuation.json`.

Tests: actual entrypoint RED reproduced missing validation before containment; GREEN **16/16** refund cases (unauthorized/forged payload, order/payment errors, foreign vertical, missing/pending/manual/settled/ambiguous payment, forged refund metadata, status-only proof and retry), with all writes/Stripe/outbound forbidden. Retained operator **19/19** is only the old ingress/terminal/type suite, not certification of successful confirmation/rejection. Selected PostgreSQL/date/inventory/payment regressions **129/129** (75 + 15 + 16 + 16 + 7). No real handler invoked; automatic preview build OK.

Read-only baseline: enforcement/spaces/assignments/members **0/0/0/0**; orders **416 / 7,558,520.00**; payment intents **7**; ledger entries **136**; property bookings **82**. Current live function MD5: create_order_checked `62f26cda6ac8eda0b835be281fa879c5`; guard_customer_order_update `124a15c2f1df3a63cf56e0655b857773`; record_ledger_entries `abb8bf8e00cbe002302aba2e69fe0ac5`; create_property_booking_from_order `7b8d680ebce7c742f069f15ffff4bd52`. These were read, not modified or fully recertified.

### Blocking contracts, not implicit permissions

- `quotePropertyStay` accepts a client-selected price range with overlapping legacy/season rates and maximum length/timing discounts; it is not one authoritative quote. Exact timing eligibility, stacking, negotiated-price/agent-markup authority are not established.
- PMS/manual writers currently create confirmed/paid truth directly. An approved staff-on-behalf, negotiated-price and deposit-versus-full-payment contract is necessary before safely replacing these writers and revoking every direct path.
- Manual RUB settlement needs an established conversion/tolerance/accounting contract; a generic staff/finance role cannot substitute for object authorization.
- Transfer signed confirmation still records ledger for unpaid orders; rejection still cancels before refund and may return success after a refund error. This caller is **PROVEN BYPASS / NOT FIXED**, not covered by the refund-only containment.
- Atomic settlement/reversal allocation, webhook recovery/replay, inventory adoption/overlap rollback and foreign-space parent mutations remain blocking. Broad `restrictive-fixes.sql` stays UNAPPLIED.

**GO-A NO-GO; P0-B and E3 not started.** Recommendation: establish exact property pricing/override and manual settlement/reversal contracts, then migrate checked writers and close direct paths in one tested compatibility gate; do not invent these business rules to claim closure.

Refund-only deployment acknowledged, submitted bundle SHA-256 `456ba90f604c813780d892f62e6ce2c3b7ca702943ad6b827c3c60020ff031e9`; entry SHA-256 `ad4d4a7128c09c9f093c90ee5065db06d164beb1758d91d4b53dcf8749785bfd`. No live business invocation. Independent review: refund-only GO; caller remains HIGH. Read-only after `2026-10-17 08:28:50.536478+00` equals the stated baseline aggregates. Observed completed-code checkpoint `3c2c184adb96d8695e6f33eb1aaaafcc643fbbd1`; documentation may advance automatically afterward.

## 2026-10-17 · P0-A price / manual-payment contract audit

Starting HEAD `e8cf6bae9b0b104d6c986753a768a77815c55a8c`. Detailed [trusted amount, actor/action and atomic-transition matrices](final_order_mutation/P0A_PRICE_SETTLEMENT_CONTRACTS.md); machine-readable [PC-01–PC-10 blocker register](final_order_mutation/p0a-contract-blockers.csv). These distinguish source mechanisms, current live capabilities, required invariants and proposals needing approval; no business rule was silently adopted.

Established: checked creation is actor-bound but price is caller-supplied; ordinary property quote accepts a compatibility range, while category pricing is a dedicated stronger path, not universal enforcement. Browser RUB estimate/rate and a persisted customer request are not verified financial sources. Manual confirmation has protected platform-admin ingress, not manager authority; company finance edit plus object duty is an existing scope predicate, not implicit permission to certify money. Generic staff/finance bypasses and org UPDATE remain unsafe. Current commission overloads/trigger/ledger have divergent units, precedence, counterparty resolution and snapshot behavior. `exchange_rates` is absent live; `currency_rates` and protected provider-org links exist; no new rail is introduced.

Manual request confirmation → order confirmation → ledger are separate writes; retry may skip repair. Full-order ledger posting after an installment has no approved cash-versus-accrual contract; it is an integrity blocker, not a claim that full-order accrual is necessarily commercially forbidden. Operator acceptance/cancellation is not receipt/reversal proof; `notify-transfer-booking/index.ts:262–275` also invokes ledger for caller-selected cash/concierge advance without verified receipt at that boundary, retained under PC-04/PC-07 rather than certified. Earlier historical July guard fixes remain absent live and are not counted as defenses.

No handler, migration, RLS, grant, financial rule or production business data was changed in this continuation. Existing wallet/refund containment stays intact; **remaining unsafe direct/manual/operator paths were not newly blocked**. Their use is not authorized by this audit. GO-A/P0-B/E3 remain **NO-GO**.

Executed retained isolated suites: **161/161** Vitest (17 property quote + 15 hotel quote + prior 129 financial/date/inventory/payment cases), refund entrypoint **16/16**, signed operator boundary **19/19**. No new rule tests are required for documentation-only classification; these counts are not a full settlement/replay compatibility certificate. All network/business side effects forbidden by handler harnesses; PostgreSQL tests use disposable local fixtures. Two independent read-only investigations supplied evidence; historical-only defenses from their outputs were rejected where contradicted by live catalog.

Read-only snapshot `2026-10-17 08:35:30.635527+00`: enforced/spaces/assignments/members **0/0/0/0**; orders **416 / 7,558,520.00**, payment intents **7**, ledger **136**, property bookings **82**, equal to prior continuation evidence. Final snapshot and observed SHA are recorded in `p0a-continuation.json`; SHA is an observed tool-managed checkpoint, not a manually authored final commit.

**Рекомендую:** approve PC-01–PC-05 bounded pricing, override, receipt/FX, installment/reversal and counterparty/commission decisions first; then replace checked writers and close direct bypasses under exact isolated compatibility tests. No implicit new finance role or automatic next tranche.