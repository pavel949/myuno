# Route reachability review, 23 November 2026

Baseline: `pavel949/myuno@838284e8257c879b025c3d145ed0c4da95430c2b`.
The mounted route graph (including admin, management and property fragments,
relative indexes and generated goals) has 715 registrations and 711 unique
patterns; there are no duplicate non-index declarations in this census.
The production import walk found 7 unreferenced page modules among 585
non-test page modules. This is source evidence, not analytics or proof that
external links do not exist. In particular it distinguished 128 compatibility
redirects, 264 guarded routes and 23 callback/receipt/token routes.

## Confirmed this change

- Connect **My support tickets** from Support for authenticated users. Keep
  public contact options. A direct signed-out ticket-history visit offers
  sign-in while retaining its URL; a failed read is not an empty history.
- Remove only the two unmounted implementations `PropertyMap.tsx` and
  `landings/legacy/NewDevelopmentsLanding.tsx` and their unused registry exports.
  **Preserve** `/new-developments` and `/property/map` compatibility URLs,
  existing query/fragment/state handling and the mounted map/search pages.
- Preserve the remaining five source module candidates pending individual review;
  imports from tests, legacy redirects and overlaps with current team workflows
  require separate disposition. No database, access policy or published route
  is deleted by this work.

## Remaining static navigation candidates (not deletion decisions)

| Route | Next gate |
| --- | --- |
| /ecosystem | Review overlap with current About/discovery before linking |
| /outreach | Verify intended operator audience and entry, not public navigation by default |
| /property/why-myuno | Verify claims about review and escrow before surfacing |
| /property/commercial/browse | Verify filter/deep-link callers against the canonical marketplace |
| /property/land/browse | Verify filter/deep-link callers against the canonical marketplace |
| /build | Check public catalogue purpose and active supporting service paths |
| /legal/tax-structuring | Verify current, sourced copy and navigation audience |
| /invest/thailand | Replace dated and unverified claims before promoting |
| /pets/transport | Its quote action targets an unmounted route; do not promote until repaired |
| /owner/storefront-demo | Confirm demo scope and external campaign dependencies |

`/support/tickets` was the eleventh navigation candidate and is intentionally
connected here. Existing reachable aliases, entity links, saved searches and
callback/receipt URLs are not deletion candidates merely because they are
absent from a static menu.
