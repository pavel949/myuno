# AGENTS.md — AI execution rules

> **Read `/PROJECT.md` first.** PROJECT.md v3.2 is the repository constitution and highest-level product/engineering authority. This file is a concise execution supplement. If wording here conflicts with PROJECT.md, stop, verify current code/live evidence, and reconcile the canonical docs rather than silently choosing one.

## Core execution invariants

- Preview, published, myuno.app and drafts share production data/settings, not staging; migrations and edge deploys are live. Use forward/additive or restrictive changes with security-preserving rollback in `docs/hardening/rollback/`.
- One Operational Reality: never create parallel Property, Booking, Availability, Pricing, CRM, Identity, Finance/Ledger, Service Commerce or PMS truth.
- `orders` owns canonical commercial-order state where used; `property_bookings` owns rental inventory; verified payment writers/`payment_intents` own payment-provider state where applicable; `ledger_entries` owns accounting.
- Preserve `service_orders` as the active service request/booking workflow. Creating `service_orders` does not imply `orders`. Any service→commercial-order bridge is explicit, idempotent and reconciled.
- `providers.id` differs from `orgs.id`; commercial counterparty resolution uses trusted provider→org mapping. Missing mapping may block settlement but need not block legitimate request-only service flows.
- Service commerce modes are REQUEST / BOOK / BOOK+PAY. Never force all services into one checkout model.
- Structured service requests use Marketplace first; Concierge is human escalation. Concierge must not create a second service-order model.
- Booking inventory uses half-open `[check_in, check_out)`; DB constraints/holds remain final authority.
- Generic `uno_team` is employment, not global private authority. Operating Space = WHERE; RBAC/module/action = WHAT.
- Empty/invalid authorized scope never means All. Scope preferences and cache never authorize data.
- Public property/provider/service/salon reads use safe allowlisted projections; private operational records require object/server authorization.
- Money-moving functions derive actor server-side and never trust client identity, totals, payment status or recipient fields.
- Before creating a new table, enum, hook, context/provider or workflow engine, search current code/schema for the canonical implementation and prove it cannot represent the requirement.
- Unknown is UNKNOWN, not false/default. Never invent catalogues, prices, availability, provider mappings, property facts or production state.
- High-risk sequence: Audit → Design → Isolated Tests → Implement → Verify → GO/NO-GO. Do not automatically continue after money, inventory, RLS, schema or enforcement changes.
- UI tests use synthetic/stubbed data and must not mutate production business records.
- Calendar/date logic uses shared civil-date helpers; avoid UTC/date-only parsing that shifts Phuket/Bangkok dates.
- Convergence/audit docs are evidence, not permanent normative authority. Promote accepted durable rules into PROJECT.md / AGENTS.md / canonical docs.

## Existing checked contracts — retained, not superseded

These concrete protections remain binding alongside the product constitution. New roadmap wording does not certify or replace their server contracts.

- `orders` owns money, `ledger_entries` owns accounting, `property_bookings` owns rental inventory, `payment_intents` owns Stripe state; `bookings` is legacy and is retired only through adapters plus verified reconciliation, never dropped.
- Preserve `service_orders` (ServiceBookingSheet/useServiceMarketplace): `validate_service_order` derives price/provider and checks busy slots; document any separate bridge to commercial `orders`, because merging breaks requests.
- `providers.id` differs from `orgs.id`; `orders.provider_org_id` references orgs. Resolve commercial counterparties only through staff-managed `provider_org_links`; block unmapped settlement/checkout, never substitute provider IDs. Request-only `service_orders` keeps its existing checked workflow and does not require an invented commercial bridge.
- Booking pages show only database-backed active offerings in the single supported currency, because invented fallback catalogues mislead customers.
- Money-moving SECURITY DEFINER functions derive actors from `auth.uid()` and validate amounts server-side, because client identities/totals are untrusted.
- Money primitives, including wallet debit/top-up, are service_role-only; checked user actions derive actor and authoritative totals, because arbitrary client IDs/amounts permit minting or theft; existing checked order creation is not yet price-certified.
- Inventory status predicates must mirror `property_bookings_no_overlap` via `property_booking_holds_inventory` and the shared propertyInventory module; order refund/expiry maps to released booking state, because monetary statuses and inventory statuses are different domains.
- Resort guests use read-only public_room_* catalogs and checked aggregate availability; date rules reuse hotelQuote. Assignment is not a reservation: constraints/holds remain authority, because UI cannot authorize inventory or private reads.
- Operating-space implementation requires approval of docs/canonical/OPERATING_SPACES_DESIGN.md and its catalog-backed gap audit; the proposed nested scope is not deployed authorization, because project grouping and company-wide permissions cannot prove internal team isolation.
- Operational scope is derived only by the actor-bound resolve_operational_scope RPC and its shadow controller; future queries use its dedicated cache prefix and ready-state ID allowlist, because preferences, empty arrays and legacy context cannot authorize access.
- Private operational policies use reviewed private-only helpers; privileged user handlers authorize actor/object/company/action before service-role access, while internal reports remain secret-authenticated and owner-recipient-bound, because employment identity and supplied IDs are not tenant authority.
- Enforced-company managed property creation and space reassignment go only through checked actor-bound RPCs, and public reads move to the allowlisted catalog projection, because direct inserts cannot be authorized before the row exists and base-table reads expose private columns.
- Public provider, service and salon reads use read-only owner-executed allowlisted catalog views with private base RLS; provider detail explicitly separates public and private reads, because public full rows disclose settlement and moderation fields.
- Property-submission notifications accept only an object ID, authorize its persisted pending owner/admin relation before service access and resolve current protected admin recipients, because supplied identity/contacts and employment roles cannot authorize delivery.
- Interactive booking-rule dispatch checks a readable confirmed order and all stored property/company booking-edit duties before service access; scheduler secrets remain separate, because manual order customer identity is not guest-recipient authority.
- Automatic transfer refunds fail before Stripe and mutation until a reviewed atomic reversal contract exists; payment lookup failure, absence, order status and metadata are never refund proof, because success markers without reconciliation misstate financial truth.

