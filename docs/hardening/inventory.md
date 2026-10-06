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

## Service booking (Phase 1, code-only)
- Invented fallback services removed. Page loads only eligible providers (active, approved, non-demo) and active THB offerings with finite positive prices; distinct states: missing / inactive / load error / empty / ready.
- CORRECTION: the previous slice passed `providers.id` as `orders.provider_org_id` (FK -> `orgs.id`). Verified: `providers JOIN orgs ON o.id = p.id` = 0 rows; `orgs` has 2 rows, none with `metadata.provider_id`; no table bridges provider_id to org_id; no code helper resolves it.
- Booking is therefore BLOCKED for every provider (clear notice, real prices shown for reference). Provider id is kept as `metadata.provider_id` in the payload builder for when a mapping exists.
- Required later (additive migration, not applied): `providers.org_id uuid NULL REFERENCES orgs(id)` (or a `provider_org_links` table with a unique provider_id), populated by an admin-verified process, then read by `useServiceBookingCatalogue` -> `resolveProviderOrg`.
- Unresolved business constraints (not canonical config): service fee 100 THB, fixed 09:00–18:00 slots.
- `service_orders` is the ACTIVE request workflow (ServiceBookingSheet + useServiceMarketplace; `validate_service_order` derives price/provider and rejects busy slots). Not legacy; untouched by this slice.
- Commercial bridge (future, separate): a provider-accepted `service_orders` row may create an `orders` row only after the provider->org mapping exists; to be designed with its own reconciliation.

## Environment correction
- Lovable drafts share backend, database, data and settings (docs.lovable.dev/features/drafts). They are NOT staging. There is no isolated database; all DB work remains live and is out of scope for code-only slices.

## Still to re-read
Checkout night/fee logic, webhook guards, MC commission key, participants vs guests, vendor gross labels, availability RLS/realtime.
