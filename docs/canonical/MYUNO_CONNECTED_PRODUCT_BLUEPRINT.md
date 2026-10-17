# myUNO connected product — canonical execution blueprint

Status: approved scope for Tranche 2A, documentation only · 2026-10-17.
Audience: product, engineering and AI agents.

## 1. Authority and boundaries

**myuno is the canonical production core. myUNO-final is a UX/workflow donor only.**
One Operational Reality: a physical asset, accepted price, inventory hold,
payment, accounting entry or person must not acquire a second authoritative
model because another screen needs it. Layantara is the first resort reference
implementation, configured through data; never a named branch, fork or slug check.

This document owns convergence execution, conceptual identity and target Homes
IA. [PROJECT.md](../../PROJECT.md) owns strategy; taxonomy owns classification;
the [mapping](../convergence/MYUNO_FINAL_MAPPING.md) records current domain owners
and Tranche 1 evidence; the [UX audit](../convergence/UX_FOUNDATION_AUDIT.md)
records current screens. Historical architecture proposals are not permission
to add tables, change authorization or mount new routes.

No parallel PMS, booking, pricing, inventory, CRM, ledger or auth model. Reuse
current shells, route constants, domain services and checked server operations.
No new identity tables, CRM migration, Homes implementation, Agent Workspace,
Today/Stay 360 redesign or P&L implementation in Tranche 2A.
Preserve the corrected inventory-status contract; reopen only for a tested defect.
The independent CI typecheck and full isolated Stripe journey remain unverified:
see [remaining checks](../convergence/TRANCHE1_REMAINING_CHECKS.md).

## 2. Connected operating loop

```text
Inventory → Content → Pricing → Availability → Discovery → Quote
→ Hold/Booking → Payment → Confirmation → Pre-arrival → Check-in → Stay
→ Services/Operations → Checkout → Turnover → Financial Close/P&L
→ CRM/Retention → Discovery / next stay / purchase
```

| Boundary | Authoritative fact / existing owner | Next consumer |
|---|---|---|
| Inventory → Content | Physical listings `properties`; rental categories `property_room_categories`; project sales `project_units`; existing project views | Published project/home content, not invented stock |
| Pricing → Availability | Existing rate plans, seasons, date overrides and stay restrictions; server quote modules | Eligible nights/units and sale status |
| Discovery → Quote | Search context + selected real project/category/home | Server-priced rental quote or sales proposal |
| Hold/Booking → Payment | `orders` / `order_items`; rental inventory `property_bookings` | Existing Stripe checkout / `payment_intents` |
| Confirmation → Stay | Verified payment, order history, booking and participants | Existing pre-arrival/check-in/guest workflows |
| Stay → Turnover | Existing operations tasks, services and maintenance | Check-out, cleaning and next availability |
| Financial Close → Retention | `ledger_entries` / accounts, existing financial reporting; CRM contacts/opportunities | Reconciled reporting and consent-aware follow-up |

This is a target connected loop, **not a claim that every handoff is verified**.
Each later tranche must name its authoritative owner, real business transition,
failure/retry behavior and read-back evidence. Financial Close/P&L must reconcile
with the ledger; adding gross booking totals is not accounting. `service_orders`
remains the active service-request workflow; any commercial bridge is explicit.
Rental occupancy and sales inventory remain distinct existing domains.

Server pricing is authoritative; preserve accepted quote snapshots. Dates use
`[check_in, checkout)`. Category assignment is a separate transaction, not a hold;
the existing exclusion constraint and verified pre-Stripe hold are final authority.
No UI redesign alters these rules or starts an automatic money move.

## 3. Identity foundation — conceptual layers, not a schema migration

Guest/Renter/Buyer/Owner/Investor are **not mutually exclusive identity types**.
One real person may rent, buy, own, work and refer simultaneously without becoming
five CRM people. Conceptual identity continuity does not imply today's records
are already deduplicated or linked across every domain.

| Layer | Meaning | Must not be confused with |
|---|---|---|
| A · Identity | PERSON or ORGANIZATION, stable real-world party | Booking role, login, persona |
| B · Account/Auth | Optional login linked to identity; CRM person may exist before signup | A requirement for every contact/guest to sign up |
| C · Relationships | Contextual, scoped links: stay participant/guest; asset ownership; staff→organization/operating space; agent→agency; provider affiliation; referral/deal participation | Automatic permission grants |
| D · State/Intent | Booking/stay lifecycle, property-interest/opportunity stage; purchase intent `SELF_USE / INVESTMENT / MIXED / UNKNOWN` | Identity type or authorization |
| E · Authorization | Explicit permissions/capabilities scoped to project/property/operating space, enforced server-side | Relationship, profile preference or persona |
| F · Persona/segmentation | HNW, family, snowbird, digital nomad and other contextual targeting | Security roles |

Investor is primarily purchase intent/persona. An existing `app_role=investor`
does not make investment intent a permission grant; current protected routes and
RLS remain unchanged. Authorization roles stay in protected `user_roles`, never
derived from user-editable profile segmentation. An ownership or employment
relationship needs separately verified authority before access is granted.

Organizations can be agencies, developers, management companies, service
providers or owner entities, potentially with several relationships. A provider
company is an ORGANIZATION; a provider worker is a PERSON linked to it. A sole
trader is not an excuse to equate all provider/profile/org IDs. Preserve the
trusted `provider_org_links` counterparty mapping and existing domain IDs.

Current building blocks include auth/profiles, CRM contacts and identity links,
orgs, memberships and scoped permissions. They are not evidence of a complete
universal identity registry. Future reconciliation requires source provenance,
verified matching, conflict/manual review, reversible links, retained history
and consent boundaries; never merge two people merely for sharing a name/email,
and never create another person just because their role changes.

Examples: a pre-signup CRM buyer later links an account to the same person; a
renting guest may already own another home; an agency worker and agency company
remain separate parties; a family member's stay participation grants no owner
or staff access. These are acceptance scenarios for future work, not implemented
identity migrations.

## 4. Homes final IA — one consumer world

Top level: **RENT | BUY** only. Never **Stay | Rent | Buy**.
This is the target information architecture, not a new route tree in this tranche.

| Context | Primary questions | Secondary filters / shortcuts |
|---|---|---|
| RENT | Where / When / Who | Duration inferred from dates; short/monthly/long-term, amenities, budget and home type refine discovery or commercial eligibility |
| BUY | Where / Budget / Property Type | New Projects / Resale / Investment refine discovery; investment is not a third top-level world |

```text
Universal Search (Rent or Buy context)
→ Results ↔ Map (same query, selection and filter state)
→ Project Portal OR standalone Home
→ Category / Home Type where relevant
→ Home Detail
→ Availability / Sale Status
→ Quote / Proposal
→ Booking / Request (Rent) OR Viewing / Enquiry (Buy)
```

**Project Card** represents a development/resort with location, project facts,
available categories/units and an explicitly qualified aggregate/from price.
It must not imply that the project itself is a bookable physical room.
**Home Card** represents a specific home/listing with its facts and rental/sale
context; a category card identifies a type/pool, not a guaranteed assigned unit.

**Project Portal is one shared surface** adapting to Rent/Buy context. Rent shows
eligible categories/home types and dates; Buy shows available sales units, plans
and proposals. It preserves context when moving between map, project and home;
it neither copies stock nor creates a parallel project model. Standalone homes
skip the portal. Home Detail carries the selected category/rate plan where
needed; assignment is governed by existing server rules, never visual selection.

Layantara fits as resort → category/type → physical assigned home for rental.
Title Legendary fits as existing project → available unit/home for Rent or Buy.
These are **IA reference scenarios**, not claims about live completeness or
currently verified project links, stock or portal behavior.

Use current `properties`, rental category entities, `project_units` and trusted
project views/adapters. Do not revive `property_complexes` or `development_units`.
Existing project backing differs across older docs and callers; resolve it from
current domain/view evidence before later implementation, not a new model here.
Sales availability is not inferred from a rental calendar. Unsupported rental
duration/rate or sale action stays a request/enquiry; never invent a price.

## 5. Coordinated UX lines and PMS simplification

**Operations/PMS** presents work, stays, assets, calendars, tasks and reconciled
finance. **Consumer Homes/Discovery** presents search, projects, homes, availability
and booking/enquiry. Both read the same facts; each exposes only authorized data
and appropriate next actions. Personal CRM fields do not leak into public cards.

PMS rules for later implementation:

- One primary action per screen/context; contextual secondary actions live next
  to their subject or in labelled menus, not a competing button wall.
- No page-level horizontal overflow. Wide data tables may scroll inside a clearly
  bounded table region; phones may use cards with the same fields/actions.
- Checkbox = independent/multiple selection; radio = one mutually exclusive
  choice; switch = persistent on/off setting. No selection control as command.
- Verify 375/390/430px widths, desktop, RU/EN text, keyboard focus and touch targets.
  Avoid hiding critical price, identity, status or confirmation information.
- Explicit loading, error/retry, empty and permission-denied states; stale
  or failed data is never rendered as available stock or a zero financial total.
- Reuse current design tokens and controls. Do not change pricing, inventory,
  booking transitions, permissions, payment or ledger behavior merely to redesign.

## 6. Donor patterns — adapt later, not build now

| Pattern | Intended adaptation | Boundary |
|---|---|---|
| Today | Prioritized existing arrivals/departures/tasks | Existing PMS/task sources, no second schedule |
| Stay 360 | Contextual view of one stay and its operations | Existing booking/order/participants, no new stay model |
| Property Workspace | One asset's calendar/content/rates/operations | Existing property + category/project relations |
| Agent Workspace | Existing contacts/opportunities/viewings context | No identity/CRM migration or second pipeline |
| Unified Calendar UX | Consistent filters and navigation over current occupancy | Preserve status predicate, dates, writers and permissions |
| Project Portal | Shared consumer project view for Rent/Buy | Existing project/unit/category sources, no named fork |

Donor implementation has not been inspected in this workspace. These patterns
are adaptation candidates, not ADOPTED code. Sequence small presentation-only
tranches from the UX audit; each requires scope, regression evidence and explicit
approval before implementation. Done means a verified real workflow, not a new
screen, schema or API alone.