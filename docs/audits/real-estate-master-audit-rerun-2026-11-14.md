# myUNO Master Real-Estate Audit

**Audit date:** 2026-11-14
**Scope:** Public rental discovery, property detail/inquiry, off-plan/developers, owner and seller flows, management operations, checkout/inventory, SEO/localization/geography, and admin/RLS/security readiness.
**Source basis:** Eight bounded repository audits supplied for this rerun. No production code was changed by these audits. No live Supabase/RLS, deployed RPC, browser/device, payment, or production crawler acceptance was completed unless explicitly stated below.

## Executive conclusion

**GO/NO-GO: NO-GO for full real-estate production release and controlled rental activation.** The repository contains substantial implemented functionality and meaningful test coverage: canonical public search, pricing safeguards, request-only enquiry, checked managed-owner workflows, server-side quote validation, signed webhook validation, publication controls, route guards for admin/team surfaces, and i18n key parity are all evidenced as current. However, the release is blocked by concrete P0/P1 defects and unresolved production gates.

The highest-risk blocker is rental money/inventory integrity. The manual RUB path creates `property_rental` orders that do not match the canonical property-booking lifecycle/hold contract, and deposit checkout stores a full stay total while payment and ledger behavior does not establish a correct deposit-only accounting model. Manual confirmation is not an atomic idempotent transition. Separately, the atomic property-order migration is only a tested candidate and its production deployment is unknown. **Do not activate controlled rental checkout until the canonical hold, deposit ledger, idempotency, and live database deployment are proven.**

The next highest risks are authorization and data integrity: the write-capable `/developer-portal` tree has no explicit authentication/developer-role guard; public developer and unit reads use divergent/protected or deprecated data paths; owner/seller publication has false-success, lost-draft, and weak validation paths; management reports mix current `orders` with legacy booking tables; and live RLS/grants/migration state have not been verified. Public search is comparatively mature, but standalone `/property/map` remains a divergent public route and canonical rental availability acceptance is still open.

## Status vocabulary

- **VERIFIED CURRENT:** directly evidenced in the supplied source/test audit as present now. This is not a claim that the behavior is correct in production.
- **UNKNOWN:** not verified from the available evidence, usually because live Supabase, deployed functions, real data, production HTTP, browser/device, or clean test/build execution was unavailable.
- **RECOMMENDATION:** required engineering or operational action; not a claim that a fix exists.

## Release decision and gates

### P0 — must block release

1. **Canonical rental hold and manual RUB mismatch — VERIFIED CURRENT.** `src/components/property/DepositPaymentOptions.tsx:231-265` creates manual RUB orders with `item_type=property_rental` and `metadata.source_id`, while `drizzle/migrations/0020_preserve_property_booking_lifecycle_status.sql:9-14` recognizes `item_type=property` and `resource_id/metadata.property_id`. Preflight availability is not a reservation and manual confirmation does not verify a hold. This permits a payment/confirmation path without canonical inventory protection.
2. **Deposit amount versus full-order ledger contract is unresolved — VERIFIED CURRENT / P0-P1.** `create-property-deposit-checkout/index.ts:285-306` stores the full stay total while Stripe line items at `:404-445` are deposit-only. `stripe-webhook/index.ts:221-228` invokes ledger recording, and the reviewed ledger migration reads `orders.total_amount`. The source does not establish a deposit-only posting plus outstanding balance. This can misstate financials.
3. **Atomic property-order deployment is unknown — UNKNOWN P0 gate.** `docs/convergence/atomic_property_order/forward.sql` and `propertyInventory.postgres.test.ts` describe a tested candidate but explicitly call it unapplied. Live function, ACL, trigger, exclusion constraint, and migration-head state were unavailable.

### P1 — must fix before broad production acceptance

#### Public discovery and availability

- **Divergent standalone map route — VERIFIED CURRENT.** `/property/map` is registered separately in `src/components/layout/routes/propertyHubRoutes.tsx:64-67`; `src/pages/property/PropertyMap.tsx:52-56` uses `usePropertiesForMap` (`src/hooks/useProperties.ts:460-480, 781-815`) rather than the canonical `public_property_catalog`/search contract. It lacks canonical rent/date/availability behavior.
- **Map collapses query failures into false empty — VERIFIED CURRENT.** `PropertyMap.tsx:52-56,226-260` consumes only data/loading and renders “No properties found” when markers are empty; it has no retry/error state. Canonical search has distinct error and empty states at `PropertySearchPage.tsx:451-464`.
- **Anonymous deployed availability RPC and published-only behavior — UNKNOWN.** Source has fail-closed date filtering, timeout/retry, concurrency limits, half-open semantics, and pending/failed disclosure, but anonymous production RPC permissions and real acceptance were not verified.
- **Google Maps live behavior — UNKNOWN.** `PropertyMapView` handles missing key/script errors but has no local boundary for provider-render failures. Billing/key restrictions and `BillingNotEnabledMapError` behavior remain uncertified.

#### Property detail, enquiry, and pricing

- **Inquiry/order non-atomicity and duplicate/orphan risk — VERIFIED CURRENT.** `src/pages/property/PropertyInquiry.tsx:890-984` inserts `property_inquiries` before `createOrder`, with no rollback or idempotency. Order failure leaves an orphan pending enquiry; retries can duplicate requests.
- **Silent date-price fallback — VERIFIED CURRENT.** `PropertyInquiry.tsx:266-326` catches `get_property_date_prices` errors by resetting `dateOverrides` to `{}` with no visible warning, allowing a base-rate total to be shown/submitted when date-specific pricing failed.
- **Availability source divergence — VERIFIED CURRENT / backend UNKNOWN.** Detail availability queries a 12-month unavailable-date window (`usePropertyUnavailableDates.ts:17-43`), while enquiry accepts arbitrary direct URL dates and calls a separate RPC (`PropertyInquiry.tsx:860-888`). Parity for blocked, checkout-only, external-calendar, and override cases is unproven.

#### Off-plan, developer, and public data

- **Protected base developer table — VERIFIED CURRENT.** `src/hooks/useDevelopers.ts` uses `select(*)`; migrations provide `developers_public` for anonymous-safe reads while the base table is authenticated-only. Anonymous developer index/detail can fail or expose private columns depending on deployed policy state.
- **Deprecated unit source and unusable unit cards — VERIFIED CURRENT.** `OffplanDetail` mounts `DevelopmentUnitsSection`, which reads deprecated `development_units` rather than canonical `project_units`; cards pass `price={null}`, have no unit/property link, and cannot carry a selected unit into enquiry.
- **RLS weaker than client publication predicates — VERIFIED CURRENT / live UNKNOWN.** `20260416200900_devmod_10_rls.sql` requires only `public_listing_enabled`, while client hooks also require `is_active` and `is_approved`. UI predicates are not an isolation boundary.
- **Pending applicants can appear publicly — VERIFIED CURRENT.** `useApplyAsDeveloper` inserts `is_active=true` while `devmod_status` defaults to `pending`; public hooks filter only `is_active`.

#### Owner and seller flows

- **False success after failed publish — VERIFIED CURRENT.** `src/components/sell-wizard/SellItemWizard.tsx:85-97` ignores the boolean from `publishListing` (`src/hooks/useUserListings.ts:116-140`), sets `isSubmitted=true`, and shows success even when status transition fails.
- **Seller draft loss and no resume/edit route — VERIFIED CURRENT.** Seller wizard stores draft only in React state (`SellItemWizard.tsx:56-67,99-101`); refresh/close/auth interruption loses progress and created draft rows have no seller resume/edit route.
- **Weak step and final validation — VERIFIED CURRENT.** Photos/contact/location steps advance without adequate validation; final schema is absent and incomplete records can be inserted with price coerced to zero (`SellPhotosStep.tsx`, `SellContactStep.tsx`, `SellReviewStep.tsx:177-186`, `useUserListings.ts:51-73`).
- **Publication state split and potentially overbroad public exposure — VERIFIED CURRENT / intent and effective RLS UNKNOWN.** Status and `moderation_status` diverge; public hook includes approved rows with `status=pending`, while `user_listings` RLS exposes any active row without a moderation predicate (`useUserListings.ts:222-229`, migration `20260202045957:88-102`).

#### Management operations and reporting

- **Current orders joined to legacy deposits — VERIFIED CURRENT.** `src/hooks/usePropertyReports.ts` fetches canonical orders/order_items but joins security deposits through legacy `booking_operations`, causing valid current-order deposits to appear zero/empty.
- **Owner occupancy uses legacy bookings — VERIFIED CURRENT.** `src/hooks/useOwnerAccounts.ts` calculates occupancy from `property_bookings` while current booking/report paths use `orders`; `/mc/owners` can disagree with bookings/statements.
- **Database isolation is not proven — VERIFIED CURRENT / live UNKNOWN.** Operating-space/RLS ceilings exist in migrations `0021-0027`, but runtime hooks use client-side accessible-ID selection and legacy assignment/maintenance/document paths. `src/test/mc-hard-suite/rls-isolation.test.ts` is an in-memory simulation, not authenticated Supabase RLS.
- **Bulk order update lacks explicit scope — VERIFIED CURRENT / live UNKNOWN.** `MCBookingsPage` bulk-updates orders by selected IDs without a property/company predicate; security depends on final database policy.

#### Admin, developer, and security operations

- **Unprotected developer portal — VERIFIED CURRENT.** `/developer-portal` and child editor routes in `src/components/layout/AnimatedRoutes.tsx:411-422` have no `AuthGuard`, `RoleGuard`, or developer-specific guard, although `DeveloperProjectEditor.tsx:298-337` is write-capable.
- **MC membership/owner-role mutation is unsafe — VERIFIED CURRENT.** `MCMemberManager.tsx:122-163` directly inserts/deletes membership and auto-upserts an owner role (`:136-140`) without transaction, reason, confirmation, or mandatory audit append.
- **Moderation audit and deployed RLS — VERIFIED CURRENT / deployment UNKNOWN.** Moderation uses optimistic status plus `updated_at`, but client review writes no explicit moderation audit event; final deployed RLS/grants are not live-verified.
- **Public sensitive-column exposure — VERIFIED CURRENT / deployment UNKNOWN.** Safe projections exist, but migration history contains broad public table-read policies; exact deployed grants and column exposure are unproven.

### P2 — fix before polish, scale, or broad market expansion

- Invalid, reversed, or incomplete date URLs silently become “Any dates” and skip availability (`src/lib/propertySearchQuery.ts:35-48`, `PropertySearchPage.tsx:285-287`). Recommend a non-blocking explanation and preserved intent.
- Map markers hardcode `฿` (`src/components/property/PropertyMapView.tsx:181-185`) while cards are currency-aware (`PropertyListingCard.tsx:73-74,273-283`). Recommend currency-aware marker labels or a clear unsupported-currency state.
- Off-plan enquiry passes only `project_id`; unit/property context is not populated. Secondary developer/document/unit/facet reads lack independent retry/error states.
- Gallery exposes URLs but not localized captions or room tags; request-only CTAs need clearer reasons when automatic booking is unavailable.
- Inquiry localization branches only English/Russian despite Thai locale support; Thai users can receive English enquiry/validation/payment/confirmation copy.
- Inquiry validation errors lack field associations (`aria-describedby`/`aria-invalid`) and CTA changes lack live announcements. Draft PII is stored in localStorage for 24 hours; document and communicate this tradeoff.
- Owner commercial payloads use truthiness normalization, risking inconsistent explicit-zero preservation. Owner publication UX lacks a complete state matrix; independent-owner draft discovery is not shown.
- Maintenance completion is not visibly linked to canonical tasks, vendor execution, expenses, or report accounting. Property documents use `select(*)`; secrets, storage RLS, and signed URL exposure need review.
- SEO publishes `/property/offplan` while `vercel.json:89-92` permanently redirects it to `/newbuilds`; add redirect-target coverage and resolve canonical ownership.
- `SEOHead` emits EN/RU/x-default alternates despite generating Thai URLs; landing and area SEO are RU/EN-only. Thai area metadata can be undefined, and `sitemap-landings.xml` has zero Thai alternates.
- Geography is a static 13-area Phuket list with manual string mappings and no evidenced stable ID/alias contract. Live crawler behavior, noindex coverage, sitemap freshness, and rendered locale output remain unknown.
- Add negative security coverage for anonymous/wrong-developer editor access, wrong-company MC mutation, public sensitive-column leakage, storage, moderation forgery, and escalation paths.

## Route and journey matrix

| Journey / routes | VERIFIED CURRENT | UNKNOWN | Release assessment |
|---|---|---|---|
| Public rental search: `/property/search` | Canonical URL-owned filters, mode/tenancy normalization, shared filtered map/list array, billing periods, request-price labels, estimated nightly totals, distinct loading/error/empty states; broad focused tests | Anonymous deployed availability RPC, live catalogue/media, production visual acceptance | **Conditional GO for source-level discovery; not full release** |
| Standalone map: `/property/map` | Separate route and divergent hook/table; empty state masks read failure; provider boundary absent | Live Google billing/key/provider behavior | **NO-GO until retired/redirected or converged** |
| Property detail: property detail route and gallery | Allowlisted catalog-first reads, pricing engine, broken-image handling, retry/loading, draft preservation, mobile sticky CTAs | Live RLS, deployed RPCs, real media/availability, device a11y | **Conditional after P1 data-flow fixes** |
| Enquiry / booking intent | Request-only wording, availability recheck, shared pricing, no reservation claim | Order/inquiry relationship, payment handoff, WhatsApp, owner reconciliation | **NO-GO for money activation until atomic/idempotent contract** |
| Off-plan catalogue/detail: `/newbuilds`, `/property/offplan` | Publication predicates and request-only enquiry exist; `/property/offplan` redirects in config | Live policies/data; canonical route ownership | **P1** |
| Developer portal: `/developer-portal/**` | Write-capable editor exists | Auth/role enforcement in deployed route and RLS | **NO-GO until guarded** |
| Seller wizard | Managed owner flow has checked RPCs, revisions, documents, stale-write safeguards; classified seller wizard exists | Real storage/roles/policies and canonical table relationships | **P1** |
| Management company: `/mc/**`, `/company/:slug` | Auth/MCPortal guards, public company projection, operating-space migrations, maintenance/report UI | Live RLS, inventory/company data, report edge-function authorization | **P1** |
| Checkout/webhooks | Quote validation, half-open inventory semantics, signed webhook and currency/minor-unit checks, conditional confirmation | Deployed atomic function/ACLs, ledger semantics, retries/recovery | **P0 NO-GO** |
| SEO/localization: public sitemaps, area landings | i18n key parity passes; sitemap XML parses; robots references sitemap index | Production statuses, rendered locale content, freshness/crawler behavior | **P1** |
| Admin/team moderation | Central admin/team guards, server-resolved context, optimistic moderation concurrency, publication audit tests | Final deployed grants and mandatory moderation audit | **P1** |

## Cross-cutting core recommendations

1. **Establish one canonical domain model.** Define `orders`, `property_bookings`/holds, `property_inquiries`, `project_units`, `user_listings`, and publication/moderation states in a short contract. Remove or quarantine legacy reads (`property_bookings`, `booking_operations`, `development_units`) behind explicit adapters with deprecation telemetry.
2. **Make server-side authorization and publication predicates authoritative.** Client filters are UX only. Use safe public views/projections for every anonymous read, exact company/property/developer predicates for writes, and protected RPCs for multi-step transitions. Capture live `pg_policies`, grants, storage policies, functions, triggers, and migration head from the target project.
3. **Make money and inventory transitions atomic and idempotent.** A single canonical hold/order function must validate quote, reserve inventory, create the correct order, and expose deposit balance. Add request idempotency keys and Stripe session idempotency. Confirmation/webhooks must use conditional updates, row locks or equivalent, durable outbox/retry state, and reconciliation for payment/ledger failures.
4. **Unify error semantics.** Every public read needs loading, error/retry, valid-empty, and stale/pending states. Never convert read failures into empty results or silently downgrade date-specific pricing without a visible warning and blocked submission where the total may be wrong.
5. **Make state machines explicit.** Separate draft, pending review, approved, active, rejected, sold/closed, and archived states. Define legal transitions, actor capabilities, prior-state checks, audit requirements, and returned-row confirmation in server contracts.
6. **Add production-like acceptance evidence.** A clean dependency install/build and focused test run must be archived; test anonymous and authenticated roles against a disposable/staging Supabase project; run browser journeys with real seeded rows, media, maps, dates, payment fixtures, and mobile keyboard/screen-reader checks.
7. **Resolve locale/geography ownership.** Decide whether Thai SEO is indexable or UI-only pending native review. Generate alternates/content from a stable locale-aware config, use stable geography IDs/aliases, and make sitemap ownership derive from canonical routes rather than hand-maintained URLs.

## Recommended fix order

### Phase 0 — stop-the-line safety (before enabling rental payments)

1. Freeze controlled rental activation and manual RUB confirmation.
2. Decide and document deposit accounting: deposit paid, full order total, outstanding balance, ledger entries, refunds, cancellation, and reconciliation.
3. Deploy and verify the canonical atomic property-order/hold function, exclusion constraint, ACLs, and lifecycle predicates in staging then production; capture receipts and SQL snapshots.
4. Route every currency/manual/Stripe path through the same canonical hold/order contract. Add request and payment-session idempotency.
5. Make manual confirmation conditional and idempotent; add durable webhook payment/ledger retry and reconciliation states.

### Phase 1 — authorization and core data integrity

6. Guard `/developer-portal/**` with authentication and developer/project capability checks; enforce the same server-side.
7. Replace developer `select(*)` with `developers_public`; migrate off `development_units` to `project_units`, including price, property/unit links, and selected-unit enquiry context.
8. Tighten public RLS to require the complete publication state; ensure pending developer applicants cannot appear.
9. Fix enquiry atomicity/idempotency and block submission when date-specific pricing retrieval fails; unify availability sources.
10. Fix seller publish false success, durable draft/resume, schema validation, and explicit publication-state filtering.
11. Replace legacy management report joins with canonical orders and add authenticated RLS tests.
12. Replace direct MC membership/role writes with a protected transactional RPC and mandatory audit.

### Phase 2 — route convergence and release quality

13. Retire/redirect `/property/map` or move it to the canonical search projection/filter/error/availability contract; add map provider error boundary and currency-aware marker labels.
14. Add independent retry/error states to off-plan secondary reads and management/document reads; stop `select(*)` on sensitive documents.
15. Fix SEO canonical/redirect ownership, Thai hreflang/content policy, area metadata safety, and sitemap generation tests.
16. Complete accessibility, Thai localization, invalid-date messaging, gallery metadata, and privacy UX.
17. Run full staging acceptance and only then consider production GO.

## Test and evidence plan

### Database and security

- Capture exact production/staging migration head, function definitions, ACLs, `pg_policies`, table grants, storage policies, triggers, constraints, and public-view definitions.
- Anonymous tests: public catalog/developer/project/unit/company reads, no private columns, no pending/unapproved rows, availability RPC execution, map/search parity.
- Wrong-actor tests: wrong developer, wrong company, non-member, anonymous, forged actor/audit, cross-property activity/report/document access.
- Transaction tests: atomic hold/order, concurrent checkout, checkout-only boundary, cancellation/release, duplicate manual confirmation, duplicate webhook, payment success with ledger failure, retry/reconciliation.

### Application and route journeys

- Search/filter/date URL round trips, invalid/reversed/incomplete date notice, map/list selection/query preservation, read error versus empty, next-page retry, exhausted pagination.
- Detail pricing with seasons/date overrides, foreign/missing currency, date-price RPC failure, availability parity, inquiry retry/idempotency, draft restoration, mobile CTA and validation.
- Off-plan developer/project/unit navigation and selected-unit enquiry; applicant pending/approved visibility.
- Seller wizard refresh/auth interruption, invalid step submission, zero/positive price rules, failed publish state, resume/edit, moderation transitions.
- Management property/company scoping, owner occupancy/deposit/report reconciliation, maintenance completion linkage, documents/signed URLs, bulk update scope.
- Admin/team/developer route access and audit behavior; moderation stale-write, status reset, pagination beyond 100.

### Quality and operational acceptance

- Clean install without interactive `npx`; run focused and full Vitest suites, TypeScript, production build, i18n parity, XML parsing, and archive outputs.
- Playwright/browser run against staging with seeded catalogue, media, availability, map key, and payment fixtures; verify production-like HTTP redirects, canonical tags, hreflang, sitemap and robots.
- Physical/mobile keyboard and screen-reader pass for enquiry validation, sticky CTAs, gallery controls, and state announcements.
- Reconciliation report comparing orders, holds/bookings, deposits, ledger entries, inquiries, canonical properties, project units, and public catalogue counts.

## Known strengths to preserve

- Canonical `/property/search` URL-owned filtering and normalization, shared map/list filtered data, accurate billing-period display, request-price handling, estimated-total labeling, and distinct read/availability states.
- Catalog-first allowlisted public property detail reads, shared pricing engine, immediate availability recheck, mobile CTA behavior, gallery fallback, and draft preservation.
- Managed property checked-RPC save/recovery, bounded drafts, revision proposals, currency-preserving sale/rent fields, document-before-review sequencing, and owner CRM failure surfacing.
- Server-side quote/payment validation, half-open inventory semantics, compensation gate, fail-closed webhook signature and currency/minor-unit validation, and conditional confirmation.
- Central admin/team guards, server-resolved role admission, moderation concurrency checks, publication audit/rollback coverage, and activity-log denial tests.
- i18n key parity (`missingRu=0`, `missingEn=0`, `missingTh=0`) and syntactically valid inspected sitemaps.

## Final GO/NO-GO statement

**NO-GO.** The project is not ready for full real-estate production acceptance, public rental activation, or an assertion that production authorization/inventory/financial behavior is safe. The decision is driven by the verified P0 rental hold/ledger gaps, unknown deployment of the atomic order contract, verified P1 unguarded developer writes, divergent public/deprecated data paths, non-atomic enquiry and seller flows, legacy management reporting, and absent live RLS/deployment evidence. A limited source-level public-search preview may be considered only if payment/booking activation remains disabled and the `/property/map` divergence is either removed or explicitly excluded; that limited preview must not be represented as full production readiness.

**No fixes are claimed in this report.** All recommendations above remain proposed work until implemented and re-audited with live evidence.
