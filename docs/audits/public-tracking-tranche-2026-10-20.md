# Public tracking and navigation tranche — 20 October 2026

## Implemented source scope

The public consumer shell uses Home / Homes / Bookings / Services / Profile in RU/EN/TH. Existing workspace navigation remains role-specific. AppLayout already selects the consumer navigation independently of the authenticated workspace role; mounted tests cover this boundary. Business remains a public header destination.

The third consumer tab opens existing `/bookings`. It now includes read-only property order and service-order sections using `useGuestPropertyBookings` and `useGuestServiceOrders`, plus existing `/my-stay` and `/me/requests` links. The existing legacy `bookings` list, status history and filters remain below. Each canonical reader has independent loading, error/retry and empty states. A pending or failed legacy list does not block the canonical sections. Amounts and property photos are not inferred. Property order IDs are deliberately not linked to `/trip/:id`: that existing page reads `property_bookings`, a different record identity.

Guest sign-in returns preserve router pathname, search and hash for `/bookings` and `/me/requests`. Clearing only the legacy booking filters preserves persona, returnTo and hash. The trip planner remains in public Home journeys and has explicit links from personal Home and Services. GoalEntryPage services and MeServices already reuse ServicesIndex; no second service shell was introduced.

## Limits and follow-up

`useMyRequests` now records returned Supabase errors and thrown failures per source while preserving successful entries and its public requests-array API. MeRequests shows a localized retry warning for relevant failed sources and suppresses empty/all-clear claims for incomplete results. Filtering to a successfully read source can still show its verified empty state. Its signed-out state redirects instead of pretending to be empty. Queries, actor filters, limits and endpoints are unchanged.

No housing complex index route was invented. Existing unit-to-complex context links remain. Existing tracking detail/readers retain their authorization and data contracts. No database, role, payment, booking creation or deployment change is included.

Validation: focused mounted and synthetic-data tests cover navigation ownership, public role parity, canonical tracking states, guest auth returns and booking filter context. Scoped lint has no errors; one existing Bookings ref cleanup warning remains. A prior default 2GB TypeScript run exhausted its heap. The coordinated full typecheck with an 8GB heap passed; full repository lint passed with zero errors and 2,475 warnings. Final build and new-head CI evidence are recorded in the pull request. Source and local tests do not establish production acceptance.
