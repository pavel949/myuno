# myUNO — System-Wide Bug Audit

> Read-only audit pass. 16 parallel domain auditors across auth, payments, orders, STAYS, DEALS,
> booking, navigation, CRM/leads, edge functions (financial + AI/integrations), service micro-apps,
> admin/MC, wallet/loyalty, onboarding/profile, cross-cutting React, and frontend↔backend gaps.
> Every finding below was verified against source (file:line). No code was changed.

Severity: **P0** = money/data-integrity/security or a whole feature dead · **P1** = feature broken or
materially wrong · **P2** = degraded UX / fragile / inconsistent.

---

## 0. Cross-cutting meta-patterns (root causes behind many findings)

1. **The `_archive` cleanup of 2026-04-29 deleted edge functions that are still invoked by live code.**
   `_archive/README.md` claims "zero frontend references" — this is false for several. Breaks:
   `create-cleaning-checkout`, `create-wellness-checkout`, `create-pet-checkout` (→ all online payments
   in cleaning/beauty/fitness/pets fail) and `canonical-persona-detect` (→ onboarding role/persona never
   persisted). **If the 14-day server-side deletion has run, these are hard 404s.**

2. **The "online / card" payment-selector pattern silently books with no charge.** Multiple verticals
   render `BookingPaymentSelect`/`BottomBar` with an `online`/`card` option that falls through to
   `createBooking` instead of opening Stripe Checkout, so the customer thinks they paid but no money is
   collected: **medical, beauty, fitness, restaurant SetMenu** (and a card-surcharge that is displayed
   but never charged).

3. **RUB/THB currency confusion.** Wallets are created in THB but top-up charges in RUB and the balance
   is rendered with a hardcoded `₽`; referral cards and babysitter prices show `RUB`/`₽` while the DB
   credits/stores THB. Real financial-value mismatch + wrong labels.

4. **Lead → WhatsApp routing (the core DEALS flow) is broken.** Property viewing-requests never reach
   Pavel on WhatsApp; the dedicated `notify-lead-whatsapp` uses Meta Cloud API (not the project's
   UltraMSG) and hardcodes legacy `uno.ae` contacts/URLs.

5. **`bookings` vs `orders` split-brain.** New bookings are written to `orders`, but the customer
   booking list and detail read the legacy `bookings` table → users never see their bookings and every
   `/bookings/:id` deep-link shows "not found".

6. **Admin/MC screens that "lie about success"** — toasts fire and KPIs render, but reads/writes are
   decoupled (wrong table, ignored query, stubbed hook, no handler).

7. **`/owner/*` navigation rot.** Many CTAs target `/owner/<x>` paths that aren't in the redirect list,
   so they fall through the catch-all to `/mc` instead of the intended page.

---

## 1. P0 — Critical (money / data integrity / security / whole-feature-dead)

### Payments & ledger
- **Open `process_payout` grant — any authenticated user can settle any vendor payout.**
  `supabase/migrations/20260121032053_*.sql:189` — `GRANT EXECUTE ... TO authenticated`, never revoked;
  `SECURITY DEFINER`, no admin/ownership check inside. Any logged-in user can mark any payout
  `completed` and decrement provider `pending_payout`. Fraudulent settlement path.
- **`create-checkout` overwrites the entire `orders.metadata`.**
  `supabase/functions/create-checkout/index.ts:99-102` does `.update({ metadata: { stripe_session_id }})`
  (full replace, not merge). Destroys booking metadata (airport-transfer type/flight/terminal),
  breaking the webhook's operator-notify race-fix, and wipes stored fee/payout amounts.
- **Property-deposit orders record the FULL rental amount in the ledger while Stripe only charged 10%.**
  `create-property-deposit-checkout` persists `total_amount` = full rental but collects only the deposit;
  the webhook has no `property_deposit` branch → `record_ledger_entries` books ~10× the cash collected.
  Every property booking will (correctly) trip `reconciliation_alerts`.
- **Guest/anonymous orders produce ZERO ledger entries, silently.**
  `record_ledger_entries` guards every insert on `v_customer_account_id IS NOT NULL`, only created when
  `customer_user_id IS NOT NULL`. Confirmed orders with null customer → no platform-fee/vendor/MC legs,
  yet marked paid → permanent `missing_ledger` alerts, vendor payouts never accrued.

### Currency
- **Wallet top-up charges RUB into a THB wallet with no FX; balance always shown as `₽`.**
  `src/pages/Wallet.tsx:146,257` + `create-checkout-session/index.ts:51,104`; webhook credits raw
  `metadata.amount`. Charge currency ≠ stored balance currency; user-facing label wrong.

### Bookings
- **`bookings`/`orders` split-brain** — `src/pages/Bookings.tsx:199`, `src/pages/BookingDetail.tsx:120`
  read `from('bookings')`; modern create path writes only `orders`. Bookings invisible in list;
  `/bookings/:id` (linked from PropertyInquiry, create-checkout success_url, notifications,
  ManualPaymentPending) always "not found".

### Service verticals dead / no-charge
- **cleaning / beauty / fitness / pets online checkout invoke archived functions** →
  `create-cleaning-checkout`, `create-wellness-checkout`, `create-pet-checkout` moved to `_archive`.
  All online payments error out, no order created.
  `src/pages/cleaning/CleaningBooking.tsx:117`, `beauty/BeautyBooking.tsx:110`,
  `fitness/FitnessBooking.tsx:100`, `pets/PetServiceBooking.tsx:95`.
- **Delivery vertical entirely non-functional** — every CTA navigates to `/delivery?...` which re-renders
  the same index; no order route exists; "Recent Orders" is hardcoded mock.
  `src/pages/delivery/DeliveryIndex.tsx:153,170,212`.
- **Restaurant/delivery online checkout creates a DUPLICATE order** — `createBooking` (order #1) then
  `create-restaurant-checkout` inserts a second order (ignores `booking_id`); orphan #1 never paid.
  `src/pages/restaurants/DeliveryCheckout.tsx:120-156`.
- **Medical "Pay online"/"PromptPay" collects no payment** — Stripe fires only for `card`, which isn't
  selectable; `online`/PromptPay fall through to `createBooking` marked stripe-pending.
  `src/pages/medical/MedicalAppointment.tsx:119` + `src/hooks/useBooking.ts:121`.

### Security / data exposure
- **`crm-ai-assistant` exposes CRM PII with no auth** — `config.toml:52` `verify_jwt=false`, no in-code
  check; POST `{contact_id}`/`{deal_id}` returns full `crm_contacts`/`agent_deals` rows.
  `supabase/functions/crm-ai-assistant/index.ts:8-44`.

### Lead routing (DEALS core)
- **Property/DEALS viewing-requests never routed to WhatsApp** — `WHATSAPP_NOTIFICATION_VERTICALS =
  ['home_services']` only. `src/hooks/useUniversalLead.ts:39,91`. Pavel never gets the alert the DEALS
  flow depends on.
- **Frontend + cron lead-scoring both fail (401)** — browser calls `auto-lead-scoring` with a user JWT
  but it requires the internal secret; cron path calls `leads-factory/batch-score` which requires a
  *user* JWT the service key can't satisfy. `auto-lead-scoring/index.ts:18,48`,
  `src/hooks/useUniversalLead.ts:116`. No leads ever auto-scored; hot-lead alerts never fire.

### Onboarding
- **`canonical-persona-detect` archived but still invoked with `apply:true`** → onboarding
  lifecycle/persona/clusters and consumer role never written to `profiles`; V2 onboarding is a no-op.
  `src/hooks/useDetectPersona.ts:77`, `src/hooks/useCanonicalOnboarding.ts:89`.

---

## 2. P1 — Broken or materially wrong

### Navigation (dead targets confirmed against route tree)
- Global search → `/mc/crm` (real: `/mc/crm-dashboard`) `src/lib/search/navigationIndex.ts:213`
- Global search → `/admin/ai` (no such route) `navigationIndex.ts:252`
- Search → `/owner/properties`, `/owner/calendar` fall through to `/mc`
  `navigationIndex.ts:201,204`
- Duplicate/conflicting `/mc/sequences` (top-level redirect vs nested `CrmSequencesPage`)
  `AnimatedRoutes.tsx:310` vs `routes/mcRoutes.tsx:100`
- MC subscription success → `/owner/calendar`,`/owner/properties` dead → dump on `/mc`
  `src/pages/owner/MCSubscriptionPage.tsx:238,247`
- CRM snapshot widget → `/owner/crm-dashboard` dead `src/components/owner/dashboard/SalesAgentCrmSnapshot.tsx:105,144,188`
- Pet "Get Quote" → `/pets/transport/quote` (no route) `src/pages/pets/PetTransport.tsx:80`
- Beauty service cards all `navigate('/beauty')` — inert `src/pages/beauty/BeautyServices.tsx:96,105`
- Account/completion → `/profile/documents` (real: `/me/documents`) `AccountFlatMenu.tsx:46`,
  `ProfileCompletionCard.tsx:71`

### Frontend → nonexistent edge function (no fallback = broken feature)
- AI Legal Assistant chat → `/functions/v1/ai-legal-assistant` (404) `src/components/owner/documents/AILegalAssistant.tsx:74`
- Receipt OCR → `/functions/v1/ocr-receipt` (404) `src/components/owner/receipt/ReceiptUploadWithOCR.tsx:56`
- External image proxy → `/functions/v1/proxy-image` (404), used in `<img src>` across 4 upload components
  (`ImageUpload.tsx:347`, `ImagePickerFromUrl.tsx:36`, `GalleryMode.tsx:428`, `AirbnbStyleImageUpload.tsx:470`)
- Yacht iCal export → `/functions/v1/yacht-calendar-export` (404) `src/hooks/useYachtExternalCalendars.ts:174`
- (Mitigated by fallback: `import-odoo-contacts`, `telegram-notify`)

### Money math / display
- **Restaurant checkout trusts client-supplied prices** (no DB validation, `enforceLineItemTotal` off) →
  pay arbitrary amount. `supabase/functions/create-restaurant-checkout/index.ts`. Same for
  TableReservation/SetMenuBooking callers.
- **Card 10% surcharge displayed but never charged** — medical/beauty/fitness BottomBar shows `price*1.1`,
  payload sends plain `price`. `MedicalAppointment.tsx:257`, `BeautyBooking.tsx:262`, `FitnessBooking.tsx:211`
- **`bundle3` ClearView tier grants 12 months like single** (no-op ternary) `stripe-webhook/index.ts:107`

### Owner financials (numbers actively wrong)
- Stats cards ignore the date filter shown directly above them `src/hooks/usePropertyFinancials.ts:249`
- Charts undercount when >50 tx (only loaded pages) `src/pages/owner/OwnerFinancials.tsx:83`
- Multi-currency summed as if all THB; hardcoded `฿` `usePropertyFinancials.ts:288`, `FinancialStatsCards.tsx`
- FinanceOverview mixes two unreconcilable sources (ledger vs booking-derived) `src/pages/owner/FinanceOverview.tsx:30`
- Stays activation blocked when only free slots remain (gating mismatch) `StaysSubscriptionCard.tsx:34,76`

### Admin / MC (UI silently lies)
- "Mark verified" writes to `listings.attributes`, list reads `restaurants` table → never updates
  `src/pages/admin/AdminRestaurantDataQuality.tsx:65`
- "New payout run" button has no `onClick` `src/pages/mc/finance/OwnerPayoutsPage.tsx:59`
- Investor metrics ignore booking revenue + cap users at 1000 `src/pages/admin/AdminInvestorMetrics.tsx:28,32`
- Acquisition Metrics dashboard renders all-zero stub data as real `src/hooks/useAcquisitionMetrics.ts:92`

### DEALS wizards & risk display
- OffplanDetail shows green "Due Diligence Complete / passed" for **high-risk** projects (truthiness on a
  string) `src/pages/property/OffplanDetail.tsx:350`
- SellItemWizard shows success screen even when publish fails (row stuck `draft`) `SellItemWizard.tsx:85`
- SellItemWizard loses all form state on close (no draft persistence) `SellItemWizard.tsx:56,99`
- ListingWizard review shows blank title for non-EN sellers `BasicInfoStep.tsx:85`, `ReviewStep.tsx:62`
- ListingWizard failed submit → no persistent error, looks like "nothing happened" `ListingWizard.tsx:54`

### CRM / notifications
- **home_services lead → double admin WhatsApp/notification** (`notify-lead-whatsapp` +
  `notify-admin-order`) `src/hooks/useUniversalLead.ts:91-112`
- `notify-lead-whatsapp` uses Meta Cloud API not UltraMSG → never sends `notify-lead-whatsapp/index.ts:88`
- ExitIntentModal creates leads with no notification and no scoring `src/components/leads/ExitIntentModal.tsx:74`
- Lifecycle whatsapp/push messages logged "sent" but only email dispatched; dedup then blocks retry
  `auto-lifecycle-actions/index.ts:94-133`

### Booking detail
- Never loads items/participants/addresses (hardcoded `[]`) → sections never render `BookingDetail.tsx:129`
- Cancel writes to legacy `bookings`, bypasses `order_status_history` audit `BookingDetail.tsx:168`
- Status enum mismatch list vs detail; `pending` renders default grey + raw string `BookingDetail.tsx:58`

### Wallet / loyalty / referral
- DB writes tx types (`referral_bonus`,`credit`) the frontend enum doesn't know → wrong icons/labels +
  income undercount `src/pages/Wallet.tsx:50`, `useWalletTransactions.ts:82`
- `award_achievement` silently loses bonus if wallet row missing (marks awarded, credits 0 rows)
- Referral reward shown `₽` but credited `฿` `src/components/uno/ReferralCard.tsx:66`

### Realtime React
- `usePropertyChat` / `useGuestPropertyChat` resubscribe channel every render (unstable `queryKey` in deps)
  `usePropertyChat.ts:161`, `useGuestPropertyChat.ts:198`
- `useTeamMessages` renders duplicate messages (no dedup by id on `[...initial, ...realtime]`) `useTeamChat.ts:154`

### Auth / roles
- MC account creation passes invalid `org_type:'management_company'` enum → insert throws, every MC signup
  hits catch `src/pages/auth/AccountTypeSelection.tsx:84`
- `OwnerGuard`/owner-onboarding redirect to `/mc/setup` which is never defined as a route `RoleGuard.tsx:153`
- `admin-manage-user.add_role` upserts any role incl. `admin` with no allowlist / 2-admin chain
  `admin-manage-user/index.ts:178`

### AI / integrations
- `check-mc-subscription` throws on every call (`current_period_end` moved off subscription root in pinned
  Stripe API) → MC subscription status broken for all paying companies `check-mc-subscription/index.ts:64`
- `ai-cross-sell` / `ai-pricing-optimizer` / `ai-owner-nurture` callable unauthenticated, no rate limit,
  read+write DB + spend AI credits `config.toml:14/16/20`
- Inconsistent/likely-invalid model id `google/gemini-3-flash-preview` in `ai-agent`, `ai-support-chat`,
  `ai-smart-search`, `ai-owner-nurture` (siblings use `gemini-2.5-flash`)

### Profile / onboarding
- Consumer onboarding role (7 roles) never persisted to `profiles.roles_stack`/`canonical_primary_role`
  `useCanonicalOnboarding.ts:91`, `useDetectPersona.ts:40`
- `ProfileCompletionCard` can never hit 100% / never hides (Documents hardcoded `completed:false`)
  `ProfileCompletionCard.tsx:70`
- Profile save shows no success/error feedback; failed save still navigates away (silent data loss)
  `useProfile.ts:76`, `EditProfile.tsx:144`

---

## 3. P2 — Degraded / fragile / inconsistent (selected)

- `reconciliation_alerts` RLS `USING(true)` for SELECT+UPDATE → any user reads/closes financial alerts
  `20260403130000_create_reconciliation_alerts.sql:24` *(borderline P1-security)*
- Wallet top-up: `unit_amount: amount*100` no `Math.round` → Stripe rejects fractional `create-checkout-session/index.ts:104`
- Webhook credits wallet from `metadata.amount` not `session.amount_total` (decoupled from actual charge)
- Password min-length inconsistent (6 vs 8) across `/auth`, InlineAuthGate vs AuthSheet/invite
- `claim_anon_session` re-fires on every `SIGNED_IN` (incl. token refresh), retries on failure
- `switchMode` writes `active_role: mode` — can set a bogus non-AppRole like `'mc'`
- Hardcoded `uno.ae` admin URLs/emails in `notify-lead-whatsapp` + `notify-admin-order`
- `send-email` / `_shared/notify-utils.ts` hardcode `resend.dev` sandbox sender, ignore `getMailFrom()`
- `_shared/whatsapp.ts` prepends `+` despite UltraMSG "no + prefix" convention → may fail silently
- `send-guest-welcome-whatsapp` / lifecycle log "sent" on failure → never retried
- Date picker disables "today" cell (compares midnight cell to now) `BookingDateTimeSelect.tsx:32`
- `booking-reminders` uses `.single()` on 0-row checks (PGRST116 noise) `booking-reminders/index.ts:74`
- DeliveryCheckout: no double-submit guard, silent return on missing url
- SetMenuBooking: default `card` unselectable, first-tap books with no deposit `SetMenuBooking.tsx:62`
- Babysitter: `RUB` label + unstyled "not found" + redirect-only back fallback `BabysitterDetail.tsx:116,129,176`
- Dead step-progress logic (flowers/cleaning/beauty) — pinned to step 2
- LoyaltyWidget treats wallet money balance as loyalty points; two contradictory tier systems on Wallet page
- Orphan Staff shell (StaffGuard/StaffLayout imported, never rendered; links to removed routes)
- Payout buttons lack `disabled={isPending}` → duplicate status transitions `OwnerPayoutsPage.tsx:118`
- `LanguageContext.t` lists unused `staticReady` dep → app-wide re-render churn; intended gating not implemented
- `useTeamMessages` cleanup uses `.unsubscribe()` not `removeChannel` (channel leak)
- WhatsApp auto-reply prints deep-link twice `whatsapp-incoming-webhook/index.ts:212`
- `InlineAuthGate` Google sign-in uses `lovable.auth` vs `supabase.auth` everywhere else (session-sync risk)

---

## 4. Orphan backend (built, no frontend caller — capability not surfaced)

- `concierge-route`, `concierge-intent` — AI onboarding router built for `/start`, never called
  (StartOnboardingV2 makes zero edge calls)
- `publish-telegram-post` — no admin "publish to Telegram" UI (the broken `telegram-notify` invoke meant this)
- `restaurant-order-notifications` — order-status-change notifier, never invoked
- `place-photo-proxy` — Places photo proxy, never called (place photos not rendered through it)

*(All `.rpc()` and `.from()` targets verified to exist — no nonexistent-RPC/table bugs.)*

---

## Suggested fix order

1. **Stop the bleeding (P0 money/security):** revoke `process_payout` grant; lock `crm-ai-assistant`
   + the 3 unauthenticated `ai-*` functions; fix `create-checkout` metadata merge; property-deposit
   ledger amount; guest-order ledger; wallet RUB/THB.
2. **Restore archived functions** (cleaning/wellness/pet checkout, canonical-persona-detect) or repoint.
3. **Booking split-brain** (`orders` vs `bookings`) — single highest-leverage UX/data fix.
4. **Lead → WhatsApp** routing + scoring auth (DEALS revenue path).
5. **Payment-selector no-charge** pattern across medical/beauty/fitness/restaurant.
6. Navigation dead-links, owner-financial aggregation, admin "lying" screens, then the P2 backlog.
