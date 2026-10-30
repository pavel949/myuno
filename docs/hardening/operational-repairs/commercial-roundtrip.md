# Commercial field roundtrip — bounded source repair

Applies to pavel949/myuno, React/Vite. Extends the existing repair branch after c73dcb65e; no production data correction, FX conversion, schema/migration/RLS/grant/role change or deployment.

## Canonical contract

`properties.price` belongs to its stored `price_period`; it never initializes `price_per_night`. Dedicated `price_per_night`, `price_per_month`, `price_per_year` retain independent amounts and units. `sale_price` uses `sale_currency`; generic legacy sale-only `price` retains its existing listing intent and currency. No tariff is divided/multiplied to fill another column. Public card/detail/inquiry resolvers remain the canonical read presentation and continue to keep unsupported/unknown currency request-only.

`propertyCommercialFields.ts` is a form projection/validation adapter over those existing columns, not a second pricing domain. On update each loaded original scalar is preserved unless its actual input changes. Null stays null; zero stays zero; cleared amounts become null. Unread/absent columns remain undefined and omitted rather than being cleared. Creation persists explicit blank amounts/period as null. Only new-record inputs receive a visible city-currency default; existing currencies never follow current city. Entered currencies and units are explicit, validated and never converted. Existing unknown legacy values survive unrelated edits. Invalid/negative/non-finite/unsafe entered amounts stop before mutation.

Offer intent is independent of amount presence. Stored listing_modes/listing_type/is_for_sale are preserved, including dual offers and unknown legacy state. Only an explicit rent/sale control changes them. Clearing a rate does not disable an offer; entering a rate does not enable one. No publication or booking status is inferred from price.

## Implementation surfaces

- Shared CanonicalPropertyForm: independent monetary form state, no generic↔nightly fallback, no amount-derived listing modes/type, explicit commercial inputs for Admin/Vendor, save-validation feedback without losing inputs.
- AdminProperties and VendorProperties: hydrate the same projection and persist the same checked field adapter against the reviewed row; no city-currency override or monthly default on update. Vendor projection includes the actual dedicated rates/sale currency/intent needed for safe roundtrip; it adds no private authority fields.
- Vendor operational list displays its stored amount/currency/period with the canonical read helpers, not a hardcoded baht prefix. Public unsupported-currency quote restrictions remain unchanged.
- Existing rental/season/discount rule previews receive the known currency label. No hardcoded THB relabelling or fixed35-THB/USD sale conversion is introduced. Owner controlled-save/checked-writer contracts remain unchanged; its initial form projection also carries stored commercial facts for display.
- The intake adapter no longer fills nightly from generic source price or generic from nightly on export; known daily aliases remain explicit daily data.

## Regression acceptance

Tests cover unchanged nightly/monthly/legacy sale/dual/unknown records; independent rental/sale currencies; zero/null/blanks and clearing; independent tariff edits; explicit mode changes; create→reopen→update in the real vendor page; real admin page payloads; public card/detail/inquiry eligibility after roundtrip; and invalid entries rejected before writes. No real request, booking or payment is submitted. Exact-head aggregate/build/typecheck/browser/CI results are recorded in PR200, separately from production readiness.

## Backend feasibility and stop boundaries

Source inspection confirms canonical physical identity is properties.id; project_units.property_id is the existing sales bridge. parent_property_id has broader existing parent-asset use and is not proof of a separate building registry. This tranche creates no parallel building/unit identity or guessed links.

Existing propertyAuthoring.ts createManagedPropertyDraft revalidates actor scope, creates a checked shell, and retains a known shell ID if the subsequent read/save fails. Existing complexAuthoring.ts creates content atomically and binds actor/company access; both fail rather than falling back to direct writes. Their create RPC signatures do not accept a durable client request key. A lost initial response cannot be reconciled by a frontend-generated key alone. Existing property/complex contract tests cover unavailable RPCs, denied scope, malformed/readback/conflict responses and retained identity; they do not prove initial-create idempotency.

A durable backend retry/receipt writer needs a reviewed actor/company/payload-bound uniqueness contract, a safe receipt projection and deployed-schema equivalence. Reusing a payment idempotency table or broadening public lead SELECT would change ownership/access semantics. No such shortcut or unsupported RPC parameter is added. Dependent backend implementation/activation stops at that explicit contract/security/live-access boundary; no production migration or security change is attempted. The earlier NbLeadForm improvement remains per-tab retry protection only.

## Rollback and release

Reviewed revert of this separable source commit; no data or DB rollback is needed because no production write occurred. Source checks and disposable PostgreSQL evidence do not certify live CRUD, real data, approved Canvas tariffs, deployed RPCs, server idempotency, credit balance or release SHA. Production acceptance remains a separate NO-GO gate until those are verified/authorized.
