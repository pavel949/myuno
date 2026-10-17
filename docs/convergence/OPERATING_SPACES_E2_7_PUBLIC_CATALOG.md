# E2.7 — Public catalog cutover and private property field closure (2026-10-17)

Scope: move public property readers to `public_property_catalog`, keep private PMS reads on
`public.properties` under object authorization, then close signed-in access to private fields of
approved properties. Enforcement not enabled; no spaces, assignments or members; E3 not started.

## Evidence before change
- `authenticated` had table-wide SELECT on `properties`; policies `public_view_active` and
  "Anyone can view approved properties or own content" (roles `public`) returned every approved row,
  so any signed-in user could read `lock_code`, `actual_owner_*`, `manager_phone`, purchase/mortgage fields.
- `anon` had column-level grants only (public contract); private columns denied.

## Migrations (forward only; 0021–0025 untouched)
- `0026_public_catalog_projection_extension` — view keeps its 65 columns and appends 104 columns that
  anon was already granted on the base table (no new private column); adds
  `guest_stay_property_details(booking_id)` (SECURITY DEFINER, actor = `auth.uid()`, own booking,
  status confirmed/checked_in, no lock code/owner contacts/finance); anon cannot execute.
- `0027_close_authenticated_private_property_reads` — `public_view_active` → `anon` only;
  "Anyone can view…" → `authenticated`, provider-own branch only. Remaining base reads:
  owner, provider, assigned manager, company staff (`staff_can_access_property`), admin, operating-space ceiling.
- Rollback: `docs/hardening/rollback/0027_close_authenticated_private_property_reads.sql`
  (disables RPC; does not reopen the leak; emergency reopen commented out).

## Consumers moved to the catalog
SimilarProperties, useProperties (lists, featured, instant, count, detail, marketplace detail),
useCommercialProperties (lists + detail), useHotelProperties, usePrefetch, usePropertyQuickFilters,
usePropertyAvailability (rental terms), StorefrontPage, useGuestPropertyChat (titles),
GuestCheckIn (rules from catalog, owner from the guest's own booking), GuestTripDetail
(guest RPC, catalog fallback), usePublicGuidebook, MCP `search-properties`.
Detail reads use `selectPropertyCatalogFirst`: catalog first, base table only as authorized PMS preview
(RLS returns nothing for others).

Commercial/hotel lists no longer request 11 private operating fields (rent roll, NOI, ADR, RevPAR,
occupancy, GOP, management status, operator); filters on them return an empty public result.

## Left on base table (authorized PMS/admin)
Owner/MC pages, admin catalog/moderation, delegate/assignment helpers, edge functions (service role).

## Residual items
- Active property delegates lose approved-property title embeds (0 active live); no policy added.
- Generic `uno_team` keeps PMS read via `staff_can_access_property` (pre-existing, separate decision).
- Base anon column grants kept (public contract); revocation optional later.

## Tests
- New isolated `publicPropertyCatalog.postgres.test.ts`: 6/6 (leak proven before, preserved after 0026,
  closed after 0027; owner/provider retained; anon column limits; catalog filtering and private-column
  absence; guest RPC own-booking only, anon denied).
- With operating spaces + inventory suites: 109/109, run against the applied migration files.
- Type check: 0 errors. Browser: `/property` and an approved detail page load signed-out and signed-in,
  all property requests go to `public_property_catalog` with 200.

## Live read-only verification after apply
Policies: `public_view_active` {anon}; "Anyone can view…" {authenticated}. Catalog rows: 23.
Enforced companies: 0. Spaces/assignments/members: 0/0/0. No business data written.

## E3
Private-field blocker closed. E3 remains not started; GO only after explicit approval and the
residual delegate/`uno_team` decisions.
