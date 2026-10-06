# AGENTS.md — architecture rules

- There is one shared production database for preview, published and myuno.app; every migration and edge deploy is live, so ship additive changes with a written rollback in `docs/hardening/rollback/`.
- `orders` owns money, `ledger_entries` owns accounting, `property_bookings` owns rental inventory, `payment_intents` owns Stripe state; `bookings` is legacy and is retired only through adapters plus verified reconciliation, never dropped.
- `service_orders` is the active service request workflow (ServiceBookingSheet/useServiceMarketplace; trigger `validate_service_order` derives price/provider server-side and checks busy slots) and must be preserved; any link to commercial `orders` is a separate, documented bridge, because merging them would break working requests.
- Lovable drafts share the production backend, database, data and settings, so they are not staging; database changes made from a draft are live.
- `providers.id` and `orgs.id` are different entities (`orders.provider_org_id` is an FK to `orgs.id`); never pass a provider id as an org id — resolve the org only from an explicit trusted mapping, and block booking when none exists, because a wrong counterparty breaks payouts and RLS.
- Booking pages show only database-backed active offerings in the single supported currency, because invented fallback catalogues mislead customers.
- Money-moving SECURITY DEFINER functions must derive the actor from `auth.uid()` and validate amounts server-side, because client-supplied user ids and totals are untrusted.
