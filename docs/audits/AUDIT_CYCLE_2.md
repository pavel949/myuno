# MyUNO — Audit Cycle 2
## Focus: Booking Flow · CRM Logic · Edge Functions Security · Mobile/Capacitor

**Date:** March 2025  
**Build:** Verified (npm run build passes).  
**Format:** Findings in standard format; inline checklist; findings log; scorecard.

---

# PART A — FINDINGS

## ZONE 1 — BOOKING FLOW

### 1.1 Flow integrity
- **Entry points:** Market checkout (`MarketCheckout.tsx` + `useStripeUnifiedCheckout`), property deposit (`DepositPaymentOptions.tsx` → `create-property-deposit-checkout`), transport (`create-checkout`), flowers/restaurant/service checkouts. Multiple verticals; no single canonical state machine document.
- **Gap:** After payment, user is sent to Stripe then redirected to `success_url` (e.g. `/bookings/${order.id}?success=true`). If `send-order-email` or voucher generation fails in the webhook, the order is already `confirmed` and the user sees success — correct. No finding on flow “dying” at one step; idempotency in webhook is present.

### 1.2 Payment (Stripe) — Critical / High

**FINDING 1 — create-order-checkout: amount from client (Critical)**  
**SEVERITY:** Critical  
**ZONE:** Booking  
**FILE:** supabase/functions/create-order-checkout/index.ts (lines 76–84, 207–218)  
**PROBLEM:** Total amount and Stripe line items are derived entirely from the request body (`items[].unit_price`, `items[].qty`). The server does not validate prices against product/listing data. A client can send arbitrary `unit_price` and `qty` and be charged that amount.  
**EVIDENCE:**
```ts
const total_amount = items.reduce((sum, item) => sum + (item.qty * item.unit_price), 0);
// ...
const lineItems = items.map(item => ({
  price_data: {
    unit_amount: Math.round(item.unit_price * 100),
  },
  quantity: item.qty,
}));
```
**FIX:** Fetch product/listing prices from DB by `product_id` (and optionally `resource_id`); compute `total_amount` and `line_items` server-side; reject or override client-supplied prices.  
**EFFORT:** 4–6h

---

**FINDING 2 — create-checkout: amount from client (Critical)**  
**SEVERITY:** Critical  
**ZONE:** Booking  
**FILE:** supabase/functions/create-checkout/index.ts (lines 39–40, 68–78)  
**PROBLEM:** Request body includes `amount` and it is used directly for Stripe `unit_amount`. No check against the order’s stored total.  
**EVIDENCE:**
```ts
const { order_id, order_type, amount, currency = "THB", ... } = body;
// ...
unit_amount: Math.round(amount * 100),
quantity: 1,
```
**FIX:** Load the order by `order_id`, verify `order.customer_user_id === user.id`, use `order.total_amount` (or equivalent) for the session amount; ignore client `amount` or use only for display.  
**EFFORT:** 2h

---

**FINDING 3 — create-property-deposit-checkout: total/deposit from client (High)**  
**SEVERITY:** High  
**ZONE:** Booking  
**FILE:** supabase/functions/create-property-deposit-checkout/index.ts (lines 65–79, 88–89)  
**PROBLEM:** `total_amount` and `deposit_amount` come from the client. Validation only ensures deposit is ~10% of total. The server does not verify `total_amount` against property rates or availability; the charged amount is client-supplied `deposit_amount`.  
**EVIDENCE:**
```ts
const { total_amount, deposit_amount, ... } = body;
const expectedDeposit = Math.round(total_amount * 0.1);
if (deposit_amount < expectedDeposit * 0.95 || deposit_amount > expectedDeposit * 1.05) { ... }
```
**FIX:** Look up property and dates; compute nightly rate (or use existing pricing RPC); compute `total_amount` and `deposit_amount` server-side; reject if client values differ beyond tolerance.  
**EFFORT:** 4h

---

**FINDING 4 — No idempotency key on Stripe Checkout Session creation (High)**  
**SEVERITY:** High  
**ZONE:** Booking  
**FILE:** supabase/functions/create-order-checkout/index.ts (line 225), create-checkout/index.ts (line 68)  
**PROBLEM:** `stripe.checkout.sessions.create` is called without an idempotency key. Retries (e.g. user double-click, network retry) can create multiple sessions and multiple orders.  
**EVIDENCE:** No `idempotencyKey` or similar option in the `stripe.checkout.sessions.create` call.  
**FIX:** Use Stripe’s idempotency key (e.g. `Idempotency-Key: order_${order.id}` for create-order-checkout after order is created, or a client-supplied key tied to a single order creation). For create-order-checkout, at least ensure one order per idempotency key (e.g. pass key from client, skip order creation if key already used).  
**EFFORT:** 2h

---

**FINDING 5 — Stripe webhook: signature verification and idempotency (OK)**  
**SEVERITY:** N/A (positive)  
**ZONE:** Booking  
**FILE:** supabase/functions/stripe-webhook/index.ts (lines 57–76, 112–119, 147–165)  
**EVIDENCE:** `stripe.webhooks.constructEvent(body, signature, webhookSecret)` is used; webhook rejects if secret missing. Idempotency: order status “already confirmed” skips processing; order_status_history and notification inserts are guarded by existence checks.  
**FIX:** None.  
**EFFORT:** 0

---

**FINDING 6 — Stripe webhook: long-running work before 200 (Medium)**  
**SEVERITY:** Medium  
**ZONE:** Booking  
**FILE:** supabase/functions/stripe-webhook/index.ts (lines 199–238, 783)  
**PROBLEM:** Handler awaits `send-order-email` and `generate-booking-voucher` before returning HTTP 200. If these are slow, Stripe may timeout and retry, increasing duplicate-processing risk despite idempotency.  
**EVIDENCE:** `await fetch(...send-order-email...)`, `await fetch(...generate-booking-voucher...)`, then `return new Response(..., status: 200)`.  
**FIX:** Return 200 immediately after persisting order/status and ledger; enqueue or fire-and-forget email and voucher (e.g. via queue or non-awaited fetch). Ensure email/voucher logic is idempotent.  
**EFFORT:** 2–3h

---

### 1.3 Booking state consistency
- **Orders:** Status flow `pending` → `confirmed` (via webhook). Webhook updates order to `confirmed` and then sends notification; if notification fails, order remains confirmed (correct).
- **Stuck state:** No timeout/cleanup job found for abandoned `pending` orders; they can remain pending indefinitely. **Finding 7** below.

**FINDING 7 — No cleanup for abandoned pending orders (Medium)**  
**SEVERITY:** Medium  
**ZONE:** Booking  
**FILE:** N/A (missing)  
**PROBLEM:** Orders in `pending` (created but never paid) are not expired or cancelled. Inventory/slots may appear blocked.  
**EVIDENCE:** No cron or Edge Function found that updates old `pending` orders to `expired` or `cancelled`.  
**FIX:** Add scheduled function or cron that sets `status = 'expired'` (or `cancelled`) for orders where `status = 'pending'` and `created_at < now() - interval '1 hour'` (or 24h).  
**EFFORT:** 2h

---

### 1.4 Availability & race conditions
- **Server-side re-validation:** create-order-checkout and create-property-deposit-checkout do not re-validate slot availability at checkout time.
- **Double-booking:** No UNIQUE constraint found on `property_bookings` (or equivalent) on (property_id, check_in, check_out) or similar. Two concurrent requests could create two bookings for the same slot.

**FINDING 8 — No DB-level prevention of double-booking (High)**  
**SEVERITY:** High  
**ZONE:** Booking  
**FILE:** supabase/migrations (property_bookings table)  
**PROBLEM:** No unique constraint on property + date range for property_bookings (or orders with resource_id + start_at/end_at). Concurrent checkout can result in overbooking.  
**EVIDENCE:** Grep of migrations did not show UNIQUE on property_bookings for (property_id, check_in, check_out).  
**FIX:** Add a unique index or constraint that prevents two confirmed bookings for the same property overlapping in time (e.g. EXCLUDE using gist for daterange, or application-level lock + unique on (property_id, date)).  
**EFFORT:** 2–4h

---

### 1.5 Post-booking
- **Confirmation page:** success_url is `/bookings/${order.id}?success=true`; user lands on in-app route. DepositPaymentOptions uses `window.location.href = data.url` to go to Stripe (correct for redirect to external payment).
- **Email retry:** send-order-email is invoked from webhook with no retry logic in the audit; if it fails, notification is skipped (order still confirmed). No retry mechanism found.
- **Booking visible:** Order is updated to `confirmed` in webhook; listing by user will show it.

**FINDING 9 — No retry for confirmation email failure (Low)**  
**SEVERITY:** Low  
**ZONE:** Booking  
**FILE:** supabase/functions/stripe-webhook/index.ts (lines 199–220)  
**PROBLEM:** If `send-order-email` fails, the catch only logs; there is no retry or queue.  
**EVIDENCE:** `try { await fetch(...send-order-email...); } catch (emailError) { logStep("WARN", ...); }`  
**FIX:** Option A: Enqueue “send order confirmation” job and process with retries. Option B: Leave as-is but document; add monitoring/alert on failure.  
**EFFORT:** 2–4h (queue) or 0.5h (doc/monitor)

---

## ZONE 2 — CRM / PIPELINE LOGIC

### 2.1 Pipeline state machine
- **Stages:** `deal_pipeline_stages` and `useDealPipelineStages` / `usePipelineStages`; default stages (new → closed_won/lost) exist.
- **Transitions:** Deal stage is updated in `useAgentDeals` / `useBulkUpdateStage` via `.update({ stage })`. No server-side or client-side validation that the new stage is allowed from the current stage (e.g. can skip from `new` to `closed_won`).

**FINDING 10 — Pipeline stage transitions not validated (Medium)**  
**SEVERITY:** Medium  
**ZONE:** CRM  
**FILE:** src/hooks/useAgentDeals.ts (bulk update), MC deal update flows  
**PROBLEM:** Any stage can be set on a deal; no check that the transition is valid (e.g. from `new` to `closed_won` without intermediate steps).  
**EVIDENCE:** `useBulkUpdateStage` does `.update({ stage }).in('id', ids)` with no transition rules.  
**FIX:** Define allowed transitions (e.g. in DB or config); in API or RPC that updates deal stage, validate `(current_stage, new_stage)` before update.  
**EFFORT:** 3–4h

---

### 2.2 Sequence & automation logic
- **Enrollment:** `useEnrollInSequence` inserts into `crm_sequence_enrollments` without checking if the contact is already enrolled in the same sequence.

**FINDING 11 — Sequence enrollment deduplication missing (Medium)**  
**SEVERITY:** Medium  
**ZONE:** CRM  
**FILE:** src/hooks/useCrmSequences.ts (useEnrollInSequence, ~line 150)  
**PROBLEM:** Same contact can be enrolled in the same sequence multiple times; no guard against duplicate enrollment.  
**EVIDENCE:** `await from('crm_sequence_enrollments').insert(enrollment)` with no prior select for existing (contact_id, sequence_id) where status not completed.  
**FIX:** Before insert, check for existing enrollment (contact_id, sequence_id) with status not in (completed, cancelled). If exists, return that or skip insert. Optionally add UNIQUE(contact_id, sequence_id) with partial index where status <> 'completed'.  
**EFFORT:** 1–2h

---

### 2.3 Contact & deal integrity
- **Contact delete:** Not fully audited; RLS and FK cascades may handle it. Orphan check: not done in this pass.
- **Duplicate contact guard:** No explicit “prevent same email/phone” on import found in this pass.
- **Tags:** No atomicity audit for concurrent tag updates.

### 2.4 Task system
- **Overdue:** useOperationalTasks and similar use server data; “overdue” is typically computed from `due_date` vs today. If “today” is taken from client, it could be wrong; if from server in query (e.g. `due_date < now()`), it’s correct. Not fully traced.

---

## ZONE 3 — EDGE FUNCTIONS SECURITY

### 3.1 Authentication coverage
- **requireAuth used in:** admin-manage-user, export-mc-data, vendor-acquisition, ai-intake-extract, scan-business-card, lifeos-ai-fix, listing-quality-analyzer, register-mc, extract-images-from-url, ocr-receipt, lifeos-ai-analyst, user-analytics-api.
- **Auth via manual getUser (no requireAuth):** create-order-checkout, create-checkout, create-property-deposit-checkout (and likely others). These still verify the user but don’t use the shared helper.
- **No auth (or service-role only):** notify-lead-whatsapp, stripe-webhook (expected), send-order-email (invoked with service role), and other trigger-invoked functions.

**FINDING 12 — notify-lead-whatsapp: no auth, IDOR (High)**  
**SEVERITY:** High  
**ZONE:** Edge Security  
**FILE:** supabase/functions/notify-lead-whatsapp/index.ts (full)  
**PROBLEM:** Function accepts `leadId` in body and sends WhatsApp using lead data. It does not verify the caller; anyone can call it with any lead ID and trigger a WhatsApp send (IDOR + abuse).  
**EVIDENCE:** No `requireAuth` or `Authorization` check; `const { leadId } = await req.json();` then fetch lead and send message.  
**FIX:** Require auth (`requireAuth`); optionally restrict to admin/team or to users who own the lead (e.g. via consultation_requests ownership or company). Add rate limiting per user/IP.  
**EFFORT:** 2h

---

### 3.2 Input validation
- **create-order-checkout:** Body is parsed and `items` are used directly; no schema validation (Zod or similar). Client can send extra fields or malformed data.
- **create-property-deposit-checkout:** Validates deposit ratio only; no strict schema.

**FINDING 13 — create-order-checkout: request body not validated (Medium)**  
**SEVERITY:** Medium  
**ZONE:** Edge Security  
**FILE:** supabase/functions/create-order-checkout/index.ts (lines 76–77)  
**PROBLEM:** Request body is trusted; only `items` length and total >= 1 are checked. No validation of types, ranges, or product_id format.  
**EVIDENCE:** `const body: CreateOrderRequest = await req.json();` then direct use of `items`, `order_type`, etc.  
**FIX:** Validate body with Zod (or similar): array of items with product_id (UUID), qty (integer 1–99), unit_price (number >= 0). Reject invalid payloads with 400.  
**EFFORT:** 1–2h

---

### 3.3 Financial functions
- **create-order-checkout, create-checkout, create-property-deposit-checkout:** Already flagged above (client-supplied amounts).
- **create-refund:** Should be audited that it uses only DB/Stripe data for amounts; not fully read in this pass.
- **Audit logging:** admin-manage-user writes to admin_audit_logs; payment/order updates in webhook do not write to a dedicated financial_audit table (only order_status_history and notifications).

### 3.4 Rate limiting
- **create-order-checkout:** Uses `withRateLimit(req, 'create-order-checkout', RATE_LIMITS.payment, corsHeaders, user.id)` — good.
- **notify-lead-whatsapp:** No rate limiting; can be spammed.
- **Other payment endpoints:** create-checkout and create-property-deposit-checkout were not checked for rate limit in this pass.

### 3.5 CORS
- **Allow-Origin: ***:** Used in stripe-webhook, create-order-checkout, create-checkout, create-property-deposit-checkout, notify-lead-whatsapp. For Stripe webhook this is normal (Stripe origin). For mutation endpoints (create-order-checkout, etc.), `*` is common in SPAs but slightly increases risk if credentials are sent; typically cookies are not used for these API calls. Flagged as “mutation with *” for awareness.

**FINDING 14 — CORS Allow-Origin * on mutation endpoints (Low)**  
**SEVERITY:** Low  
**ZONE:** Edge Security  
**FILE:** supabase/functions/create-order-checkout/index.ts, create-checkout/index.ts, create-property-deposit-checkout/index.ts (corsHeaders)  
**PROBLEM:** These endpoints use `Access-Control-Allow-Origin: *`. For authenticated endpoints that use Bearer tokens (not cookies), risk is lower, but any origin can call them.  
**EVIDENCE:** `const corsHeaders = { "Access-Control-Allow-Origin": "*", ... };`  
**FIX:** Optionally restrict to your app origins (e.g. env ALLOWED_ORIGINS) for production.  
**EFFORT:** 1h

---

## ZONE 4 — MOBILE / CAPACITOR

### 4.1 Web-only APIs
- **localStorage/sessionStorage:** Used in GlobalSearchModal, OwnerSetupWizard, FavoriteCollections, CurrencyContext, StorefrontContext, useListingApplication. On Capacitor, these typically work in WebView; no Capacitor Preferences fallback found. If the app is ever run in a context where localStorage is cleared or unavailable, state is lost.
- **window.open:** Used for tel:, mailto:, wa.me (TeamLeadsPage, MCCLeadsTab, PropertyDetail). Opening external URL in `_blank` is normal; on native, this may use in-app browser or external app — acceptable.
- **window.location.href:** DepositPaymentOptions sets `window.location.href = data.url` for redirect to Stripe — correct (leave page to go to Stripe). TableReservation similarly redirects to payment URL. These are intentional full navigations, not in-app routing.

**FINDING 15 — window.location.href for payment redirect (OK)**  
**ZONE:** Mobile  
**FILE:** src/components/property/DepositPaymentOptions.tsx (line 72)  
**EVIDENCE:** Redirect to Stripe checkout URL is expected; after payment user returns to success_url (in-app).  
**FIX:** None.  
**EFFORT:** 0

---

### 4.2 Touch & interaction
- **Touch targets:** No project-wide audit of 44px minimum; some icon buttons may be smaller. Kanban/drag: @dnd-kit is used and generally supports touch.
- **Hover states:** Many components use `hover:`; on touch devices hover is inconsistent. Not all have explicit `active:` or `focus:`; acceptable for many cases but can be improved.

### 4.3 Deep links & Capacitor config
- **capacitor.config.ts:** `server.url` is set to `https://dcc2b024-7627-4ad9-a915-a3df3dd839f0.lovableproject.com?...`. This is a fixed remote URL (not localhost). For production app store builds, this may point to a single backend; ensure this URL is correct for production and that deep links (if any) are configured in iOS/Android.

**FINDING 16 — Capacitor server.url is fixed remote URL (Medium)**  
**SEVERITY:** Medium  
**ZONE:** Mobile  
**FILE:** capacitor.config.ts (lines 7–9)  
**PROBLEM:** `server.url` is hardcoded to a Lovable project URL. For production, this should be your real app URL; otherwise all native builds load the same origin.  
**EVIDENCE:** `server: { url: 'https://dcc2b024-7627-4ad9-a915-a3df3dd839f0.lovableproject.com?forceHideBadge=true', cleartext: true }`  
**FIX:** Use env or build-time variable for production URL; ensure iOS/Android schemes and deep link config match.  
**EFFORT:** 1h

---

### 4.4 Offline & network
- **Mid-booking network loss:** No specific “offline” or “retry” UX was found for checkout; failed requests will surface as errors. Supabase client may throw; ensuring loading/error states exist in MarketCheckout and DepositPaymentOptions is recommended.
- **Realtime:** Subscriptions use Supabase realtime; reconnection is typically automatic. Not verified in depth.

### 4.5 Native build & version
- **App version:** Not compared across package.json, capacitor.config, and platform manifests in this pass. Recommend keeping them in sync.

---

# PART B — INLINE CHECKLIST

## ZONE 1 — Booking Flow
- [x] 1.1 Flow state machine traced; broken links: none that stop flow; gaps noted (no abandoned-order cleanup, no slot re-check at checkout)
- [ ] 1.2 Stripe idempotency key present on all payment intents / session creation — **NO** (Finding 4)
- [ ] 1.2 Amount calculation server-side only — **NO** (Findings 1, 2, 3)
- [x] 1.2 Webhook signature verification (`constructEvent`) confirmed
- [x] 1.2 Webhook handler idempotency confirmed
- [ ] 1.3 No permanently-stuck booking states — **Abandoned pending** (Finding 7)
- [x] 1.3 Payment success / notification failure: order stays confirmed
- [ ] 1.4 Availability re-validated server-side at checkout — **NO**
- [ ] 1.4 Double-booking prevented at DB level — **NO** (Finding 8)
- [ ] 1.5 Confirmation email retry logic — **NO** (Finding 9)
- [x] 1.5 User sees confirmation page after payment (success_url)

## ZONE 2 — CRM Logic
- [ ] 2.1 Pipeline transitions validated — **NO** (Finding 10)
- [ ] 2.1 Stage change automation — not fully traced
- [ ] 2.2 Sequence deduplication — **NO** (Finding 11)
- [ ] 2.2 Sequence failure handling — not fully traced
- [ ] 2.2 Opt-out halts all sequences — not traced
- [ ] 2.3 Contact delete cascades — not traced
- [ ] 2.3 Duplicate contact guard — not traced
- [ ] 2.4 Overdue tasks use server time — not fully traced

## ZONE 3 — Edge Functions Security
- [ ] 3.1 Every Edge Function has auth check — **NO** (notify-lead-whatsapp and others without auth where they should)
- [ ] 3.1 Sensitive functions have role check — admin-manage-user yes; others vary
- [ ] 3.2 Request body validated — **NO** for create-order-checkout (Finding 13)
- [ ] 3.2 No IDOR — **NO** (notify-lead-whatsapp, Finding 12)
- [ ] 3.3 No financial function accepts client amounts — **NO** (Findings 1, 2, 3)
- [ ] 3.3 Financial operations audit table — partial (order_status_history; no dedicated financial_audit)
- [ ] 3.4 Public endpoints rate limited — notify-lead-whatsapp **NO**
- [ ] 3.4 WhatsApp per-contact rate limit — not found
- [ ] 3.5 No Allow-Origin * on mutation endpoints — **They use *** (Finding 14, Low)

## ZONE 4 — Mobile / Capacitor
- [ ] 4.1 Web-only APIs have Capacitor fallbacks — localStorage not replaced with Preferences
- [x] 4.1 No window.location.href bypassing router for in-app nav (payment redirect is intentional)
- [ ] 4.2 All interactive elements ≥ 44px — not audited
- [ ] 4.2 Hover has touch equivalent — not fully audited
- [ ] 4.2 CRM Kanban touch — @dnd-kit used (generally supports touch)
- [ ] 4.3 Deep link handler — not traced
- [ ] 4.3 Redirect-after-login for deep links — not traced
- [ ] 4.4 Network loss mid-booking — error handling present; no specific “offline” UX
- [ ] 4.5 server.url not localhost in production — **Fixed URL** (Finding 16)
- [ ] 4.5 App version in sync — not verified

---

# FINDINGS LOG

| # | Severity | Zone | File | Problem | Effort |
|---|----------|------|------|---------|--------|
| 1 | Critical | Booking | create-order-checkout/index.ts | Amount from client; no server price validation | 4–6h |
| 2 | Critical | Booking | create-checkout/index.ts | Amount from client | 2h |
| 3 | High | Booking | create-property-deposit-checkout/index.ts | total/deposit from client | 4h |
| 4 | High | Booking | create-order-checkout, create-checkout | No idempotency key on Stripe session | 2h |
| 5 | — | Booking | stripe-webhook | Signature + idempotency OK | 0 |
| 6 | Medium | Booking | stripe-webhook | Long-running work before 200 | 2–3h |
| 7 | Medium | Booking | (missing) | No abandoned pending order cleanup | 2h |
| 8 | High | Booking | migrations | No DB constraint preventing double-booking | 2–4h |
| 9 | Low | Booking | stripe-webhook | No retry for confirmation email | 2–4h |
| 10 | Medium | CRM | useAgentDeals / pipeline | Stage transitions not validated | 3–4h |
| 11 | Medium | CRM | useCrmSequences | Sequence enrollment deduplication | 1–2h |
| 12 | High | Edge Security | notify-lead-whatsapp | No auth; IDOR | 2h |
| 13 | Medium | Edge Security | create-order-checkout | Request body not validated | 1–2h |
| 14 | Low | Edge Security | multiple | CORS * on mutation endpoints | 1h |
| 15 | — | Mobile | DepositPaymentOptions | Redirect to Stripe OK | 0 |
| 16 | Medium | Mobile | capacitor.config.ts | Fixed server.url for production | 1h |

---

# CYCLE 2 SCORECARD

| Zone | Critical | High | Medium | Low | Fixed | Remaining |
|------|----------|------|--------|-----|-------|-----------|
| Booking Flow | 2 | 2 | 3 | 1 | 0 | 8 |
| CRM Logic | 0 | 0 | 2 | 0 | 0 | 2 |
| Edge Security | 0 | 1 | 1 | 1 | 0 | 3 |
| Mobile | 0 | 0 | 1 | 0 | 0 | 1 |

**Total remaining:** 14 findings (2 Critical, 3 High, 7 Medium, 2 Low).

---

*MyUNO Audit Cycle 2 | Ignatev Group | Confidential*
