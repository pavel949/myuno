# Shared marketplace entry and category results

## Accepted target

Owner approved the proposal to unify experiences/services after the published mobile experience put the first offer around 2503px and primary service categories around 952px. Entry: compact title/search → six primary categories plus explicit All categories → actual offers. Category results: retained search/conditions → results, with no repeated marketing hero or duplicate tour/activity entry controls.

## Implementation and authority

`MarketplaceDiscoveryMenu` is shared presentation over existing active category records. Remaining categories are accessible in the actual shared Sheet; native yacht catalogue links retain their existing route and navigation context. Experience category thumbnails use recorded offer covers; existing service illustrations are presentation only. No category, provider, price, availability, popularity or verification status is invented.

`MarketplaceFilterSheet` contains the existing URL-backed type/category/sort and category/situation controls. Provider offer filters use the same sheet while retaining their existing query, currency, date, unknown-schedule and retry behavior. The public provider projection does not supply category/situation membership; this change does not infer it from names. Request templates and actual provider offerings remain labelled distinctly.

Both page families use the canonical catalogue frame and grid. Experiences opt into one reversible map/list action in FeatureLayout; all other consumers retain their existing toggle by default. Legacy services title/section overrides no longer override the shared marketplace header and spacing. Booking/request/writer/API/schema/RLS/payment/inventory logic is unchanged.

## Compatibility and rollback

Integrate current main and the existing #233 discovery candidate, preserving the released mobile menu and admin fixes. Regenerate route and primitive source inventories. A clean textual merge alone does not prove UI acceptance.

Rollback through a reviewed frontend revert; no data rollback or backend activation. Retain safe public readers, recorded amount/currency/units, unknown availability handling, request labels and catalogue return context.

## Verification contract

- Routing/reader tests retain URL query, opaque navigation state, incompatible category handling, sort history and unknown/mixed-currency behavior. They explicitly render filter children through a presentation boundary; this is not modal acceptance.
- Actual Sheet tests cover primary-six/all-record exposure, native routes, empty input, selection dismissal, keyboard Escape and focus restoration.
- Browser fixtures exercise actual pages/headers/category grids/sheets/cards with synthetic readers and blocked external traffic. Existing assertions for all categories and nested home aliases remain, reached through their new visible controls. No force clicks or weakened error/availability assertions.
- Check RU/EN/TH and 375/390/430/desktop; measure first-offer placement, viewport bounds, keyboard controls, nested Select Escape, Back/Forward, search/sort, loading/error/empty and request return context. Synthetic writers cannot create live business records.
- Final hosted CI and production read-only smoke are required before declaring publication complete. Passing frontend checks does not certify backend payment, notification or service-order authority.
