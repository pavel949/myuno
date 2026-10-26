# Public property catalogue entry — 2026-10-26

Base: `4e96c70d67c3b550ca89eb1eabf4acc3bf9b138f`. The original local checkpoint had no remote delivery. It is now proposed in draft PR #191; no merge, publication, database or permission changes have been made.

## Observed defect

`/property` opened a separate landing. `/property/browse` redirected to the existing search page, but a URL without criteria silently selected rental eligibility and short tenancy. With the same isolated 47 eligible published rows, the old page rendered only 15 short rentals. The empty text input was not itself required by the hook; the implicit intent was the exclusion.

## Change

The property index, browse alias and search use the existing catalogue. An unspecified intent means all publicly eligible catalogue rows. Explicit rental/purchase and legacy intent bookmarks retain their narrowing behavior. Name, type, district and other selected criteria narrow that list; clear removes catalogue criteria and restores it while retaining unrelated bookmark/view context, hash and router state. Name is visible and optional.

No new search, inventory or authorization model. Reads remain on `public_property_catalog`, with active/approved predicates and the existing safe projection. Page size remains 20. A unique ID tie-breaker stabilizes offset ordering and query cancellation aborts obsolete reads. A failed next-page read keeps loaded cards and permits manual retry. Map/list receive the same filtered IDs; mixed-catalogue cards and map detail links resolve the existing supported property intent instead of forcing rental presentation.

## Isolated verification

- Unit/integration: real page, editor, redirects, URL history, actual React Query infinite hook; synthetic read adapter only.
- Three-page catalogue: 47 unique eligible rows; inactive/draft fixtures excluded; server name search finds a record beyond page one; clearing restores the initial catalogue.
- Late request cancellation; error/retry; retained first page after a failed next page.
- Browser matrix: EN/RU/TH × 320/375/390/430/1440, plus a separate manual-pagination case (16 total). Real page, editor, cards, hook and page CSS; synthetic public reads and map SDK boundary. External requests denied. Check optional entry, pagination, text, empty/reset, Back/Forward, rapid submissions, map/list IDs and page overflow.
- Before: actual base search at 390px RU, synthetic data. After: same scenario with full catalogue. Screenshots are local QA evidence, not live acceptance or real inventory.

Reproduce:

```sh
npx vitest run --maxWorkers=1 src/pages/property/__tests__/PropertySearchRoutes.integration.test.tsx src/hooks/__tests__/useProperties.catalogue.test.tsx src/lib/__tests__/propertySearchQuery.test.ts
node scripts/qa/property-catalog-entry-ui.mjs
npm run typecheck
npm run build
```

Browser evidence defaults to `/tmp/browser/property-catalog-entry-isolated`; override with `CATALOG_QA_OUTPUT`. The runner uses the installed Playwright Chromium, or an already installed local system Chromium outside CI. It never installs a browser or contacts a production backend.

## Limits

No deployed catalogue/RLS acceptance or authenticated operator acceptance was performed. No real records were created. Google Maps SDK is an isolated boundary; the shared filtered IDs are tested, not a live map API. Fonts use available fallbacks. Offset pagination is deterministic for an unchanged snapshot but does not promise snapshot isolation while listings are concurrently edited. Existing sorting orders loaded rows; this patch does not add global server-side sorting.

The supplied Library JPEG could not be materialized through the supported helper (`download failed`); no local image was produced and no claim is made about its pixels. No alternate download route was attempted.

## Original saved verification checkpoint

128 distinct focused/compatibility/map tests passed (including 12 malformed/optional intent cases). A 16-case browser matrix passed; native auto-scroll pagination and manual button pagination are separate cases to avoid clicking a disappearing auto-load control. No timeout or result assertion was relaxed. The fixture matches current `src/App.tsx` BrowserRouter options: it does not opt into the not-enabled `v7_startTransition` future flag. An earlier fixture with that extra flag exposed draft replacement during rapid submission; enabling it is outside this candidate and is not certified.

The map unit tests render the actual map component with an SDK adapter and verify mixed intent, sale asking price, monthly labels and detail context. This remains different from a live Google Maps acceptance.

The existing search-controls harness now opens the guests disclosure based on the guest field visibility, verifies that clear returns to all intents, and explicitly selects rental before continuing rental date/price assertions. Its full matrix and timeouts are retained. The dedicated 16-case catalogue matrix also runs inside Design system verification and is retained with its synthetic UI artifacts.

## Review corrections: actual entry and mixed catalogue criteria

The real guest Homes destination in `GUEST_NAV`, consumed by ConsumerHeader and BottomBar, is `/property`; `/discover/stay` remains an explicit rental goal. The browser harness mounts the actual header, bottom bar, navigation model, property child-route tree and GoalEntryPage. Only unrelated registry pages, preferences/auth/cart/prefetch and backend readers are adapters; navigating to an unrelated registry page throws rather than simulating success.

A direct `mode=all` bookmark is normalized before deriving reader criteria. Guests, instant booking, stay dates/tenancy and offer-specific price/intent keys are removed, the URL is replaced without losing unrelated keys/hash/router state, and no restrictive first read is issued. Explicit rental bookmarks keep their criteria.

Mixed-catalogue price sorting uses the amount shown by each card: canonical asking price for sale/dual offers and the displayed rental rate for rentals. It sorts within fixed offer/period/currency groups, with unknown amounts last in their group. Ascending/descending changes comparable amounts, not the group sequence. Visible group captions and a localized note explain that periods/currencies are not numerically compared and that ordering covers loaded rows. There is no new currency conversion, repricing or claim of global server-side sorting.

The expanded browser matrix has 25 cases: the previous 16 plus EN/RU/TH at 320/390/1440 exercising actual Homes clicks, preserved explicit rental goals, mixed sale/dual/nightly/monthly prices in both directions, dirty All bookmarks, history/state and overflow. Screenshots include the real navigation controls and the grouped prices. Final sequential unit/integration/navigation coverage passed 263 tests across 13 files. The 25-case browser run passed; actual mobile header/bottom-tab and desktop grouped-price screenshots were inspected. These are isolated synthetic readers, not production acceptance.

The public-wide geometry assertion now follows the actual intent: three criteria for All/Buy and four for Rent; every existing case and bottom-baseline assertion remains. Failed full reads with cached empty rows display an error rather than a false empty catalogue; next-page failures retain loaded cards and the manual retry. Both states have regression tests. The earlier CI archive download returned tunnel 403, so its individual failure rows and calendar log were not inspected; no claim of exact calendar diagnosis is made.
