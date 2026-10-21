# PROJECT.md — myUNO
## Canonical Product & Engineering Constitution

> **v3.2.1 · 18 Oct 2026 · production core: `myuno`**
> Canonical context for Codex, Lovable, other AI agents, engineers, product and operations.

## 00. How to use this document
Read before product, architecture, DB, auth, workflow, commercial or UX changes. Identify: real problem; canonical domain; actor/scope; place in the Operating Loop; whether the change extends truth or creates parallel truth; evidence required.

If this document conflicts with current code/live DB, do not force it onto production. Verify current source + read-only evidence and govern the correction under §20. Distinguish **VERIFIED CURRENT**, **APPROVED TARGET**, **REFERENCE IMPLEMENTATION**, **RECOMMENDATION**. Never call target state implemented.

## 01. What myUNO is
myUNO is a **destination property, services and living operating system**.

`Discover → Decide → Quote/Price → Request/Reserve/Transact → Pay where applicable → Stay/Receive Service → Operate/Support → Account → Retain → Repeat/Refer/Own/Invest`.

It connects trusted property/service supply, local execution, distribution, customer relationships and financial truth for customers, operators, providers, owners, agents and management.

**Living is an experience/surface category over canonical domains, not a separate domain model.**

## 02. What myUNO is not
Not another OTA, classifieds site, generic marketplace, “contact us” services directory, mini-app collection, duplicate PMS/CRM/accounting stack, separate Layantara app, or AI demo inventing data. `myUNO-final` is a UX/workflow donor only. **One Operational Reality** is the product.

## 03. Current strategic objective
Production operational convergence:
`Ignatev Estate → Layantara | Condominiums`.

Immediate proof: run a real Layantara booking from quote through checkout and P&L using canonical systems, isolate Layantara/Condo teams, preserve founder consolidated oversight, and keep the architecture reusable.

Priority: `correctness → security → operational completeness → usability → distribution → scale`.

**Services architecture is canonical now; full Marketplace activation remains P1 and must not expand the current property P0.**

## 04. Canonical Operating Loop
Shared: `Discover → Select → Quote/Price → Request/Reserve/Transact → Pay → Fulfil → Support/Operate → Account → CRM → Repeat`.

**Generic “order/request/booking” in diagrams does not imply a DB table.** Specific entities are `orders`, `service_orders`, `property_bookings`, etc.

Property rental: `Property → Availability → Rate → Quote → checked/atomic commercial + inventory commitment → Verified Payment where required → Confirmation → Stay → Checkout → Reconciliation → P&L`.

Do not infer a fixed ordering between creation/mutation of `orders` and `property_bookings` from this diagram. Follow the verified canonical writer contract. Commercial transaction ≠ inventory commitment; successful `orders` state does not prove successful inventory reservation; payment confirmation ≠ booking confirmation.

Property purchase: `Project/Unit → Terms → Enquiry → Qualification → Viewing/DD → Transaction → Ownership/PM`. Never force Buy into rental semantics.

Services: `Discovery → Provider/Offering → Availability/Slot where applicable → Price → Service Request/Booking → Fulfilment → Payment/Settlement where applicable → CRM`.

Service modes:
- **REQUEST**: provider/human confirmation required.
- **BOOK**: offering/availability known; payment may be later/outside myUNO.
- **BOOK+PAY**: offering, availability and server-authoritative price known; canonical checkout exists.

Each service vertical must define its authoritative capacity/hold point independently of payment. **Payment must never substitute for capacity reservation.**

Creating `service_orders` does not automatically create/require `orders`. If a vertical needs platform checkout/settlement/ledger, use an explicit idempotent reconciled bridge. Where bridged, persist deterministic linkage and enforce at-most-one active commercial order per service transaction unless an explicitly modelled retry/version contract requires otherwise. Never create two financial truths.

**Structured request → Marketplace first. Exceptional request → Concierge.** Concierge never creates a second service-order model; if it finds a structured offering, hand back to the canonical Marketplace workflow.

## 05. One Operational Reality
`Project ≠ Property`; `Property ≠ Operating Space`; `orders ≠ property_bookings`; `service_orders ≠ orders`; `Payment ≠ Ledger`; `Person ≠ Role`; `Provider ≠ Organization`; `UI state ≠ Domain state`; `CRM event ≠ Domain authority`.

Homes, Services, Concierge, PMS, Agent, Owner, Finance and CRM are projections: **different views, one state**.

**Immutable/auditable snapshots such as accepted quotes may preserve historical commercial state. They are evidence of the agreed state at a point in time, not competing canonical truth.**

## 06. Canonical domains / sources of truth
Before adding a table/enum/hook/context/workflow, find the existing canonical implementation and prove it cannot represent the requirement.

- Physical asset: `properties`.
- Project: project domain; never auth scope by itself.
- Rental inventory: `property_bookings` + canonical blocks/exclusion.
- Stay dates: `[check_in, check_out)`.
- Commercial order: `orders` where the canonical commercial-order contract applies. Property bookings and service requests remain separate domain entities.
- Payment: verified canonical payment writers; `payment_intents` where provider/Stripe state applies.
- Accounting: `ledger_entries`.
- Services catalogue: approved services/providers + safe public projections.
- Service request/booking: existing `service_orders`.
- Service availability: server-side busy-slot/availability rules where applicable.
- Relationship: unified CRM/person.
- Operational scope: Management Company + Operating Space + property assignment.
- AuthN: Supabase Auth. AuthZ: RLS + RBAC/module/action/property/Space.
- Public discovery: allowlisted projections; private operations: authorized canonical records.

`providers.id ≠ orgs.id`; `orders.provider_org_id` references an org/counterparty. Missing trusted provider→org mapping blocks flows requiring commercial settlement, but need not block request-only `service_orders`.

## 07. Actors & Operating Spaces
One person may be guest, renter, buyer, investor, owner, referrer, agent, supplier and/or employee; these are relationships/personas, not duplicate identities. Generic `uno_team` means employment, not global private authority.

`Management Company → Operating Space → Properties + Members`. Target: `Ignatev Estate → Layantara | Condominiums`.

One primary Space/property unless approved otherwise; cross-space membership explicit; empty/invalid scope never means All. **Operating Space = WHERE; RBAC/module/action = WHAT.** Space membership alone never grants Finance/Pricing/Booking/Admin capability.

**Operating Space constrains employee/management operational access; it does not replace independently verified customer, owner, provider or public rights.**

## 08. Product Surfaces
**Homes:** `Rent | Buy`; Search → Results → Project Portal → Category/Units → Unit → Terms/Availability → Quote → Booking/Enquiry.

**Services Marketplace:** `Services → Category → Provider/Offering → Availability → Price → REQUEST|BOOK|BOOK+PAY → Confirmation → My Services`. Existing/partial verticals include transport, vehicles, tours, yachts, flowers, beauty/spa, cleaning, fitness, restaurants/events. Code/route existence ≠ readiness. Verify real providers, approved offerings, safe fields, price, availability, commerce mode, mapping, fulfilment, settlement where applicable, and admin editing. No fake fallback catalogue.

**Concierge:** human escalation/orchestration only when structured Marketplace cannot safely fulfil. Concierge may maintain a case/orchestration record for conversation, requirements, coordination and resolution, but that record must not become a competing booking, payment, inventory or service-order authority. When a structured service is selected, return the transaction to the canonical Marketplace/service workflow.

**PMS:** Today, Calendar, Bookings, Properties, Workspace, Stay Detail, Housekeeping, Maintenance, Rates, Inventory, Finance, Owners, Staff.

**Agent:** authorized inventory/search/availability/pricing/markup/quote/request/booking/status. Availability is instant/request/partner-confirmed.

**Owner:** authorized properties/bookings/occupancy/finance/statements/payouts/maintenance/docs.

**CRM:** context/history across property + service journeys; never transactional truth.

**My:** prefer Stays / Services / Requests / Properties / Payments-Documents. Do not expose ambiguous generic “Orders” mixing internal domains.

## 09. Reference implementation — Layantara
First full property-operating acceptance: `Resort → Categories → Villas → Rates → Availability → Booking → Guest Ops → Housekeeping/Maintenance → Finance/P&L`.

No separate booking engine, calendar, guest DB, ledger or CRM. Differences from condos belong in configuration/scope/category/commercial policy.

**Never seed/infer the 39-villa/category manifest from this document. Verify source data.**

## 10. Business model
Engines: rental/management; sales/investment; owner/asset management; agent distribution; Services Marketplace GMV/fees; monetized high-touch Concierge; separately governed investment/trust products.

Property flywheel is economics, not a required state machine. Services are revenue plus high-frequency trust/retention. Every monetized flow defines payer, revenue event, fee, counterparty, recognition and accounting destination. Never invent a universal Marketplace commission.

**A service request is not GMV. Marketplace GMV/revenue is recognized only from the configured, verified commercial/financial event for that vertical.**

## 11. Architectural invariants
1. One Operational Reality.
2. `myuno` is production core.
3. Project grouping grants no operational access.
4. Operating Space is scope, not property/finance truth.
5. Space=WHERE; RBAC=WHAT.
6. DB authority protects rental inventory.
7. Successful order ≠ successful inventory reservation.
8. Order/Booking/Payment/Ledger remain distinct.
9. Payment confirmation ≠ Booking confirmation.
10. `service_orders` ≠ `orders` until explicit reconciled bridge.
11. Public uses safe projections; private uses authorized records.
12. Privileged service-role handlers authorize first.
13. Client IDs/totals/payment states/recipients are untrusted.
14. Auth fails closed; cache cannot broaden auth.
15. Persona change does not duplicate identity.
16. CRM is not transactional truth.
17. Financial changes are reconcilable/idempotent where required.
18. Production migrations are forward + rollback-aware.
19. Do not merge working specialized workflows without proven equivalence.
20. Search existing canonical implementation before creating new domain structures.

## 12. Financial & Booking invariants
`[check_in, check_out)`: 10→13 occupies 10,11,12; 13 may host next arrival. Avoid timezone-sensitive date-only parsing. DB overlap/inventory constraints are final authority.

UI `paid` is not payment truth. Manual/off-platform payment requires authorized actor, trusted order/amount context, canonical reconciliation and accounting consequence. Stripe/webhooks require verified evidence/idempotency.

`ledger_entries` is accounting truth. Operating Space filters/reports finance; never a second ledger. Shared/unallocated costs stay explicit.

**Operational forecasts, pending amounts and provisional accruals may exist, but must be explicitly labelled non-posted/provisional and must not be included in realized P&L as though they were posted ledger truth.**

## 13. UX Principles
Trusted infrastructure, not noisy marketplace. Task first. One obvious primary action. Next **safe** action, not every action. Exceptions before dashboards. Progressive disclosure. Information density may be high; control density low. Mobile-first 375px. RU/EN resilient. Status not color-only. Loading/empty/error distinct. Failed data never zero/all-clear. No page-level overflow. Project Card ≠ Unit Card. Respect public/private boundaries. Admin/content tooling is production-grade. UNKNOWN remains unknown.

## 14. Engineering Rules
Small reviewable tranches. Never combine auth cutover, schema redesign, money changes and broad UX redesign.

`Audit → Design → Isolated Tests → Implement → Verify → GO/NO-GO → Next`.

Never edit applied migrations; use forward migrations + security-preserving rollback. Test RLS as authenticated non-owner. UI filtering is not isolation. No production business writes for QA. TypeScript strict. Restricted query keys include actor/company/scope/revision or are evicted. Test changed operational UI at 375/390/430 + desktop. Never fabricate successful transitions.

## 15. Definition of Done
Build/UI success is insufficient. Done requires canonical-domain correctness, server auth, explicit states, mobile/RU/EN, tests, auditability, no duplicate truth, rollback evidence and safe operational acceptance where relevant.

If intended operators should manage rates/photos/descriptions/inventory/publication/providers/offerings/pricing, requiring developer/DB edits means it is not operationally done.

**P0:** money/order gate GO; verified Layantara/Condo Spaces; teams isolated + founder consolidated view; Properties/Calendar/Today/Bookings use one scope; controlled Layantara booking completes quote→checkout through inventory/payment/operations/CRM/accounting; finance reconciles.

**P1:** Agent Workspace; coherent Homes Rent/Buy; real Services Marketplace + Concierge fallback; Stay 360; Owner/Map/Notifications/Admin.

## 16. Current P0
**Replaceable execution pointer; update after every accepted gate. After a gate is accepted, replace it with the next unresolved gate; do not rerun accepted work without new contrary evidence.**

`A Final Order Mutation Security → B real Space manifest → C seed Spaces with enforcement OFF → D resolver/cache isolation → E Properties → F Calendar → G Today → H Bookings → I supervised enforcement → J Layantara E2E → K Housekeeping/Maintenance → L Identity/CRM → M Finance/P&L`.

Proven money/inventory bypasses block progression; unrelated broad security research does not automatically expand P0.

After P0: Agent Workspace; Homes Rent/Buy; **Services Marketplace Activation** (real provider/vertical audit, remove fake fallbacks, admin editing, pricing, availability, commerce modes, provider→org mapping where required, request/booking, fulfilment, optional commercial bridge/settlement, Concierge fallback); Stay 360; Owner/Map/Notifications/Admin.

Stop for review after money, inventory, RLS, schema or enforcement changes.

## 17. Explicit Non-Priorities
No parallel PMS/CRM/finance/property/service-commerce models; no new/replacement Channel Manager architecture before PMS stability (**do not break or remove required existing integrations**); no geographic expansion before Phuket loop works; no white-label PM SaaS; no speculative AI without source data; no broad aesthetic redesign; no schema rewrite for naming purity; no public exposure of private operational data; no endless security-audit expansion after finite P0 unless a proven critical blocker exists.

## 18. Evidence / No-Hallucination Rules
Never invent specs, coordinates, availability, prices, payments, providers, roles, permissions, production state or tests. Missing stays missing. **Absence of evidence = UNKNOWN, not false.** Never turn UNKNOWN into a default to make UI complete. Target ≠ implemented. Migration file ≠ applied. Deploy ≠ working path. UI filter ≠ RLS. Green build ≠ business correctness. Synthetic test ≠ production transaction. Prefer current code/live read-only evidence over stale docs. Report conflicts. Use exact paths/migrations/SHAs/test counts for implementation claims.

## 19. Canonical Documentation Map
`PROJECT.md` = constitution. `AGENTS.md` = concise execution invariants. `docs/canonical/MYUNO_CONNECTED_PRODUCT_BLUEPRINT.md` = connected loop/convergence. `docs/canonical/OPERATING_SPACES_DESIGN.md` = Space contract. `docs/convergence/UX_FOUNDATION_AUDIT.md` = UX evidence. `docs/convergence/FINAL_ORDER_MUTATION_SECURITY.md` = order/payment evidence. Operating Spaces E1–E2.x = implementation evidence. `docs/hardening/rollback/` = security-preserving rollbacks.

Canonical docs describe approved architecture. Convergence/audit docs are evidence, **not permanent normative authority**; promote durable accepted rules into canonical docs. Roadmap is execution, not architecture.

## 20. Change Governance
**A Routine:** UI polish/tests/copy/non-semantic refactors/bug fixes preserving invariants → normal PR.

**B Domain:** workflow/status/source ownership/pricing/availability/CRM/Operating Space/Marketplace behavior → design note + tests + canonical-doc update.

**C Critical:** money/refund, inventory reservation, ledger, auth/RLS, production schema cutover, Space enforcement, source-of-truth boundary → `Evidence → Contract → Isolated tests → Forward implementation → Security-preserving rollback → Read-only verification → GO/NO-GO → Controlled activation`.

Passing tests is evidence, **not automatic approval**. Never start the next critical tranche automatically. Critical reports state files/migrations/functions, behavior changed, canonical logic unchanged, tests/counts, production evidence, blockers, rollback, SHA, GO/NO-GO.

**Final rule:** when speed conflicts with canonical integrity, preserve canonical truth. When documentation conflicts with evidence, preserve evidence and update documentation.
