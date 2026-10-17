# AGENTS.md — architecture rules

- There is one shared production database for preview, published and myuno.app; every migration and edge deploy is live, so ship additive changes with a written rollback in `docs/hardening/rollback/`.
- `orders` owns money, `ledger_entries` owns accounting, `property_bookings` owns rental inventory, `payment_intents` owns Stripe state; `bookings` is legacy and is retired only through adapters plus verified reconciliation, never dropped.
- `service_orders` is the active service request workflow (ServiceBookingSheet/useServiceMarketplace; trigger `validate_service_order` derives price/provider server-side and checks busy slots) and must be preserved; any link to commercial `orders` is a separate, documented bridge, because merging them would break working requests.
- Lovable drafts share the production backend, database, data and settings, so they are not staging; database changes made from a draft are live.
- `providers.id` and `orgs.id` are different entities (`orders.provider_org_id` is an FK to `orgs.id`); never pass a provider id as an org id — resolve the org only from an explicit trusted mapping, and block booking when none exists, because a wrong counterparty breaks payouts and RLS.
- Booking pages show only database-backed active offerings in the single supported currency, because invented fallback catalogues mislead customers.
- Money-moving SECURITY DEFINER functions must derive the actor from `auth.uid()` and validate amounts server-side, because client-supplied user ids and totals are untrusted.
- Money RPCs (`record_ledger_entries`, `credit_cashback`, `process_payout`, `create_order_atomic`, `create_booking_with_wallet_payment`) are service_role-only; clients call checked wrappers (`create_order_checked`, `admin_process_payout`) that derive the actor from `auth.uid()`, because direct grants let any user move money.
- The provider → org counterparty comes only from `provider_org_links` (staff-managed), because provider and org ids are different entities.
- Inventory status predicates must mirror `property_bookings_no_overlap` via `property_booking_holds_inventory` and the shared propertyInventory module; order refund/expiry maps to released booking state, because monetary statuses and inventory statuses are different domains.
- Category assignment is a separate RPC transaction, not a reservation; the exclusion constraint and verified pre-Stripe hold are final authority, because its advisory transaction lock ends before order creation.
- Convergence execution follows docs/canonical/MYUNO_CONNECTED_PRODUCT_BLUEPRINT.md with current UX evidence in docs/convergence/UX_FOUNDATION_AUDIT.md, because conceptual identity and target IA must not be mistaken for permission to build duplicate models or migrate CRM.
