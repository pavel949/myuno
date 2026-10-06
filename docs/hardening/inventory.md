# Hardening inventory (Phase 0, 2026-10-06)

## Exposed SECURITY DEFINER RPCs (EXECUTE granted to `authenticated`)
| RPC | Risk | Known callers |
|---|---|---|
| create_order_atomic(p_customer_user_id, p_total_amount, ...) | client-chosen customer and total | src/hooks/useOrders.ts, useBooking.ts |
| create_booking_with_wallet_payment(p_user_id, p_total_amount, ...) | client-chosen user and amount | — (to grep in Phase 2) |
| process_payout(p_payout_id, ...) | no actor check | src/hooks/useAdminPayouts.ts (move to admin edge first) |
| record_ledger_entries(p_order_id) | no actor check | stripe-webhook, confirm-manual-payment, e2e-mark-paid, checkouts |
| credit_cashback(p_order_id) | no actor check | edge only |
| get_provider_busy_slots (anon too) | intended public, returns busy times only | ServiceBookingSheet |

## Broad UPDATE policies
- orders: `orders_update_own`, `Order owners can update` — full-row update by customer.
- service_orders: `Guests can update pending orders` — full-row update while pending.

## property_bookings external_id indexes (consolidate in Phase 5)
- property_bookings_external_id_key (full unique)
- idx_property_bookings_external_id_unique (partial, NOT NULL)
- property_bookings_ical_unique (property_id, external_id) WHERE source='ical'

## Fixed in Phase 1
- ServiceBooking.tsx: invented fallback services removed; orders carry provider_id.

## Still to re-read
Checkout night/fee logic, webhook guards, MC commission key, participants vs guests, vendor gross labels, availability RLS/realtime.
