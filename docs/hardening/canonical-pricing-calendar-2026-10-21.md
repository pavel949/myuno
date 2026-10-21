# Canonical pricing calendar — 2026-10-21

Target: `pavel949/myuno`, Vite app serving myuno.app. The Next.js donor
`pavel949/myUNO-final` is not the deployment target.

## Contract

- `/mc/rates` has table/calendar views, clickable dates, inclusive date-range
  selection and unit/category targeting. Calendar links preserve property/date.
- Unit date prices use `property_availability.price_override`; category prices
  use `property_stay_restrictions.price_override`. Checkout already reads both.
- No new price table, pricing authority, currency conversion or inventory writer.
- Date ranges sent to SQL are half-open; maximum 366 nights; positive prices
  have at most two decimal places and retain the stored property's currency.
- Numeric cells show explicit dated prices before discounts; “Rate” means an
  inherited base/seasonal rate, not a calculated guest quote.
- Existing base-price editor, seasons and discounts remain available. Category
  nightly edits apply to category bookings; they do not rewrite child units.
- `set_property_calendar_price` derives actor from auth and checks hardened
  property authority plus Operating Space ceiling. This narrow definer function
  is needed because live availability RLS only permits administrators; no table
  policies/grants are widened. It updates price columns only, preserves occupancy
  and restrictions, checks snapshots/locks and records before-images in audit.

## Evidence

- Production Lovable project `dcc2b024-7627-4ad9-a915-a3df3dd839f0` matched
  production Vercel/repository commit `c6d6e4ce23f1e1c1d903ce4ba6141cd37f5b8ef7`.
- Authorized read-only preflight checked canonical columns, unique constraints,
  authority helpers and RLS. Supabase connector itself lacked project access;
  migration used the project's authorized Lovable database connector.
- Migration `20261021062539` applied transactionally and registered once in
  `supabase_migrations.schema_migrations`. Postflight: anonymous execute false,
  authenticated execute true, both private authority guards present, pinned path.
- 56 focused tests pass: editor RPC/confirmation/failure/currency/selection,
  civil ranges, old rates currency/navigation and existing property quote tests.
- Fresh isolated PostgreSQL fixture exercises actual migration: unit/category
  saves, inventory preservation, half-open dates, stale snapshots, currency
  mismatch, foreign actor, Operating Space denial and atomic audit behavior.
  Helpers in this fixture are synthetic contracts; live helpers were inspected
  read-only. No production business-record QA writes.
- `npm run typecheck` passes. `npm run build` passes (existing catalog warning:
  management_company/vendor_onboarding orphan situations).
- Browser fixture RU/EN at 375, 390, 430, 1440 px: no page errors or horizontal
  overflow. All transports stubbed; real Supabase transport is never imported.

Reproduce SQL fixture in a **fresh isolated local database only**, using
`psql -f scripts/qa/calendar-pricing.sql`. Browser fixture:
`npm run dev -- --host 127.0.0.1 --port 8080`, then
`node scripts/qa/pricing-calendar-ui.mjs`; serve its output on 127.0.0.1:8091
and run `node scripts/qa/pricing-calendar-browser.cjs`.

Rollback: [price-only function and UI](rollback/canonical-pricing-calendar.md).
