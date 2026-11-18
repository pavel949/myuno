# Experience discovery taxonomy: Klook reference, MyUNO implementation

## Evidence (18 November 2026)
Official reference: https://www.klook.com/destination/c7-phuket/1-things-to-do/ and https://www.klook.com/experiences/ . The Phuket page separates detailed activity topics from experience attributes (family/child suitability, duration, pickup). It offers search/filter discovery and sorting by price, ratings, recency and bookings; its cards identify the activity and location. We adopt progressive category discovery, not Klook branding, commercial claims, stock counts, ratings or availability. No booking-count or date-availability sort is introduced without corresponding MyUNO authority.

## Implemented contract
- `experience_categories` remains canonical editable category registry; `listings.category` and listing IDs/routes stay unchanged.
- Eight browse groups in `experienceDiscovery.ts` classify existing slugs and offer prospective bilingual/Thai editor presets. These are navigation/templates, not inventory or a new database.
- Admin category page exposes all prospective topics, search, grouping, existing-category edit and prepare-hidden-category action. Explicit Save is required. No migration or mass seed. Aliases find existing rows rather than creating duplicates. Custom categories remain accessible under Other.
- Admin listing category selector uses the canonical registry, including hidden prepared categories, preserving an existing unknown slug on read failure.
- Public landing promotes groups backed by returned public offers only; categories inside a chosen group remain discoverable. Search, sorting, legacy category URLs, query context and history remain owned by the URL. Unknown group/place filters do not widen results.
- Venue facet requires both `catalog_kind=venue` and `location_type=fixed_venue`. A zipline/fishing category alone proves neither venue nor geolocation. Programmes and venues remain separate records in the existing model; no destructive deduplication.
- Public list requests active+approved+published rows; detail applies the same admission. Explicit temporarily_closed/permanently_closed/closed rows excluded. Unknown status is not called open. Admin hook/editor retains its independent authenticated access.
- No provider checkout links, booking state or concierge contract changed. PR250 provides concierge handoff separately.

## Limits and rollback
No production rows written, no schema/RLS changes, no proof of production release. Services and property retain their established taxonomies. Family/rainy-day suitability, age, access needs, visit duration and geography should be explicit recorded facets, never inferred from category or marketing text. Existing unrelated hooks still may read other policies and require separate audit.
Rollback UI via revert; retain restrictive published/approved admission. No destructive data migration to undo.
