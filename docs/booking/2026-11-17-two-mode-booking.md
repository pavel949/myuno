# Two-mode short-stay booking — contract and activation

> Change class **C** (money + inventory) under PROJECT.md §20. This file is the
> design note, activation checklist and rollback. Code merged ≠ activated.

## Problem

A guest could finish the booking flow without anything being committed: the
default path created an unpaid order and promised a WhatsApp reply "within 24
hours", and the main button read «Рассчитать стоимость» with a disclaimer that
the estimate confirms nothing. Card payments also reported "not configured" in
the admin dashboard regardless of the real key state.

## Contract

Short-stay booking has exactly two modes. The mode is the stored
`properties.instant_booking` flag, resolved on the server; the client never
chooses it.

| | Instant (`instant_booking = true`) | Request (everything else) |
|---|---|---|
| Card | Charged now | Authorised only (`capture_method: manual`) |
| Inventory | Held by the order's `property_bookings` row | Same |
| Outcome | Confirmed by the signed webhook on payment | Reply within **15 minutes** of authorisation |
| No reply | n/a | Hold released, order `expired`, dates freed |

Request lifecycle, stored in `orders.metadata.request_hold.status`:

`awaiting_card → authorized → capturing → captured` (accepted), or `→ declined`, or `→ expired`.

- The order stays `pending_deposit` until the webhook confirms the captured
  payment. Order confirmation still has one writer: `stripe-webhook`.
- The 15-minute clock starts when Stripe reports the authorisation
  (`checkout.session.completed` with `payment_status = unpaid`), after the
  amount, currency and manual-capture state are verified against
  `payment_intents`.
- Accept is refused after the deadline. Decline is always allowed. Expire is
  allowed only after the deadline, for the guest, an operator or the scheduler.
- An abandoned card step ends with the 30-minute Checkout Session expiry and
  the existing `checkout.session.expired` handler.
- No new table, enum or status. No migration.

## Files

- `supabase/functions/_shared/property-request-hold.ts` — pure contract.
- `supabase/functions/_shared/stripe-config.ts`, `_shared/stripe.ts` — key
  classification; `createStripeClient()` now throws `StripeNotConfiguredError`.
- `supabase/functions/create-property-deposit-checkout` — server-derived mode,
  manual capture for requests, Stripe pre-check before any order is written.
- `supabase/functions/stripe-webhook` (+ `request-hold.ts`) — records the hold;
  maps `payment_intent.succeeded` for captured requests into the existing
  confirmation path.
- `supabase/functions/property-booking-request-decision` — accept / decline /
  expire / sweep.
- `supabase/functions/_shared/checkout-handler.ts`, `admin-secrets-status` —
  503 `stripe_not_configured` before order creation; Stripe status for admins.
- Client: `src/lib/property/bookingMode.ts`, `PropertyBookingCard`,
  `PropertyDetailMobileBar`, `PropertyInquiry`, `DepositPaymentOptions`,
  `RequestHoldStatus`, `RequestHoldReplyActions`, `usePropertyRequestHold`,
  admin `GoLiveChecklist`.

## Activation checklist (not done by merging)

1. Deploy `create-property-deposit-checkout`, `stripe-webhook`,
   `property-booking-request-decision`, `admin-secrets-status` and every
   checkout function that imports `_shared/checkout-handler.ts`.
2. In the Stripe dashboard, add **`payment_intent.succeeded`** to the webhook
   endpoint's events. Without it an accepted request is captured but the order
   is never confirmed.
3. Schedule the sweep every minute with the internal secret or service-role
   bearer: `POST /functions/v1/property-booking-request-decision` with
   `{"sweep": true}`. Until it is scheduled, expiry is triggered by the guest's
   status screen and the operator's order sheet when the countdown reaches zero.
4. Confirm the admin dashboard reads "Configured · test keys" or
   "Configured · live keys". "Not configured" now names the missing secret.
5. Supervised test in Stripe test mode: one accepted, one declined and one
   expired request; verify card state, order status, `property_bookings`
   release and ledger entries for the accepted one.

## Known limits and open decisions

- Operators answer from the admin order sheet. A reply surface in the PMS
  bookings view is not part of this change.
- Instant mode keeps its existing payment-method picker (card, RUB manual,
  transfer, WhatsApp). Only the card charges immediately; whether the other
  three stay is a product decision.
- The hold equals the prepayment the server quotes (currently 10%).
- `_shared/currency.ts` lists THB as a zero-decimal currency. Stripe documents
  THB with two decimals. This change keeps the existing conversion so hold
  validation matches checkout; the conversion itself needs a separate,
  supervised check against the live Stripe account before any real charge.
- The "pay in full" choice is sent by the client but the server always charges
  the quoted prepayment. Unchanged here.

## Rollback

Revert the merge commit and redeploy the functions listed in step 1. No schema
or data rollback exists because none was applied. Before redeploying, decline
any order whose `metadata.request_hold.status` is `authorized` so no card hold
is left without a reply path; uncaptured authorisations also lapse at the
issuer on their own.

## Verification so far

Unit tests only (synthetic data, no production writes). No edge function was
deployed and no Stripe call was made from this branch. **GO/NO-GO: NO-GO for
activation until checklist steps 1–5 are completed under supervision.**
