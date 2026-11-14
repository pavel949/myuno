# myUNO Super-App Architecture & Execution Plan

**Status:** APPROVED TARGET / architecture proposal — not yet fully implemented
**Date:** 2026-11-14
**Scope:** consumer super-app, property, services, experiences, relocation, owner/provider/management workspaces, shared platform primitives, commerce and operations.

> This document defines the target architecture and migration plan. It does not claim that every target surface, database contract, provider catalogue, payment flow or operating workflow is production-ready today. Current code and live evidence remain authoritative.

---

## 1. Executive decision

myUNO should become a **platform kernel with industry modules**, not a collection of mini-apps and not one universal workflow that forces rentals, property sales, transport, wellness and services into the same state machine.

The right model is:

```text
One identity
One consumer shell
One location context
One language context
One display-currency context
One date/time foundation
One search/discovery foundation
One relationship/CRM timeline
One support and notification layer
One financial truth
One permission model

                 +-----------------------------+
                 |     Industry modules        |
                 | Homes | Services | Trips     |
                 | Experiences | Relocation    |
                 | Invest | Owner Ops | Vendor  |
                 +-----------------------------+
```

The shared layer owns **context, navigation, identity, presentation and orchestration primitives**. Industry modules own **domain truth, domain lifecycle, eligibility, pricing, availability, fulfilment and settlement rules**.

This gives myUNO scale without creating a dangerous universal `booking`, `order`, `calendar`, `price` or `provider` model.

### Product promise

> One place to discover, decide, reserve, transact, receive and manage everything connected with living, staying, investing and operating in a destination.

The first market should remain Phuket. Geographic expansion is a configuration and operations problem after the Phuket operating loop is proven, not a reason to generalize prematurely.

---

## 2. Current state assessment

The repository already contains several target-level building blocks:

- A route registry in `src/lib/config/routes.ts`.
- Goal-first discovery routes: `/discover/stay`, `/discover/live`, `/discover/buy`, `/discover/services`.
- A consumer and workspace navigation model in `src/lib/nav/navigationModel.ts`.
- Shared providers for language, location, currency, auth, cart, storefront, theme and life situations in `src/App.tsx`.
- Existing `/me`, wallet, support, bookings, requests and documents surfaces.
- Property, newbuild/developer, services, vendor, owner, management, investment and admin domains.
- Canonical separation between properties, projects, rental inventory, service orders, commercial orders, payments, ledger and CRM in `PROJECT.md`.
- A canonical connected product blueprint defining Homes Rent/Buy, project portals and the shared operational loop.

The main architectural problem is not lack of screens. It is **uneven convergence**:

1. Many routes exist, but route existence does not prove a reliable business journey.
2. Shared contexts exist, but their contracts are mostly presentation-oriented rather than explicit platform contracts.
3. Currency is global in the UI, while transaction currency, display currency, quote currency and settlement currency need separate semantics.
4. Location has a city-level context, while many modules need country, region, district, map bounds, timezone, service radius and operating-space scope.
5. Calendar is not one universal calendar: property occupancy, service slots, events, appointments, tasks and personal plans have different authorities.
6. Consumer and workspace shells coexist, but module entry and role switching must become more predictable.
7. Existing route breadth can create a false impression of complete catalogue and operational readiness.

The target architecture therefore prioritizes **contracts and boundaries before visual expansion**.

---

## 3. Target architecture: five layers

### L0 — Platform kernel

Stable cross-industry primitives used by every module:

- Auth session and identity linking.
- Persona and role resolution.
- Language and locale.
- Geography and timezone.
- Display currency and money formatting.
- Date/time and calendar primitives.
- Search, filters, saved items and comparison.
- Cart/selection where appropriate.
- Notifications, messaging, support and consent.
- Feature flags and experiments.
- Analytics and attribution.
- Error/loading/empty/permission-denied states.
- Design system and accessibility primitives.

L0 must not own industry-specific commercial transitions.

### L1 — Platform services

Reusable backend and frontend services that connect modules without becoming a second source of truth:

- Catalog projection service.
- Availability query contracts.
- Quote orchestration interface.
- Request/lead intake.
- Payment intent orchestration.
- Ledger/reconciliation adapters.
- CRM timeline and relationship projection.
- Notification delivery.
- Document and media management.
- Audit log and idempotency infrastructure.
- Search indexing and ranking.
- Consent and communication preferences.

L1 defines interfaces and evidence requirements. Each module supplies the authoritative implementation.

### L2 — Industry modules

Each module owns its domain model and lifecycle:

1. **Homes**
   - Rent: availability, rates, quote, hold, booking, stay and operations.
   - Buy: projects, units, enquiry, viewing, due diligence and proposal.
   - Sell/list: owner/seller onboarding, publication and qualified leads.
   - Property management: owner assets, operations, maintenance and statements.

2. **Services Marketplace**
   - Provider, offering, availability/slot, price, request/book/book+pay, fulfilment and settlement.

3. **Experiences and trips**
   - Activity/event, date/time slot, participant constraints, booking and fulfilment.

4. **Relocation and legal**
   - Cases, requirements, documents, appointments, provider assignment and progress.

5. **Investment**
   - Deal/project, suitability, investor intent, diligence, matching and controlled transaction workflow.

6. **Owner/provider/management operations**
   - Workspace projections over authorized canonical records, not independent transactional models.

### L3 — Product surfaces

A small number of stable shells expose the modules:

- **Home:** personalized entry, active context, trusted recommendations and current tasks.
- **Discover:** goal-first browsing and universal search.
- **Plan:** dates, saved plans, itinerary and cross-module preparation.
- **Activity:** requests, bookings, services, documents, payments and support.
- **Operate:** owner, management and provider workspaces.
- **Wallet:** payment instruments, receipts, credits, refunds and financial documents.
- **Me:** identity, preferences, roles, saved items, consent and support.
- **Admin:** moderation, catalogue, operational control, finance and audit.

The existing `Home / Discover / Operate / Wallet / Me / Admin` model should be retained and normalized rather than replaced with many top-level mini-app routes.

### L4 — Delivery and governance

- Feature flags per module and capability.
- Progressive rollout by city, operating space, provider, role and cohort.
- Contract tests for shared interfaces.
- RLS and server authorization tests.
- Production evidence and rollback notes for critical changes.
- Module readiness scorecards.
- Clear distinction between `implemented`, `enabled`, `verified` and `commercially active`.

---

## 4. Shared primitives: what is genuinely common

### 4.1 Identity and persona

Use one person/account identity. A user may be a guest, renter, buyer, owner, provider worker, investor and employee simultaneously.

Separate:

```text
Person / Organization
        ↓
Account and auth identity
        ↓
Relationships: owns, works for, provides, stays, buys, refers
        ↓
Persona and intent: renter, buyer, investor, tourist, resident
        ↓
Authorization: role + capability + operating space + resource scope
```

A persona must never grant permission. A relationship must never automatically grant financial or operational access. Role switching should change the shell and permitted views, not create a second account.

### 4.2 Geography

Create a shared **GeoContext** with explicit layers:

```ts
type GeoContext = {
  countryCode: string;
  cityId?: string;
  districtId?: string;
  areaId?: string;
  latitude?: number;
  longitude?: number;
  timezone: string;
  defaultCurrency: CurrencyCode;
  mapBounds?: GeoBounds;
  serviceRadiusKm?: number;
  operatingSpaceId?: string;
};
```

Rules:

- Current city is a discovery default, not an authorization boundary.
- Operating Space is an operational scope and must remain separate from public geography.
- Every module declares which geography it supports: point, polygon, district, city, country or remote.
- Search, pricing, availability and fulfilment may use different geographic predicates.
- No module may infer a service radius, timezone or currency from a free-text address.

The current `LocationContext` is a useful starting point but should evolve from a city selector into a versioned geo contract with explicit source and confidence.

### 4.3 Currency and money

Currency must be split into four concepts:

```text
source / tariff currency      authoritative stored commercial amount
quote currency                currency in which a quote is accepted
settlement currency            currency paid to counterparty/platform
user display currency          presentation preference only
```

`CurrencyProvider` should remain a display preference service, not a financial authority.

Target money contract:

```ts
type Money = {
  amountMinor: number;
  currency: CurrencyCode;
  scale: number;
};

type MoneyView = {
  source: Money;
  display?: Money;
  conversionRate?: RateEvidence;
  isIndicative: boolean;
};
```

Rules:

- Never convert stored amounts in place.
- Never use display currency to decide eligibility, inventory, tax, commission or ledger posting.
- Accepted quotes store the original amount, currency, rate evidence and timestamp.
- Every checkout shows source/charged/settlement currency explicitly.
- A failed rate refresh must never turn an amount into zero or silently reuse an invalid rate.
- Each vertical defines rounding, tax, deposit and settlement policy.

### 4.4 Calendar and date/time

There should be one **date/time foundation**, not one universal calendar table.

Shared primitives:

- Civil date parsing with no timezone drift.
- `[start, end)` interval semantics for stays and reservations.
- User timezone versus operating-location timezone.
- Locale-aware formatting.
- Date range selection.
- Recurrence and blackout primitives.
- Availability state vocabulary.
- Calendar query filters.
- Timezone-aware notifications.

Industry adapters:

| Module | Calendar authority | Meaning |
|---|---|---|
| Rental | `property_bookings` + inventory blocks | occupied/held/available dates |
| Services | provider/offering slot rules | bookable service capacity |
| Experiences | event/session inventory | participant capacity |
| Relocation | appointments and case milestones | planned work, not inventory |
| PMS | operations/tasks/maintenance | work schedule and stay preparation |
| Owner | projection of bookings, tasks and finance | asset view, not new calendar truth |
| Personal Plan | user-created plan items | coordination only, never availability authority |

A shared calendar UI may aggregate these sources, but it must label source, status and authority. A personal plan item must never imply a confirmed booking.

### 4.5 Search and discovery

Universal search should search a normalized **DiscoveryItem projection**, not query every domain directly from the UI:

```text
DiscoveryItem
- id and domain
- item type
- title and localized content
- geo references
- capability tags
- price summary with provenance
- availability summary with provenance
- trust/verification status
- supported intents
- canonical destination
- freshness and publication state
```

The projection is safe for public discovery. Detail, quote, reservation and operations always re-read canonical domain records with authorization and current state.

---

## 5. Industry module contract

Every module must implement the following manifest before it is exposed in the consumer shell:

```ts
type IndustryModuleManifest = {
  id: string;
  label: LocalizedLabel;
  entryRoute: string;
  supportedGoals: Goal[];
  supportedGeographies: GeographyCapability[];
  actors: ActorType[];
  catalogProjection: string;
  detailRoute: string;
  availabilityMode: 'none' | 'request' | 'slot' | 'inventory';
  commerceMode: 'REQUEST' | 'BOOK' | 'BOOK+PAY';
  quoteContract?: string;
  transactionContract?: string;
  fulfilmentContract?: string;
  settlementContract?: string;
  authCapabilities: string[];
  readiness: 'discovery' | 'pilot' | 'verified' | 'commercial';
  featureFlag: string;
};
```

### Mandatory module states

Every module must distinguish:

```text
loading
empty
available
stale
permission denied
not supported in location
request required
quote required
payment pending
confirmed
fulfilment in progress
completed
cancelled
failed / retryable
```

No module may render `0`, `available`, `paid` or `confirmed` when the underlying query failed or was truncated.

### Commerce modes

- **REQUEST:** structured request; human/provider confirmation required; not GMV until the configured commercial event occurs.
- **BOOK:** availability and offering are known; payment may happen later or outside myUNO.
- **BOOK+PAY:** server-authoritative availability, price and checkout; payment and fulfilment are reconciled.

A shared checkout shell may render these modes, but the module owns its eligibility and commit contract.

---

## 6. Target route and shell architecture

### Consumer route model

```text
/
├── /discover
│   ├── /stay        → Homes Rent + trip context
│   ├── /live        → Relocation, legal, daily-life services
│   ├── /buy         → Homes Buy + investment context
│   └── /services    → Marketplace catalogue
├── /search          → universal DiscoveryItem results
├── /property/*      → Homes module
├── /services/*      → Services module
├── /experiences/*   → Experiences module
├── /relocate/*      → Relocation module
├── /plan/*          → cross-module planning surface
├── /activity/*      → bookings, requests, stays, service activity
├── /wallet/*        → payment instruments and financial documents
├── /me/*            → identity, preferences and support
└── /operate/*       → authorized workspace entry
```

Existing legacy routes remain as redirects or compatibility aliases during migration. New top-level routes should not be added casually; use module route namespaces and the current registry.

### Workspace route model

```text
/operate
├── /owner
├── /management
├── /provider
├── /developer
├── /agent
└── /admin
```

The workspace shell is shared, but navigation is capability-driven:

```text
role + organization + operatingSpace + capabilities + featureFlags
→ visible navigation + data scope + allowed actions
```

Never derive authorization from the selected navigation role alone.

### Module loading

Use a module registry rather than hardcoded app-wide imports:

```ts
const MODULE_REGISTRY = {
  homes: homesModule,
  services: servicesModule,
  experiences: experiencesModule,
  relocation: relocationModule,
  invest: investmentModule,
};
```

Each module exposes:

- manifest;
- routes;
- discovery adapter;
- detail adapter;
- workspace navigation;
- query keys and cache policy;
- domain-specific quote/transaction adapters;
- tests and readiness evidence.

The platform shell imports module interfaces, not internal database hooks.

---

## 7. Shared backend architecture

### Canonical domain ownership

Keep these boundaries:

- Physical property: `properties`.
- Projects and sales units: existing project/project-unit domain.
- Rental inventory: `property_bookings` and canonical blocks/holds.
- Commercial order: `orders` only where the domain contract applies.
- Service requests/bookings: `service_orders`.
- Payment evidence: payment intents/provider records.
- Accounting: `ledger_entries`.
- Relationships and history: CRM/person/organization records.
- Scope: management company + operating space + property assignments.

Do not create a universal `superapp_orders`, `universal_bookings`, `calendar_events` or `money` table merely to simplify UI code.

### Shared orchestration interfaces

Use typed interfaces or edge-function contracts:

```text
DiscoveryAdapter.search(context)
DetailAdapter.get(id, context)
QuoteAdapter.quote(input)
ReservationAdapter.check(input)
ReservationAdapter.commit(input)
PaymentAdapter.createIntent(input)
FulfilmentAdapter.status(id)
SettlementAdapter.reconcile(id)
```

The interface is shared; the implementation and source of truth remain module-specific.

### Event and timeline layer

Use an append-only domain-event projection for cross-module activity, not as authority:

```text
property.inquiry.created
property.booking.confirmed
service.request.created
service.fulfilment.updated
payment.verified
document.required
support.ticket.updated
```

Events drive notifications, CRM timeline, analytics and activity feeds. They do not grant access, confirm payment or mutate inventory without an explicit canonical writer.

### Idempotency and audit

Every money, inventory, publication and fulfilment mutation must define:

- idempotency key scope;
- actor and organization;
- input snapshot;
- canonical writer;
- retry semantics;
- audit record;
- read-back verification;
- rollback or compensating action.

---

## 8. UX and information architecture

### Consumer home

The home page should not become a directory of every vertical. It should show:

1. Current location and language/currency context.
2. One primary task entry: `Where are you going / what do you need?`
3. Goal chips: `Stay`, `Live`, `Buy`, `Services`.
4. Contextual recommendations based on explicit intent and location.
5. Active activity: requests, bookings, documents or pending actions.
6. Trust and operational proof, not invented catalogue numbers.
7. Role-specific partner entry below the consumer path.

### Discover

Discover is the cross-module browsing surface. It should support:

- location;
- date/time when relevant;
- audience/intent;
- category;
- budget/display currency;
- availability mode;
- verified/trusted status;
- map/list where meaningful.

Filters must be namespaced by module. A rental bedroom filter must not appear on a spa result. Shared filter primitives are allowed; shared semantics are not assumed.

### Activity

Avoid a generic ambiguous `Orders` screen for consumers. Use clear categories:

- Stays;
- Services;
- Requests;
- Documents;
- Payments;
- Support.

The activity feed may unify them visually, but each item must show its domain, status authority and next safe action.

### Navigation

Mobile: five stable slots maximum. Recommended guest model:

```text
Home · Discover · Activity · Plan · Me
```

`Plan` is optional until it has real cross-module value; if not, use `Services` as the fifth slot. Avoid adding a slot for every vertical.

Desktop: top-level goal navigation plus a module-aware Apps launcher. Workspace navigation remains capability-driven and separate from consumer navigation.

### Calendar UX

Provide a shared calendar frame with a domain source badge:

```text
[Calendar]
Filter: All | Stays | Services | Appointments | Tasks
Source: Property booking / Service slot / Personal plan
```

The UI must distinguish a confirmed reservation from a personal reminder and a provider task.

---

## 9. Data and cache contracts

### Context versioning

Every shared context should expose:

```ts
{ value, source, updatedAt, confidence, isLoading, error, reset }
```

Examples:

- `LocationContext`: user-selected, browser geolocation, IP estimate or default active city.
- `CurrencyContext`: user preference, locale suggestion or default.
- `CalendarContext`: query range, timezone and source filters.

A context is a preference or query boundary, not a domain authority.

### React Query key rules

Keys must include all authorization and scope dimensions:

```text
[domain, resource, actorId, organizationId, operatingSpaceId,
 locationId, locale, currency, dateRange, featureVersion]
```

Never allow cached private data to bleed between users, companies, roles or operating spaces. Invalidate on role/scope change.

### Offline and stale behavior

- Display cached discovery content only with freshness status.
- Never use stale cached availability or price to confirm a transaction.
- Queue only safe user drafts, not financial or inventory mutations.
- Show a recoverable retry state when a shared provider fails.

---

## 10. Security and governance boundaries

The super-app increases the blast radius of mistakes. The following are non-negotiable:

1. Public catalogue uses allowlisted projections only.
2. Authenticated reads use RLS and scope checks.
3. Service-role edge functions authorize actor, organization and scope before privileged reads/writes.
4. Persona, location and currency never grant access.
5. Payment status from the client is never trusted.
6. Display currency never changes stored commercial truth.
7. Shared calendar UI never grants access to source records.
8. Concierge never creates a competing booking/order/payment authority.
9. Feature flags gate every new module and every commercial mode until GA.
10. Module activation requires production evidence, not a route and a green build.

### Module readiness gate

A module may move from `pilot` to `commercial` only when:

- real catalogue/provider supply exists;
- public projection is safe;
- geography and language coverage are declared;
- availability/quote behavior is tested;
- request/book/book+pay mode is explicit;
- money and ledger behavior is reconciled if monetized;
- admin/operator editing is possible without direct DB edits;
- support and cancellation path exists;
- mobile and accessibility tests pass;
- rollback and feature-flag disable path is proven;
- production smoke or controlled operational acceptance is complete.

---

## 11. Delivery roadmap

### Phase 0 — Architecture freeze and evidence (2 weeks)

Deliverables:

- Confirm current route/module inventory.
- Mark each module `implemented`, `enabled`, `verified` or `commercial`.
- Define shared TypeScript contracts for Money, GeoContext, DateRange, DiscoveryItem and ModuleManifest.
- Define ownership map for all current currency, location, date and calendar helpers.
- Establish module readiness scorecard and feature flags.
- No broad UI redesign in this phase.

Exit criteria: no unresolved ambiguity about source of truth or module owner.

### Phase 1 — Platform kernel convergence (3–5 weeks)

Deliverables:

- Normalize `CurrencyContext` into display-currency preference plus money utilities.
- Add explicit source/updatedAt/confidence to location and rate contexts.
- Create date/time foundation and timezone-safe utilities.
- Create shared activity, notification and support contracts.
- Formalize query key scope and cache invalidation.
- Add module registry and manifest types.

Exit criteria: Homes and one services vertical consume the new contracts without behavior changes.

### Phase 2 — Consumer shell and universal discovery (4–6 weeks)

Deliverables:

- Normalize `/discover` goal surfaces.
- Build `DiscoveryItem` adapters for Homes, Services and Experiences.
- Implement one search shell with module-specific filter schemas.
- Implement stable Home, Discover, Activity, Plan/Services and Me navigation.
- Preserve legacy URLs through redirects.
- Add explicit unsupported/empty/stale states.

Exit criteria: a guest can start from one home, select location and goal, discover an item and reach the correct module detail page without dead ends.

### Phase 3 — Homes as reference module (4–8 weeks)

Deliverables:

- Complete Rent/Buy separation in the shared Homes IA.
- Shared project portal adapting to Rent versus Buy.
- Search ↔ map state preservation.
- Server-authoritative quote and inventory contracts.
- Controlled rental checkout and deposit/ledger verification.
- Developer publication and owner/seller journeys.

Exit criteria: controlled Phuket rental flow passes quote → hold → payment → confirmation → operations → reconciliation; Buy remains explicit enquiry/proposal where unsupported.

### Phase 4 — Services marketplace pilot (4–8 weeks per vertical)

Start with one high-frequency, operationally tractable vertical, for example airport transfer or cleaning.

Deliverables:

- Real providers and offerings.
- Provider organization mapping.
- Availability/slot authority.
- Explicit REQUEST/BOOK/BOOK+PAY mode.
- Fulfilment and cancellation states.
- Admin editing and provider workspace.
- Optional commercial bridge with idempotent settlement.

Do not activate all service routes because they exist. Each vertical is enabled independently.

### Phase 5 — Cross-module retention layer (3–5 weeks)

Deliverables:

- Activity hub across stays, services, requests, documents and payments.
- Shared notifications and support timeline.
- Saved items and comparison.
- Plan/calendar aggregation with source labels.
- Consent-aware CRM timeline and next-best-action suggestions.

Exit criteria: a user can move from property discovery to service request or relocation task without losing identity, location, language, currency or context.

### Phase 6 — Workspaces and operating scale (6–10 weeks)

Deliverables:

- Shared `/operate` shell.
- Capability-based navigation for owners, management companies, providers, developers and agents.
- Today/Calendar/Bookings/Tasks projections over canonical sources.
- Workspace scope resolver and cache isolation.
- Provider and management onboarding.
- Operational acceptance for one real operating space.

Exit criteria: operators can complete real work without direct database edits and without parallel transactional truth.

### Phase 7 — Geographic replication (after Phuket proof)

Deliverables:

- City/country configuration registry.
- Local currency/rate and tax policy.
- Localized taxonomy and content.
- Provider and legal/compliance checklist.
- Support and fulfilment coverage.
- Per-city feature flags.

No new geography should be enabled until the original Phuket module contracts remain green and operationally supported.

---

## 12. Recommended team streams

Run small parallel streams with explicit contracts:

1. **Platform kernel:** contexts, date/time, money, geo, search, flags.
2. **Consumer shell:** Home, Discover, Activity, Plan, Me, accessibility.
3. **Homes:** Rent/Buy, inventory, quotes, developer and seller.
4. **Services:** one pilot vertical, provider operations and settlement.
5. **Operations:** `/operate`, Today, calendar, workspace scope.
6. **Data/security:** RLS, public projections, audit, idempotency and migrations.
7. **Growth/content:** SEO, taxonomy, localization, analytics and lifecycle messaging.

Every stream ships a design note, contract tests, mobile evidence and rollback notes. Cross-stream work must depend on versioned interfaces, not direct imports into another domain’s internals.

---

## 13. First 10 implementation tickets

1. Create `src/platform/contracts/` for `Money`, `GeoContext`, `DateRange`, `Availability`, `DiscoveryItem` and `ModuleManifest`.
2. Add a module readiness registry backed by feature flags.
3. Add a money display/quote utility that distinguishes display, quote and settlement currency.
4. Add timezone-safe date primitives and shared date-range tests.
5. Add explicit context metadata (`source`, `updatedAt`, `confidence`) to location and currency state.
6. Build a read-only DiscoveryItem adapter for Homes and one real Services vertical.
7. Add universal search result normalization without changing domain writers.
8. Define Activity item contracts for stay, service request, payment, document and support ticket.
9. Add module-level cache/query key conventions and role/scope invalidation tests.
10. Produce a Phuket-only readiness matrix showing what is truly commercial versus route-only.

---

## 14. Success metrics

### Customer

- Time from home page to first relevant result.
- Search-to-detail and detail-to-request conversion.
- Quote completion rate.
- Repeat service/property usage per user.
- Cross-module continuation rate without re-entering location/profile data.
- Support contacts caused by unclear status or pricing.

### Supply and operations

- Active verified providers/offers by vertical.
- Fulfilment success and cancellation rate.
- Time to provider confirmation.
- Owner/provider onboarding completion.
- Operator work completed without manual database intervention.
- Inventory, payment and ledger reconciliation exceptions.

### Platform

- Shared-context error rate.
- Stale cache or scope-leak incidents.
- Module readiness score.
- Feature flag rollback time.
- Percentage of routes backed by verified module manifests.
- Accessibility and mobile regression rate.

### Guardrail metrics

- Zero duplicate financial truth.
- Zero unauthorized cross-space reads.
- Zero confirmed reservations without authoritative capacity evidence.
- Zero client-controlled payment or price acceptance.
- Zero public exposure of private operational data.

---

## 15. Final recommendation

Proceed with the super-app strategy, but do not start by adding more verticals or rewriting the database. Start by making the existing shared concepts explicit and reliable:

1. **One consumer shell.**
2. **One identity and context layer.**
3. **One discovery contract.**
4. **One money presentation/quote boundary.**
5. **One date/time foundation with industry adapters.**
6. **One activity/support/notification layer.**
7. **Independent industry modules with explicit readiness gates.**
8. **One operational reality and no parallel transaction truth.**

The strategic advantage is not that every service appears in one menu. The advantage is that a user can move between property, services, relocation and operations while retaining trusted context, while each industry keeps the specialized rules needed for correctness.

The correct next move is **Phase 0 + Phase 1**, followed by one verified Homes flow and one real Services pilot. Do not activate a broad marketplace until the platform can prove catalogue truth, availability, pricing, fulfilment, settlement and support for each module independently.
