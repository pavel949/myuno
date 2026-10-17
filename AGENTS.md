# AGENTS.md — AI execution rules

> **Read `/PROJECT.md` first.** PROJECT.md v3.2.1 is the repository constitution and highest-level product/engineering authority. This file is a concise execution supplement. If wording here conflicts with PROJECT.md, stop, verify current code/live evidence, and reconcile the canonical docs rather than silently choosing one.

## Core execution invariants

- Preview, published, myuno.app and drafts share production data/settings, not staging; migrations and edge deploys are live. Use forward/additive or restrictive changes with security-preserving rollback in `docs/hardening/rollback/`.
- One Operational Reality: never create parallel Property, Booking, Availability, Pricing, CRM, Identity, Finance/Ledger, Service Commerce or PMS truth.
- `orders` owns canonical commercial-order state where used; `property_bookings` owns rental inventory; verified payment writers/`payment_intents` own payment-provider state where applicable; `ledger_entries` owns accounting.
- Preserve `service_orders` as the active service request/booking workflow. Creating `service_orders` does not imply `orders`. Any service→commercial-order bridge is explicit, idempotent, reconciled, deterministically linked, and at-most-one active commercial order per service transaction unless an explicit retry/version contract says otherwise.
- `providers.id` differs from `orgs.id`; commercial counterparty resolution uses trusted provider→org mapping. Missing mapping may block settlement but need not block legitimate request-only service flows.
- Service commerce modes are REQUEST / BOOK / BOOK+PAY. Never force all services into one checkout model. Each vertical defines its authoritative capacity/hold point independently of payment; payment never substitutes for capacity reservation.
- Structured service requests use Marketplace first; Concierge is human escalation. Concierge may keep a case/orchestration record, but it must not become booking/payment/inventory/service-order authority; structured fulfilment returns to the canonical Marketplace workflow.
- Booking inventory uses half-open `[check_in, check_out)`; DB constraints/holds remain final authority.
- Generic `uno_team` is employment, not global private authority. Operating Space = WHERE; RBAC/module/action = WHAT. Space scoping constrains employee/management operations and does not replace independently verified customer, owner, provider or public rights.
- Empty/invalid authorized scope never means All. Scope preferences and cache never authorize data.
- Public property/provider/service/salon reads use safe allowlisted projections; private operational records require object/server authorization.
- Money-moving functions derive actor server-side and never trust client identity, totals, payment status or recipient fields.
- Before creating a new table, enum, hook, context/provider or workflow engine, search current code/schema for the canonical implementation and prove it cannot represent the requirement.
- Unknown is UNKNOWN, not false/default. Never invent catalogues, prices, availability, provider mappings, property facts or production state. A service request is not GMV; recognize Marketplace GMV/revenue only from the configured verified commercial/financial event.
- High-risk sequence: Audit → Design → Isolated Tests → Implement → Verify → GO/NO-GO. Do not automatically continue after money, inventory, RLS, schema or enforcement changes. Passing tests is evidence, not automatic approval.
- UI tests use synthetic/stubbed data and must not mutate production business records.
- Calendar/date logic uses shared civil-date helpers; avoid UTC/date-only parsing that shifts Phuket/Bangkok dates. Accepted quote snapshots may preserve historical commercial state without becoming competing canonical truth.
- Convergence/audit docs are evidence, not permanent normative authority. Promote accepted durable rules into PROJECT.md / AGENTS.md / canonical docs.

- Operational forecasts/pending/provisional amounts must be labelled non-posted/provisional and excluded from realized P&L until represented by canonical accounting truth.
- Current P0 is a replaceable execution pointer: remove accepted gates and do not rerun them without new contrary evidence.
- PROJECT.md v3.2.1 + this synchronized AGENTS.md are frozen canonical authority until changed through PROJECT.md §20 governance.
