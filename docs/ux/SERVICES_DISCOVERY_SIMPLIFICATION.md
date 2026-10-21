# Services discovery: bounded navigation simplification

Base: `0fc69eb` in `pavel949/myuno`. Frontend only. No production writes, schema, endpoints, payment, availability or service-request writer changes.

## Verified source findings

- `/discover/services` rendered six gateway tiles, including a separate `/services` entrance, map and a loop back to `/discover`.
- `/services` repeated the same static home-service functions in Popular, a first-ten list and category previews, alongside provider offerings and cross-sells.
- Category introductions diverted to WhatsApp and made unverified fulfilment promises.
- `BackButton` deliberately navigates to its fallback rather than browser history, so details returned to an unfiltered catalogue.
- `public_service_catalog` safe projection currently exposes no service category. Do not invent category membership from service names.

## Implemented UI

- `/discover/services` opens the same existing service catalogue as `/services` directly.
- One search; each home-service request appears once. The category control uses the shared themed Radix Select, with keyboard support and a viewport-constrained menu. The request category selector is explicitly scoped to home requests; provider offerings are searched independently.
- Cleaning, Transport and Local businesses stay available as compact links to existing specialized flows.
- Removed repeated Popular/category-preview blocks, WhatsApp introduction detour, cross-sells and Explore hint.
- URL-backed query/category retains legacy `type`, equivalent category aliases, unrelated parameters and existing sort deep links. Typing replaces history; category selection adds a history entry.
- Unsupported category slugs yield no home-request matches rather than unrelated trades (e.g. photography no longer maps to handyman).
- Provider/request detail links carry a validated catalogue return URL; Back restores search/category. Request sign-in redirects preserve this return URL.
- Provider load/error/empty/no-match states remain distinct. An empty provider catalogue with an active search reports unavailable supply, rather than pretending the search excluded existing providers.

## Explicit unresolved commercial blocker

`ServiceFunctionOrder.tsx` uses `useOrders` / `public.orders`, not the `service_orders` request path required by PROJECT.md. This predates this UI change and was not migrated. No successful request submission or end-to-end service commerce is claimed. Correcting ownership/writer semantics requires a separate governed contract and tests.

The existing provider booking sheet, specialized verticals, pricing, availability and writer logic are unchanged. Static home functions remain request templates, with estimates clearly labelled; no provider or availability is fabricated.

## Verification

- 25 focused service tests: 12 URL/category/routing checks, 5 provider-state checks, 8 existing booking-state checks.
- 84 existing goal-entry/canonical-discovery/navigation-model tests.
- Focused ESLint and `git diff --check` pass.
- Full typecheck is not verified: memory contention killed one run; a second was stopped at coordination request.
- Isolated visual fixture: `scripts/qa/services-discovery-ui.mjs` and `.py`. Uses real page/layout/cards, synthetic empty provider supply, a synthetic detail route, actual catalogue-return helper, and blocked external browser requests. It cannot submit business records.
- Visual fixture matrix: RU/EN at 375, 390, 430, 1280. Browser run remains pending for CI; local browser execution was held at coordination request because of shared-memory pressure / known sandbox restrictions. No visual acceptance is claimed.
- Request-card footer now wraps its time and price/CTA groups on narrow screens. Visual confirmation remains pending.

## Rollback

Revert this frontend commit. No data/schema rollback or production mutation is involved. No push or deploy performed by this tranche.

The services discovery browser fixture is invoked explicitly by connected-system-check.yml. It verifies the themed category menu, keyboard opening, bounds, focus return and filter preservation. Full browser/typecheck acceptance remains pending for CI.
