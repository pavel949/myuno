# Public journeys and theme alignment — 18 October 2026

User-authorized scope: align light/dark presentation across the shared application system, simplify the public holiday/rental journey, and improve property search. Implemented over existing property/service domains; no schema, inventory, pricing, payment, auth or production business mutations.

## Implemented navigation ownership

| User intent | Entry | Next destination / data owner |
|---|---|---|
| Find a home | Жильё · `/discover/stay` | `/property/search` → existing public property projection and property detail/quote flow |
| Prepare a holiday | Отдых · `/trip-planner` | Same rental search + local personal checklist; transfers/experiences link to existing service verticals |
| Buy | Покупка in home search, or housing goal navigation | Existing purchase search, off-plan and resale routes; no rental dates required |
| Move / live | Homepage Переехать жить · `/discover/live` | Existing relocation, long-term property search, everyday services |
| Find a service | Услуги · `/discover/services` | Existing service categories → offering/request/booking flow |
| See personal status | Профиль · `/account`, `/bookings` | Existing authorized account/bookings surfaces |
| Manage property | Homepage Собственникам · `/for-owners` | Existing owner entry and authorized workspace |

Desktop consumer navigation and the standard mobile navigation derive from `GUEST_NAV`. Home / account remain explicit destinations on mobile; the desktop uses the wordmark / account control. Purchase is inside housing, rather than competing with the holiday entry in the primary bar. Feature-flagged professional and Me navigation remain unchanged.

A holiday includes housing and services, but does not own duplicate property/service data. A checklist mark is local preparation state, not booking or payment confirmation. Public search receives managed property-type and district options from existing hooks; selected type, district, dates and guests use the existing search URL contract. Advanced bedrooms, amenities, price and map filters remain in existing results UI.

## Compatibility boundaries

The existing `/property/browse` and `/property/search` screens have different filter contracts (`f.*`/`cats` versus `types`/`district`/dates). New public rental entry links converge on `/property/search`. Legacy routes remain mounted: silently redirecting all browse state would lose saved filters, commercial modes and specialized views. This PR does not claim those implementations have been merged. Specialized professional routes and flags require their own acceptance before removal.

## Shared design changes

- Same consumer header on homepage and consumer TopBar routes; explicit text labels, responsive menu, search, theme/language/currency and account/cart controls.
- Shared semantic dark surfaces, text aliases, status foregrounds and secondary/ghost button surfaces. The global theme preference persists through the existing ThemeProvider; routes do not reset it.
- Homepage/search follow both themes; the cinematic photograph retains white overlay text in both.
- Remove global shrink/brightness effects on every link/button; preserve explicit component interactions and reduced-motion support.
- Holiday page: clear editorial heading, rental search first, readable preparation checklist, secondary service links/help.

## Limits of the verification claim

Shared tokens affect all consumers, but this is not an assertion that every specialized application screen has received a page-by-page redesign. Existing independent branded layouts, role-specific navigation flags and fixed-color content need targeted review. No authenticated operational flows or production transactions are exercised by this UI task.

Rollback: revert this PR. No data or theme-profile migration is needed; existing theme selection storage is unchanged.

Additional findings fixed during browser QA:
- Persistent `will-change: transform` on PageTransition made fixed mobile navigation anchor to page height. Removed the persistent containing block; checked menu bottom equals viewport bottom.
- Standard guest bottom navigation previously replaced its third destination with a second service/app launcher. All five task destinations are now visible; professional/Me flagged variants remain intact.
- Install promotion now follows page content instead of preceding the task.
- Rental results do not upsell property investment on an empty search. Search errors are distinct from an empty catalogue. Reset clears URL-owned search fields and remounts the search control so visible selections match results. Updating a search retains tenancy/company context.
- Housing landing uses rental/purchase subnavigation only; relocation and services no longer duplicate the global navigation as a second goal tab row.

## Data structure behind the journeys

| Concept in the interface | Existing source / contract | UI responsibility |
|---|---|---|
| Villa, condo, apartment | Managed `property_type` lookup options; `properties` public projection | Filter an existing property catalogue, never create one catalogue per home type |
| Area | Managed `district` options | Pass its canonical key via `district` |
| Dates / guests / home type | Existing `SearchParams` and server catalogue-filter adapter | Preserve URL criteria; search results are not a reservation or confirmed availability |
| Rental vs purchase | Existing listing mode | Rental date/party inputs are omitted from purchase handoff |
| Readiness for a trip | Existing browser-local checklist | Personal preparation only, separate from booking/payment truth |
| Booking / service / payment | Existing authorized domain workflows | Navigate to their current writers; no secondary record model |

Core criteria are edited once in the search control. The additional filter sheet excludes duplicate type/district/bedroom/party/listing controls, keeping advanced property details there.
