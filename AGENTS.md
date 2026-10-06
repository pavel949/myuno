# AGENTS.md — architecture rules

- There is one shared production database for preview, published and myuno.app; every migration and edge deploy is live, so ship additive changes with a written rollback in `docs/hardening/rollback/`.
- `orders` owns money, `ledger_entries` owns accounting, `property_bookings` owns rental inventory, `payment_intents` owns Stripe state; `bookings` and `service_orders` are legacy and are retired only through adapters plus verified reconciliation, never dropped.
- Booking pages must show only database-backed services and prices and must bind orders to the real provider id; invented fallback catalogues mislead customers.
- Money-moving SECURITY DEFINER functions must derive the actor from `auth.uid()` and validate amounts server-side, because client-supplied user ids and totals are untrusted.
