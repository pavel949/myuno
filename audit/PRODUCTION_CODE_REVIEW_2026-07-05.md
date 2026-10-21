# myUNO — Production-Grade Code Review

**Reviewer:** Principal Architect / Security Auditor pass
**Date:** 2026-07-05
**Commit reviewed:** `2a755bf` (branch `claude/production-code-review-tl2aef`)
**Scope:** Full codebase — 2,429 TS/TSX source files, 176 Supabase Edge Functions (Deno 2.0), 794 SQL migrations, React 18 + Vite 6 SPA. DB is managed on Lovable Cloud (prod ref `kakkwibljrjsawxgnupk`); this review is **static** (migrations + code), not live-DB, because the MCP-visible Supabase project is a non-prod mirror per `CLAUDE.md`.

**Method:** Six parallel specialist passes (payments/edge security ×2 independent, DB/RLS, frontend auth & React correctness, architecture, performance) plus firsthand verification by the lead reviewer of every CRITICAL and the highest-impact HIGH findings. One agent finding (`system_config` public read) was **disproven** on verification and is documented below as already-remediated — included to show the verification discipline, not as an open issue.

---

## 1. Executive Summary

myUNO is a **large, fast-grown super-app that has already absorbed several serious security-hardening passes** — and it shows. The payment webhook verifies Stripe signatures and fails closed, order confirmation is idempotent via an atomic conditional `UPDATE`, rate-limiting is atomic under an advisory lock, SSRF is guarded, CORS is allow-listed (no wildcards on money moves), secrets are clean (`npm audit`: **0 vulnerabilities**; no service-role keys or hardcoded secrets in `src/`; only 2 `console.log`), and role-based access is server-verified via `has_role` RPCs rather than client state. The edge-function layer, with its shared `_shared/` kernel adopted by ~169 of 193 functions, is the best-architected part of the system. Recent migrations even caught and fixed a `profiles.user_type` self-escalation and the customer-path order-tampering bug. This is materially above the security baseline of a typical app this size.

**However, the hardening was applied along the *customer* code path, and the same tables are writable through *vendor/operator/business-owner* RLS policies that the guards do not cover.** The single most important theme of this review: the row-level financial-integrity triggers added on 2026-06-29 gate only `auth.uid() = customer_user_id`, so a vendor org-member can still directly `UPDATE orders SET status/total_amount/vendor_payout_amount`, a provider can self-write `providers.pending_payout`, and a customer can self-mark `order_payment_stages` as paid. These are client-reachable (confirmed in shipped `.tsx` call sites), not theoretical. In parallel, a handful of checkout Edge Functions (`create-property-deposit-checkout`, `create-yacht-checkout`, `create-wellness-checkout`, `create-legal-checkout`) skip the server-side price validation their siblings perform, and one client flow (`TableReservation`/`SetMenuBooking`) silently falls through to a *confirmed, unpaid* booking when the Stripe call fails.

**Verdict:** Architecturally sound and security-*aware*, but with a **coherent cluster of financial-integrity gaps** on the non-customer write paths that are individually CRITICAL and collectively chainable (inflate balance → request inflated payout). None require privileged access — an ordinary authenticated user/vendor can reach them. **These should be closed before the switch from Stripe test keys to live keys.** Everything else (architecture debt, performance, type debt) is normal, well-tracked, and non-blocking.

### Severity tally (open findings)

| Severity | Count | Domains |
|---|---|---|
| CRITICAL | 7 | RLS financial writes (3), checkout price tampering (3), payment-bypass fallthrough (1) |
| HIGH | 11 | IDOR, ledger integrity, admin minting, cart data-loss, impersonation guard, INP, N+1 |
| MEDIUM | 11 | marketplace integrity, unauth notify/AI, timing-safe compares, images, error-reporting bug |
| LOW / INFO | ~10 | CORS hygiene, redirect validation, type-import nits |

---

## 2. Security & Vulnerability Assessment

### CRITICAL

#### C-1. Vendor/operator path bypasses the `orders` financial-integrity trigger
**`supabase/migrations/20260629160000_security_audit_hardening.sql:71-78`** (trigger) vs **`20260119053257_...sql:106-135`** (vendor UPDATE policy).
The `guard_orders_protected_columns` trigger blocks changes to `status`, `total_amount`, `platform_fee_amount`, `vendor_payout_amount` — but only under `auth.uid() = OLD.customer_user_id AND NOT is_admin_or_uno_team()`. The live `"Vendors can update own org orders"` policy grants UPDATE to any org-member of `provider_org_id`, for whom that condition is **false**, so the guard never fires. Confirmed client-reachable: `src/pages/operate/OperatorTransfers.tsx:87` and `src/pages/owner/MCBookingsPage.tsx:319,337` issue `supabase.from('orders').update({ status })` directly from the browser as vendor/operator.
**Exploit:** a vendor sets `status='completed'` + inflates `vendor_payout_amount` on their own org's order via a raw REST call; the payout flow then pays the inflated amount.
**Fix:** widen the trigger to *any* non-admin authenticated caller, and route legitimate vendor status transitions through a `SECURITY DEFINER` state-machine RPC:
```sql
CREATE OR REPLACE FUNCTION public.guard_orders_protected_columns()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin_or_uno_team() THEN
    IF NEW.status            IS DISTINCT FROM OLD.status
    OR NEW.total_amount      IS DISTINCT FROM OLD.total_amount
    OR NEW.platform_fee_amount   IS DISTINCT FROM OLD.platform_fee_amount
    OR NEW.vendor_payout_amount  IS DISTINCT FROM OLD.vendor_payout_amount THEN
      RAISE EXCEPTION 'Not authorized to modify order status or financial fields';
    END IF;
  END IF;
  RETURN NEW;
END; $$;
```

#### C-2. `providers`: a vendor can self-write their own payout balance
**`supabase/migrations/20260108232401_...sql:334-337`.**
```sql
CREATE POLICY "Owners can manage their own provider"
  ON public.providers FOR ALL TO authenticated
  USING (auth.uid() = user_id);   -- FOR ALL, no WITH CHECK → USING reused for writes, every column
```
No column guard exists on `providers`. `pending_payout`, `total_earnings`, `approval_status`, `stripe_account_id` are all self-writable. `process_payout()` (correctly admin-gated) computes payouts *from* `pending_payout`, so this bypasses that authorization entirely.
**Exploit:** `supabase.from('providers').update({ pending_payout: 999999 }).eq('id', myProviderId)`.
**Fix:** add a `guard_providers_protected_columns` `BEFORE UPDATE` trigger mirroring C-1 (blocks `pending_payout`/`total_earnings`/`approval_status` for non-admins).

#### C-3. `order_payment_stages`: customer can self-mark deposit/balance stages paid
**`supabase/migrations/20260122131140_...sql:186-196`** — `FOR UPDATE` with only a `USING` (ownership) clause, no `WITH CHECK`, so `status`, `amount`, `paid_at`, `refund_amount` are all writable by the row owner. Models real-estate deposit installments.
**Exploit:** customer sets `status='paid', paid_at=now()` on a large balance stage without paying, or fabricates `status='refunded', refund_amount=<large>`.
**Fix:** `WITH CHECK (public.is_admin_or_uno_team())`; customer transitions go through an RPC.

#### C-4. `create-property-deposit-checkout`: `total_amount` never validated against the property's real rate
**`supabase/functions/create-property-deposit-checkout/index.ts:88-113`.** The only check is `deposit_amount ≈ 10% × total_amount` — but `total_amount` is 100% client-supplied and never recomputed from `properties.price_per_night × nights (+ cleaning_fee)`. This is the **only** deposit/checkout vertical that does not call `_shared/price-guard.ts`. Both independent security passes flagged it.
**Exploit:** POST a real property + real dates with `total_amount: 100, deposit_amount: 10` → passes the ratio check → `create_order_atomic` reserves real inventory → Stripe charges 10 THB → webhook confirms a genuine booking for pennies.
**Fix:** look up the authoritative rate server-side and override the client values:
```ts
const { data: property } = await supabaseAdmin.from("properties")
  .select("price_per_night, price, cleaning_fee, is_active").eq("id", property_id).maybeSingle();
if (!property || property.is_active === false) throw new Error("Invalid or unavailable property");
const rate = Number(property.price_per_night ?? property.price);
const serverTotal   = Math.round(rate * nights + Number(property.cleaning_fee ?? 0));
const serverDeposit = Math.round(serverTotal * 0.1);
// use serverTotal / serverDeposit everywhere downstream; ignore client total_amount/deposit_amount
```

#### C-5. `create-yacht-checkout`: client-controlled `deposit_amount` charged with zero validation
**`supabase/functions/create-yacht-checkout/index.ts:83,92`.** `base_price` is validated against the `listings` catalog, but the amount actually charged is `chargeAmount = deposit_amount && deposit_amount > 0 ? deposit_amount : total_amount`, and `deposit_amount` is taken verbatim from the body with no floor/percentage check.
**Exploit:** submit a valid `base_price` (passes the tamper check) with `deposit_amount: 1` → charter order created after Stripe collects 1 THB.
**Fix:** compute the expected deposit server-side from the validated `base_price` as a fixed percentage and reject values outside a small tolerance (exactly what `create-property-deposit-checkout` *should* do per C-4).

#### C-6. Restaurant booking: Stripe failure silently confirms an unpaid booking
**`src/pages/restaurants/TableReservation.tsx:110-163`** and **`SetMenuBooking.tsx:109-136`.** When `depositRequired && depositAmount > 0`, the handler calls `create-restaurant-checkout` and only checks `response.data?.url`; `response.error` is never inspected and there is **no `return` on failure**, so control falls through to `createBooking(...)` and then `setIsSuccess(true)`.
**Exploit:** block that one XHR in devtools (or any edge/network error) → "Booking Confirmed" screen with no deposit collected.
**Fix:** check `error`, surface a toast, and `return` before the no-payment path (the correct pattern already exists in `AirportTransferBooking.tsx:433-459`):
```ts
if (depositRequired && depositAmount > 0) {
  const { data, error } = await supabase.functions.invoke('create-restaurant-checkout', { body: {...} });
  if (error || !data?.url) { toast.error(isRu ? 'Ошибка оплаты' : 'Payment error'); return; }
  window.location.href = data.url; return;
}
```

#### C-7. `create-wellness-checkout`: whole verticals skip price validation
**`supabase/functions/create-wellness-checkout/index.ts:26-62`.** For `vertical === 'fitness'` there is no `validateItemPrices` call at all — client `item.price` flows straight into the Stripe line item. For `vertical === 'medical'`, any line whose `id` is not in `medical_services` silently skips validation. Documented in the code's own comments as a known gap.
**Fix:** gate fitness/unknown-id paths behind a hard-coded allowed-price table (as `create-legal-checkout` partially does) or block checkout until the catalog exists; never let an unvalidated line item reach `lineItems`.

### HIGH

- **H-1. `generate-booking-voucher` — unauthenticated IDOR (PII disclosure).** `supabase/config.toml:72-73` sets `verify_jwt = false`; the function (only `RATE_LIMITS.publicRead`) returns guest name, dates, property address, amount, and a check-in QR for **any** `orderId`, and inserts a voucher row. `order_id` leaks in success-URL query strings. **Fix:** require auth + ownership (or `requireInternalSecret` for the webhook call path).
- **H-2. `payment_intents` — forged `succeeded` rows deceive staff.** `20260119042142_...sql:436-438` INSERT policy has no `status`/`amount` constraint. A customer can insert `status='succeeded'` for their own order; `src/pages/admin/AdminTransfers.tsx:60-100` renders it as a green "paid" badge that ops trusts to dispatch. **Fix:** `WITH CHECK (status='pending' AND amount <= orders.total_amount)`; transitions only via webhook/admin.
- **H-3. `vendor_payouts` — self-requested amount unvalidated.** `20260111010523_...sql:280-283` INSERT policy doesn't check `amount <= providers.pending_payout`. Chains with C-2 into a fraudulent payout. **Fix:** add the `amount <= p.pending_payout` predicate (and fix C-2 first).
- **H-4. `create-legal-checkout` — unvalidated `service_fee` + no `enforceLineItemTotal`.** `service_fee` is trusted verbatim and `orders.total_amount` is not forced to equal the Stripe line-item sum, so `record_ledger_entries` (which derives platform-fee/vendor-payout from `total_amount`) can post amounts that never match what Stripe collected. **Fix:** set `enforceLineItemTotal: true` and bounds-check `service_fee`. *(Systemic note: the anti-tampering guard is opt-in and enabled on only 3 of ~19 checkouts — event/flowers/market. Audit each vertical's price source.)*
- **H-5. `admin-manage-user.add_role` — single admin mints admins.** `supabase/functions/admin-manage-user/index.ts:178-195` upserts any role incl. `admin` with only an audit-log insert. Directly contradicts `admin-invite-user/index.ts:36-38`, which claims a "2-admin chain" that is not implemented. **Fix:** implement the two-admin approval for `role==='admin'`, or deny minting `admin` via this generic endpoint.
- **H-6. `external-data-api` — service-role CRUD proxy behind one static token.** Full GET/POST/PATCH/DELETE over `crm_contacts` (PII) etc., non-constant-time token compare, no rate limit, no audit log, `DELETE` accepts arbitrary filters (mass-delete). **Fix:** `timingSafeEqual`, rate limit, audit every mutation, restrict DELETE/PATCH to PK, scope tokens per table.
- **H-7. `CartContext` stale-closure rollback → cart data loss.** `src/contexts/CartContext.tsx:255-302` — `removeItem`/`updateQuantity` capture `previousItems` from a closure whose deps are `[user]` (missing `items`), so a failed Supabase write rolls back to a stale snapshot, wiping items the user never touched. **Fix:** capture the snapshot inside the functional `setItems(prev => {...})` updater (as `addItem` already does).
- **H-8. `ImpersonationContext.enter()` has no admin check of its own.** `src/contexts/ImpersonationContext.tsx:61-80` — no `isAdmin` gate (unlike `PlatformViewAsContext`), and its only caller sits behind `InvestorGuard`, which admits `investor`/`capital_team`. Mitigated today because `useEffectiveDeveloperProfile` re-checks `isAdmin`, but it's fragile and corrupts the `admin_id` audit trail. **Fix:** `if (!user?.id || !isAdmin) return;` inside `enter()`.
- **H-9. INP — property card grid re-renders fully on hover.** `PropertySearchPage.tsx:67,383-399` holds `hoveredProperty` in the grid owner; `PropertyListingCard` (and all sibling cards) are **not** `React.memo`-wrapped, so every hover re-renders every card. **Fix:** wrap the card components in `React.memo` (O(gridSize) → O(2) re-renders).
- **H-10. N+1 serial RPC on the owner dashboard.** `src/hooks/useChannelHealth.ts:350-353` calls `detect_booking_conflicts` once per property in a serial `for` loop. **Fix:** batched/owner-scoped RPC, or at minimum `Promise.all`.
- **H-11. `DeliveryCheckout` invoke error unchecked → duplicate orders.** `src/pages/restaurants/DeliveryCheckout.tsx:145-168` ignores `response.error`; on failure the user gets no feedback and re-submits, creating duplicate `pending` orders. **Fix:** check `error`, toast, stop.

### MEDIUM

- **M-1. `thai_businesses` owner self-approves moderation + fakes ratings.** `20260629142449_...sql:141-144` owner UPDATE has no column exclusion; owner can set `is_active=true` (documented admin-only gate) and `rating_avg/rating_count`. GA'd consumer feature. **Fix:** column-guard trigger; ratings maintained only by a trigger off `thai_business_reviews`.
- **M-2. `thai_business_reviews` — no booking verification** (`...:227`), compounding M-1.
- **M-3. `profiles` INSERT not covered by the anti-escalation trigger.** `prevent_user_type_self_escalation` is `BEFORE UPDATE` only; `handle_new_user()` swallows all exceptions, so if the auto-insert ever fails, a client INSERT with `user_type='admin'` can win the race. **Fix:** `BEFORE INSERT OR UPDATE`.
- **M-4. `notify-vendor-order` / `send-order-email` fully unauthenticated.** Invoked server-to-server but check nothing; `send-order-email` trusts `amount`/`new_balance` from the body → spoofed "wallet topped up" email from the platform's verified domain (phishing amplification). **Fix:** `requireInternalOrUser`; re-derive wallet amounts from DB.
- **M-5. `e2e-mark-paid` — production payment-bypass gated only by a static token** with wildcard CORS. **Fix:** add an explicit environment/project-ref guard + `timingSafeEqual`; ensure `E2E_TEST_TOKEN` is never a prod secret.
- **M-6. `confirm-transfer-operator` — non-constant-time HMAC compare** (`index.ts:28`, `===`) guarding a refund-triggering action. **Fix:** use the existing `timingSafeEqual`.
- **M-7. AI proxies (`ai-agent`, `ai-translate`) unauthenticated** → per-IP rate limit only → cost-DoS on the paid gateway. **Fix:** require auth or a stricter global budget.
- **M-8. `mcp/index.ts:32,69` — PostgREST `.or()` filter injection.** User `query` concatenated into `title.ilike.%${query}%,...`; `,`/`)` can alter filter logic (bounded by RLS). **Fix:** escape or use per-column `.ilike()`/`.textSearch()`.
- **M-9. `errorHandler.silent()` is not silent** (`src/lib/errorHandler.ts:260-261` passes `silent:false`), so "silent" failures queue `analytics_events` writes in prod on every benign guest-cart read failure. **Fix:** pass `silent:true`.
- **M-10. Images — 247/276 `<img>` lack `loading="lazy"`; `OptimizedImage` used in only 7 files.** Salon detail hero (`SalonDetail.tsx:84`) has no `fetchpriority`. **Fix:** roll out `OptimizedImage` to catalog/detail heroes; lint new `<img>` without `loading`.
- **M-11. `bulk-import` spreads the whole client `record` into `insert()`** with no per-table column allow-list (scoped to staff roles, so requires a compromised staff account).

### LOW / INFORMATIONAL
- CORS hygiene: `apply-referral`, `e2e-mark-paid`, `external-data-api` use `*` instead of `getCorsHeaders`.
- `apply-referral` unauthenticated 10-minute window with no rate limit (referral-fraud, needs a leaked UUID).
- `vendor-stripe-onboard` / `devmod-stripe-onboard` pass client `return_url`/`refresh_url` to `stripe.accountLinks.create` unvalidated (bounded open-redirect tail). Reuse `getAllowedOrigin`.
- `create-checkout-session` has no upper bound on wallet top-up `amount`.

### Already remediated (verified — NOT open issues)
- **`system_config` public read:** an agent flagged `USING (true)`, but `20260615064529` restricted reads to admins and `20260618133012` added a **key-scoped** public policy exposing only `key='GOOGLE_MAPS_API_KEY'`. RLS is enabled and never disabled. **Resolved.**
- **`profiles.user_type` UPDATE self-escalation** — patched via `trg_prevent_user_type_self_escalation` + `user_roles` `WITH CHECK`.
- **Stripe webhook** — signature verified on raw body, fails closed if secret unset, idempotent conditional `UPDATE`.
- **Rate limiting** — atomic via `pg_advisory_xact_lock` (`20260621000000_rate_limit_atomic.sql`).
- **SSRF guard, CORS allow-list, `internal-secret.ts` constant-time compare, `create-checkout` IDOR guard** — all sound.
- **Dependencies:** `npm audit` = 0 vulnerabilities. No hardcoded secrets in `src/`.

---

## 3. Architecture & Design Patterns

**Strengths.** The edge-function shared kernel (`_shared/checkout-handler.ts` + ~20 modules, reused by ~169/193 functions) is genuinely well-factored. The single Supabase client is respected with only 2 rogue `createClient` calls in `src/` (both MCP tools, arguably justified). Feature-flag gating (`feature_flag:*` with kill-switch semantics) is applied consistently. Type debt is carried through **one** documented, shrinking escape hatch (`src/lib/untypedTables.ts`) rather than sprayed casts. Dead functions are parked in `_archive/`. No agent auto-executes money moves.

**Top structural risks.**
1. **[HIGH] Canon vs reality drift.** `docs/canonical/architecture/ARCHITECTURE_V2.md` §13 presents a target architecture (6 clusters, one shell, `/operate/*` collapse, L4 domain primitives) as if current — but it is largely unbuilt, and `FEASIBILITY.md` is the honest ledger. Hard rules 1–4 are silently violated at scale: `AnimatedRoutes.tsx` declares **450 routes** centrally (rule 1); 11+ shells exist (rule 2); **104 hardcoded hex** across 21 `.tsx` files, the promised lint block never activated (rule 3); the 6 colour-locked clusters have no module boundary in `src/`, so rule 4 can't be honored or violated. Rules 5 (no auto-money-moves) and 7 (feature flags) *are* real and enforced. **Action:** stamp unbuilt sections "TARGET — NOT SHIPPED" and make `FEASIBILITY.md` primary, or any agent trusting the blueprint will make wrong assumptions.
2. **[HIGH] God page-components.** `ContactDetail.tsx` (1,445), `CanonicalListingWizard.tsx` (1,452), `OwnerRentalTerms.tsx` (1,412 — embeds domain enums like electricity providers/deposit types inline), `CanonicalPropertyForm.tsx`, `PropertyEditor.tsx` fuse data access + business rules + form state + presentation. The L4 primitives meant to absorb this don't exist as a layer. **Action:** extract `use<Feature>Form` hooks + section components (the pattern already used well in `property-manage/*Section.tsx`); move domain enums to `lib/taxonomies`.
3. **[MEDIUM] 450-route god router** — continue the `*Routes.tsx` extraction already begun for mc/admin/property.
4. **[MEDIUM] Edge version drift** — 29 functions still import `@supabase/supabase-js` from npm directly instead of the versioned `_shared/supabase.ts` re-export whose whole purpose is version consistency. Mechanical sweep.
5. **[LOW] State discipline** — `DashboardFilterContext` holds filter/tab state that the repo's own `web/patterns.md` says belongs in the URL; `PlatformViewAsContext` + `ImpersonationContext` overlap and could merge.

`src/lib/filterRegistry.ts` (1,585 lines) is **not** a god-object — it's a flat static-data registry that intentionally replaced ~20 filter files. Leave it.

---

## 4. Performance & Resource Optimization

The build/routing layer is **mature**: hand-tuned `manualChunks` (`vite.config.ts:347-431`), `modulePreload` stripping of heavy chunks (documented ~600KB→~50KB win), 549 `lazyWithRetry` routes, Sentry deferred behind `requestIdleCallback`, memoized context values, `DeferredProvidersGate`, and a global `defaultQueryClientOptions` (`staleTime 1m`, `refetchOnWindowFocus:false`) across all 652 `useQuery` calls. The suspected `types.ts` bloat is a **non-issue** — pure `export type`, stripped at build (one `import type` nit in `useAdminExperiences.ts:2`).

**Real wins, prioritized:**
1. **[HIGH] `React.memo` the property card family** — see H-9 (biggest INP win on the hottest page).
2. **[HIGH] Batch the N+1 RPC** in `useChannelHealth.ts:350-353` — see H-10.
3. **[MEDIUM] Images** — roll out `OptimizedImage`, add `loading="lazy"` to the ~247 bare `<img>` — see M-10.
4. **[MEDIUM] Pagination** — `src/hooks/capital/useCapitalContacts.ts:21-40` does `select('*')` with no `.range()`/`.limit()`; mirror `useCrmContacts.ts:149-153`. Repo-wide: 478 `select('*')` vs 4 `.range()` — concentrated in admin/CRM back-office (lower audience), but any unbounded growing list should get a bound.
5. **[MEDIUM] List virtualization** — zero virtualization anywhere; add `@tanstack/react-virtual` to CRM/admin lists >~100 rows.
6. **[LOW] Cache profiles** — move static reference data (categories/cities/currencies) from the 1-min default onto `CACHE_PROFILES.STATIC`.

---

## 5. Code Quality, Readability & Modern Standards

- **Type safety.** ~759 `any`-patterns, tracked via a CI ratchet that is trending **up** (`745→758` bumped "to match main"). Real but contained/documented debt; the risk is the ratchet only ever increases. **Action:** regenerate types for the ~6 remaining untyped tables (`crm_reminders`, `social_posts`, `owner_prospects`, `ai_decisions_log`, `social_content_calendar`, `contact_properties`); flip the ratchet to decrease-only.
- **File size.** Multiple 1,000–1,585-line files; the CLAUDE.md/ECC rules set an 800-line ceiling. The god-components (§3.2) are the actionable subset.
- **Consistency wins already present:** conventional commits, bilingual i18n discipline, `console.log` effectively banned (2 left), no hardcoded admin contacts in edge functions (`_shared/admin-config.ts`).
- **Naming/idioms** are consistent with the stated conventions; shadcn/Radix usage is idiomatic.

---

## 6. Error Handling & Resilience

**Good:** webhook fails closed; order confirmation is idempotent; `_shared/checkout-handler.ts` logs non-fatal insert failures (addresses/participants/payment_intents) loudly with the order id for reconciliation; `errorHandler.ts` has a structured severity model with prod reporting.

**Gaps (all fixable, cited above):**
- **Silent success on failure** is the dominant resilience bug pattern — C-6 (payment fallthrough), H-11 (unchecked invoke → duplicate orders). Several `functions.invoke` call sites check `data?.url` but never `error`. The correct reference implementations exist in the same codebase (`AirportTransferBooking.tsx`, `Wallet.tsx`, `DepositPaymentOptions.tsx`) — align the rest.
- **Silent data corruption** — H-7 stale-closure cart rollback.
- **Mislabeled swallow** — M-9 `errorHandler.silent()` isn't silent.
- **Swallow-all** — `handle_new_user()` wraps its whole body in `EXCEPTION WHEN OTHERS ... RETURN NEW`, which both hides real failures and enables the M-3 race.
- **Recommendation:** add an ESLint rule flagging `supabase.functions.invoke(...)` results whose `.error` is never read; add a CI regression test asserting money-table policies always carry a `WITH CHECK` and SECURITY DEFINER functions always `SET search_path` (both patterns have already regressed once each in migration history — `thai_bookings_update`, `email_infra`).

---

## 7. Prioritized Remediation Roadmap

**Before switching Stripe to live keys (CRITICAL cluster):**
1. C-1/C-2/C-3 — add non-customer column-guard triggers to `orders`, `providers`, `order_payment_stages` (+ `WITH CHECK`). One migration.
2. C-4/C-5/C-7 — server-side price validation in property-deposit, yacht, wellness checkouts.
3. C-6 — stop the restaurant payment-bypass fallthrough.

**Next (HIGH):**
4. H-1 auth on `generate-booking-voucher`; H-2 `payment_intents` INSERT constraint; H-3 `vendor_payouts` amount check; H-4 `enforceLineItemTotal` on legal (+ audit all verticals); H-5 two-admin gate; H-6 `external-data-api` hardening.
5. H-7 cart rollback; H-8 impersonation guard; H-9 memo cards; H-10 batch RPC; H-11 checkout error handling.

**Then (MEDIUM/quality):** thai-business moderation guards, unauth notify/AI functions, timing-safe compares, images, `errorHandler.silent`, type-debt paydown, god-component extraction, canon/reality doc reconciliation.

**Do not touch:** the vite chunking strategy, deferred providers, `lazyWithRetry`, the webhook idempotency pattern, `filterRegistry.ts`, the shared edge kernel — these are intentional and well-executed.
