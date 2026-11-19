# Property discovery launch gate — 2026-11-19

Base: pavel949/myuno main b4bbfde5dca7a301940d3baf8c04695221ae0701.

## Reproduced public P1
`/property/search?mode=rent&project=94cdd545-c140-4b3c-b243-e6ed0474036f&view=map` displayed Google's map-account error. The catalogue used GoogleMap although the platform already owns a MapLibre/PMTiles component. Observed in read-only browser, no request or business records created.

## Contained fix
PropertyMapView now adapts its existing filtered property records to MapLibreMap, without changing that shared map. Retains canonical prices, sale/rental detail intent, publicJourneyState return context, external/local selection and hover. Markers get scoped price-pill styling; card gets a close control; invalid/missing coordinates are excluded and an explicit empty status appears. Existing data readers, filters, pagination, backend, permissions and global map unchanged. This does not certify full offline functionality or production tile availability.

## Evidence
Before fix: 143 tests passed across 7 search/map suites on base main.
After fix: 84 tests passed across PropertySearchRoutes.integration, PropertyMapView.catalogue and MapLibreMap (overlap, not additive). Includes 7 adapter tests for price/intent/unknowns, close, invalid coordinates and controlled selection.
ESLint: zero diagnostics for both modified TSX files. git diff --check passed.
Full app TypeScript check was killed by environment resources, NOT passed.
RU/EN 375/390/430/1280 isolated browser fixture compiled but Chromium launch failed with socket EPERM, including escalated attempt. Browser scenarios and visual responsive acceptance remain UNVERIFIED.

## Public observations
/property redirects to /property/search; Rent/Buy selection changes URL and content. Buy reports zero direct sale offers and links to newbuild/resale catalogues instead of inventing inventory. Rental Ocean Stone filter produces one matching public property. Map mode preserves filter URL but fails as above. Initial unfiltered catalogue contains photos missing for several Layantara cards; data completion remains an operational gate, not addressed by this map adapter.
No production business writes, notification sends, migration, merge or deploy.

## Release decision
Local patch ready for review, not release GO. Require CI/typecheck and isolated responsive map-card inspection, then governed deploy and read-only production recheck. Rollback: revert the two adapter/test files; no DB change.
