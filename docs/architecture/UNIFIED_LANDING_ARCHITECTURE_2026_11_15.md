# myUNO unified landing architecture — approved scope, 2026-11-15

## Product rule
One account, one design system, one navigation grammar and one request inbox. Multiple public discovery entrances are not separate products. Do not mix `pavel949/myuno` with `myUNO-final`; OFFPLAN is a distinct system.

## Landing hierarchy
- Global home `/`: unified intent search, four destinations (property, services, experiences, owner management), recent activity, account and requests.
- Property hub `/property`: Rent, Buy, Sell, Manage. The new `PlatformJourneyLinks` is a shared DS2.1 entry and must not duplicate the existing Seeker/Capital/Pro lanes indefinitely.
- Rent: `/property/browse?mode=rent&tenancy=short` and medium/long variants. Airbnb-like results require real calendar availability, date range, guest count, pricing breakdown and booking state. Never assert instant confirmation for request-only inventory.
- Buy: `/discover/buy` and `/property/offplan`, `/property/resale`. Keep project and unit entities distinct. OFFPLAN integration via reviewed API/deep links only, never assume shared DB.
- Sell: `/sell`: owner lead intake, asset data, upload, consent, CRM assignment and follow-up.
- Services: `/services`: needs-based discovery, category/filter/provider offers, booking sheet.
- Experiences: `/experiences`: tour/activity/yacht discovery with shared marketplace design language and experience-specific availability.
- Manage: `/owner/management-landing`: owner acquisition, PMS onboarding and secure owner workspace.

## Persona composition
Guest/tourist, resident/expat, buyer/investor, owner, agent, provider and staff/admin use the same identity; capabilities and navigation are permission-aware, not separate logins. A user may have multiple personas. Never infer authorization from editable user metadata.

## Shared implementation contracts
- `src/styles/tokens.css` is the only design token source; preserve DS2.1 sharp controls, cream/navy/orange palette, semantic status and 44px tap targets.
- Reuse `PlatformJourneyLinks`, `MarketplaceDiscoveryHero`, `MiniAppLayout`, `PageShell`, `Card`, `Button`, `Input`, `Select` and existing listing components rather than building duplicate primitives.
- Hero photography is editorial and licensed, with real media and safe fallbacks. Never fabricate listings, reviews, prices, availability or supplier verification.
- Search is URL-backed; maintain deep links, back/forward and filter state. Mobile-first widths 375/390/430, tablet 768, desktop 1440.
- Calendar controls must share date/timezone (Asia/Bangkok), availability semantics and overlap protection but retain vertical-specific booking and pricing rules.
- Submission requires authentication or preserved draft, persisted request ID, CRM visibility, admin notification attempts and customer request-received receipt. Operator confirmation is separate.
- Accessible keyboard focus, screen-reader labels, reduced-motion, media aspect ratios and layout shifts are release gates.

## Additional missing capabilities to track
- Unified global search routing by intent; saved/favorite offers; recently viewed; user trust and support center.
- Currency display without invented conversion; pricing provenance; clear taxes/fees and cancellation rules.
- Legal/PDPA consent and customer data retention; provider vetting; listing content moderation.
- Supplier/provider dashboards and operational SLA; notification outbox/retries; support escalation.
- Analytics: search-to-view, view-to-request, request-to-confirmed and failed-delivery rates.

## Status
Landing shared navigation implemented in branch only. Services/experiences discovery hero implemented in branch only. The end-to-end booking, all portal landing migrations, global search and production publication are **not verified**. Do not merge solely on the strength of these architectural files. Run TypeScript, lint, design:check, visual routes and E2E before release.
