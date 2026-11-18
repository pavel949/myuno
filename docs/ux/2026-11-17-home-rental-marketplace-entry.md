# Home rental carousel → canonical marketplace

Owner request: keep the homepage rental rail photographic and compact, move detail into a marketplace with search and filters, retain DS 2.1.

## Captured audit (2026-11-17)

1. Live homepage: native scrolling rail existed, but cards exposed bedrooms, area, tariff summaries, rate-review notes and several competing links. Photo/title went directly to detail. Desktop rail controls intercepted the All homes header link. Needs correction.
2. Live rental catalogue: actual search, URL-backed criteria, date/guest/type/bedroom controls, price/amenity sheet, sort and map exist. Expanded initial search buried results. Some published records have unavailable photos; that remains a content/media issue, not invented stock inventory.
3. Live filter sheet: existing DS navy/cream typography, sharp surfaces and shared controls. No alternate design system or duplicate filter implementation needed. Screenshots do not certify complete accessibility or backend behavior.

Current-run captured screenshots: `/tmp/myuno-audit/01-home-before.png`, `02-marketplace-before.png`, `03-filters-before.png`. Fixed preview screenshot: `04-home-after.png` (synthetic, explicitly labelled QA images; not real supply).

## Implementation

- HomeListingCard shows one stored photo, localized name and district. One native Link covers the card, with visible keyboard focus and preserved failed-image fallback/removal.
- Link enters existing `/property/search?mode=rent&focus=<id>&q=<localized-title>`. Existing name search brings the chosen offer into the results; existing list/map focus retains its ID. No synthetic property, new reader or booking system. Clear/change search opens comparison with other published homes.
- Existing catalogue starts with a compact editable summary. Same HomeDiscoverySearch, UniversalFilter, PropertyListingCard, map, sorting, pagination, URL/history and detailed-property routes.
- Rail controls occupy a separate row so they cannot intercept All homes. Existing HomeGallery/SectionHeader/HorizontalRail remain the composition primitives. New spacing/type uses DS tokens; palette/radius, canonical facts, tariffs and transaction authority are unchanged.
- PROJECT.md now distinguishes photographic homepage previews from commercial cards that must disclose recorded rental periods. Full tariffs/ambiguity rules remain in marketplace/detail.

## Verification

- 93 focused tests in four files PASS (card media, EN/RU/TH preview content, URL encoding/intent, actual catalogue editor/filter/history integration).
- Full typecheck PASS; production Vite build PASS (7171 modules, 2m52s) on initial base d9bb2b9e.
- Changed-file ESLint: zero errors, one existing image onError accessibility warning.
- Design audit: zero new/structural findings; primitive adoption register regenerated and checked; register unit test PASS.
- Actual homepage fixture: EN/RU/TH at 375/390/430/1440; route/link/scroll/layout checks, synthetic data and external requests denied.
- Actual canonical search fixture: 8 EN/RU cases at 375/390/430/1280 PASS; URL hydration, editor, history, date/guest/type/price/amenity controls, map, rent/buy, blocked calendar dates, no overflow/runtime errors/external requests.
- Public property journey: 15 EN/RU/TH cases PASS, preserving area return and detailed photo/offer behavior; home handoff target is a labelled synthetic catalogue boundary. Actual catalogue behavior is tested separately above.

No production business writes, new data, auth/backend/migration or payment changes. No claim of live booking acceptance. Source publication is distinct from a production deploy. Rollback: revert this frontend tranche.
