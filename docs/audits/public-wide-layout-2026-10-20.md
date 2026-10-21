# Public catalogue width adaptation — 2026-10-20

Base: main `0c1add9a3a4e5154393b65e3bf29ad7821a24519`. Independent of the
platform dashboard branch. No production data, permissions, migrations, release,
or local browser operation.

## Inputs and current routes

The three user screenshots were materialized through the supported Library
transfer into this executor's `task/screenshots` directory and viewed as pixels:

- `libfile_93a64d8294748191b7fc29a36bc37ce3`, 272235 bytes, services catalogue.
- `libfile_26e878cd255c8191a77e934f06ad729c`, 468934 bytes, housing search.
- `libfile_0b24a0c367688191bb4bdd2537cbeab4`, 250024 bytes, Business landing.

Returned Library/version metadata is retained in the local NTFS streams. The
screenshots do not establish the browser zoom. No CSS scaling compensates for
an assumed zoom.

Services screenshot is `/discover/services` and consumes `ServicesIndex` through
`MiniAppLayout` / `FeatureLayout`. It selects one preview per category and used
to put each single preview inside a separate four-column category section.
The new grid displays those same previews together and labels every category.
Full catalogue/category/search navigation and request returnTo remain intact.

Housing screenshot's rental duration, type/area/bedrooms, full-width submit and
collapsed name/guests controls match actual `PropertySearchPage` with
`HomeDiscoverySearch`, not the older `PropertyIndex` / `AirbnbSearchBar` surface.
`propertyHubRoutes` serves it at `/property/search`; `/property/browse` and
rent/buy aliases delegate through `PropertySearchRedirect`. `PropertyHub` now
opts out of its automatic outer container only for this exact search route,
including a trailing slash. Other property pages preserve their existing frame.

## Bounds and behavior

Explicit catalogue frame is1760px; Business sections1536px. Consumer header
selects the matching frame only on the supported catalogue/Business routes.
Default1280px marketing/article/form/detail frames, homepage overlay width,
canonical mobile gutters and measured header offsets remain unchanged.
The MiniApp width variant is opt-in and used by ServicesIndex.

Catalogue grids use one shared1/2/3/4-column token (four from1440CSSpx) for both
real cards and housing skeletons. Business gains four service columns at1440px
while hero copy remains768px and the inquiry form672px. Housing removes its
duplicate journey frame and compacts only its desktop form layout. Existing
fields, validation, calendar checks, guest and rent/buy/tenancy semantics,
URL state, Back/Forward, reset, auth return and no-date behavior are retained.
HomeDiscoverySearch and its date logic are unchanged.

Existing map mode retains actual properties, coordinates, filter callbacks and
selection. At1280px it shows side-by-side list/map areas and two cards per list
row; smaller screens retain stacked layout. No new map backend or map data.

## Validation and limits

52 focused services/Business/header/frame tests passed locally. Housing focused
tests cover shared real/skeleton tokens, same filtered records in map/list,
Back restoration, and exact search-route frame ownership. Full source typecheck,
broader unit/build/lint and current-head remote results must be checked before
acceptance; local test timing on the shared Windows host is recorded separately
and never treated as a successful browser check.

The additional required CI step uses real ServicesIndex, ServiceFunctionCard,
PropertySearchPage, HomeDiscoverySearch, PropertyListingCard, PropertyMapView,
ConsumerHeader and ForBusinessPage. It covers76 cases: RU/EN/TH at320/360/768/
1024/1440/1920/2560, housing loading/error/empty states at360/1440/2560 and map
layout at360/1024/1440/2560. All original mandatory gates remain required.

Reads are synthetic; the rendered property image is a labelled synthetic
diagram used only in this isolated fixture. Favorite and unrelated closed tools
are boundaries. Map geometry uses the actual component's no-key fallback; this
does not certify live Google Maps, provider availability, canonical external
fonts, physical device safe areas or real browser zoom. Geometry is at default
100% CSS-pixel viewports with device scale1. It does not claim screenshot pixel
matching at an unknown original zoom. Network attempts/errors fail the fixture;
source/module guards exclude production read modules. No browser is run locally.
