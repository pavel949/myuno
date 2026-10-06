# myUNO production hardening — preflight and executable plan

## 1. Environment facts (verified this turn, read-only)

- Repo: Lovable-hosted git, project `dcc2b024-7627-4ad9-a915-a3df3dd839f0`. The origin URL is Lovable's internal git storage, not a GitHub URL, so the GitHub owner/repo name cannot be read from the sandbox. CLAUDE.md says GitHub sync uses `main` and Vercel auto-deploys from `main`. **Open question for Pavel:** what is the exact GitHub owner/repo?
- Default branch: `main`. The current session runs on Lovable edit branches (`edit/edt-*`). HEAD is `f1f054de6`. Audit commit `6554702e` exists in history, and the code has changed since then.
- `AGENTS.md`: **does not exist** (only `CLAUDE.md` and `.claude-AGENTS.md`). It will be created in slice 1 for architecture rules.
- Database: **one shared database** (`kakkwibljrjsawxgnupk`) serves preview, published and myuno.app. There is no staging database. `vite.config.ts` hardcodes it as the fallback.
- Effect of changes: every Lovable migration **applies immediately to production**. Edge function deploys also go live. Frontend code reaches production only when published or merged. The drafts feature (an isolated backend per draft) exists but has not been checked. **Phase 0 checks whether it can work as staging.**
- CI: lint, knip, ts-prune and depcheck use `continue-on-error`, so their failures do not block a merge. Playwright e2e runs, but whether it blocks merges is unconfirmed.

## 2. Audit findings revalidated against the live database

| Finding | Status |
|---|---|
| `create_order_atomic` is SECURITY DEFINER, authenticated users can call it, and it accepts `p_customer_user_id` and `p_total_amount` from the client | Confirmed (from the function signature and permissions). The function body is reviewed in Phase 0. |
| `create_booking_with_wallet_payment` accepts `p_user_id` and `p_total_amount`, and authenticated users can call it | Confirmed |
| `process_payout` and `record_ledger_entries` can be called by authenticated users | Confirmed. Missing actor checks are reviewed in Phase 0. |
| `credit_cashback` can be called by authenticated users | Confirmed. The use of `customer_id` is checked in the body in Phase 0. |
| Broad own-order UPDATE (`orders_update_own`, `Order owners can update`) with no column restrictions | Confirmed. A customer can change status and amounts. |
| `service_orders`: a guest can update the whole row while the order is pending | Confirmed |
| ON CONFLICT `external_id` failed with 42P10 | **Fixed earlier in this session** (full unique index `property_bookings_external_id_key`). Three overlapping indexes now exist and need consolidation. |
| `ServiceBooking.tsx` uses invented fallback services | Confirmed (`fallbackServices`, line 33) |
| Checkout has only a price floor, trusts the client's night count and hardcodes 10%; webhook guards; MC `property_id` vs `resource_id`; mismatch between participants and guests; vendor gross amounts labelled as revenue; availability sources disagree | Not yet re-read. These go into the Phase 0 evidence list. |

## 3. Canonical flows (target)

```text
Rental:  search -> quote(server) -> hold(property_bookings, TTL) -> order(orders) -> payment_intents
         -> stripe-webhook (idempotent, amount-checked) -> confirm -> record_ledger_entries
         -> PMS tasks -> check-in -> check-out/complete -> cashback(wallet ledger) -> owner payout
         refund: refund edge -> reverse ledger -> release hold
Service: catalogue + provider_availability -> quote(server) -> service order bound to provider_id
         -> provider accept -> fulfil -> release / dispute -> ledger -> payout; refund reverses ledger
```
The authoritative owners are: `orders` (money), `ledger_entries` (accounting), `property_bookings` (inventory) and `payment_intents` (Stripe state). `bookings` and `service_orders` stay legacy until they are moved behind adapters.

## 4. Phases

**Phase 0 — Evidence and inventory (read-only, about 1 turn)**
- Dump the bodies of the 6 RPCs, all triggers on orders, property_bookings, service_orders, payment_intents and wallet tables, and the policies.
- Grep every caller (src hooks, edge functions) of orders, bookings, property_bookings, service_orders, payment_intents, wallets and ledger. Write the results to `docs/hardening/inventory.md`.
- Check that drafts give an isolated database. If they do, they become staging for migrations.

**Phase 1 — Code-only first slice (safe, no database change)**
- `ServiceBooking.tsx`: remove `fallbackServices`, show an empty or error state, and pass `provider_id` (as `PetServiceBooking` does).
- Vendor totals: relabel gross as «Оборот» and show net payout separately.
- Make lint and unit tests block CI (remove `continue-on-error` from lint and vitest only). Keep the `any` baseline gate.
- Create `AGENTS.md` with the rules: there is a single shared prod DB, and authoritative-table ownership.
- Tests: a vitest for ServiceBooking (empty state, `provider_id` in the payload) and CI going red on a deliberate lint error.

**Phase 2 — Lock exposed RPCs (database, additive, one migration per function)**
- REVOKE EXECUTE from authenticated on `process_payout`, `record_ledger_entries` and `credit_cashback` (service_role only), after Phase 0 confirms that no client caller exists (`useAdminPayouts` calls `process_payout` and must move to an admin edge function first).
- `create_order_atomic` and the wallet RPC: force `auth.uid()` as the customer, require amount > 0, and recompute the price on the server from listing/service rates.
- Depends on Phase 0 (caller list) and an edge adapter for admin payouts.

**Phase 3 — Order mutation surface**
- Replace the broad own-order UPDATE with column-limited RPCs (cancel_own_order, update_notes). Same for `service_orders` guest updates.

**Phase 4 — Checkout and webhook**
- Server-side night count and fee from `commission_agreements` instead of the hardcoded 10%.
- Webhook: idempotency key, amount and currency equality check, status-transition guard, and a retry queue for ledger writes.
- Unify the MC commission key (`resource_id`) and participants (primary guest plus `guests` metadata).

**Phase 5 — Availability and legacy consolidation**
- Make `property_bookings` plus `provider_availability` the single source of availability. Align RLS and realtime. Consolidate the three external_id indexes. Use adapters (views or triggers) for `bookings` and `service_orders`.
- Reconciliation must report zero new drift before any legacy write path is frozen. Nothing is dropped.

**Phase 6 — End-to-end verification**
- Playwright, signed in with a test user marked `e2e`: rental booking to Stripe test payment to ledger to payout, and service order to provider accept to refund.
- Production readiness is claimed only after these pass.

## 5. Acceptance criteria per slice
- Build is green, vitest is green, and the new tests fail before the fix and pass after it.
- Database slices: negative SQL tests as an authenticated non-owner (expect permission denied), run on a draft database if one is available. Otherwise use a test account on prod and check that reconciliation shows no new alerts.

## 6. Constraints and rollback
- There is no staging database, so every migration is live. Each migration is additive and paired with a written rollback SQL (GRANT back or restore the previous function body) stored in `docs/hardening/rollback/`.
- Edge functions: redeploy the previous version from git.
- Frontend: revert through Lovable history.
- No data deletes. Data fixes are recorded with before/after counts.
- No external notifications during testing (WhatsApp and email functions are skipped for rows marked `e2e`).

## 7. Decisions needed from Pavel
1. The exact GitHub owner/repo.
2. Approval to use a test account on prod for the signed-in checks if drafts are not isolated.

Рекомендую: начать с фазы 0 и сразу за ней фазы 1 — фаза 1 меняет только код, база не затрагивается, и это закрывает выдуманные услуги и неблокирующий CI.
