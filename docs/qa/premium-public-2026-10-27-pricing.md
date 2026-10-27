# Public project pricing contract — 27 October 2026

Scope: PR196's connected public journey and its existing newbuild entry points.
No database/schema/RLS, permissions, credentials or real inventory values change.
No Drive/pricelist import runs as part of this change.

## Canonical editable price

Use positive, finite `property_projects.price_from`. The existing developer
editor explicitly stores this field in THB. `property_projects` has no independent
project currency column; public formatting must not relabel it with viewer/city
currency. Admin's label is aligned to the same THB contract.

Public label: `от … THB` / `From … THB`, with `Цена требует уточнения` /
`Price requires confirmation` and Thai equivalents through existing i18n.
Missing, cleared, zero, negative, non-finite or nonnumeric values show
`Цена уточняется` / `Price to be confirmed`. Never resurrect a cleared editable
price from `price_from_thb` or a random unit. No hardcoded price or FX conversion.
Unconfirmed starting prices are not emitted as structured offers/availability.

This is a project starting price entered by the publisher. It is not a computed
minimum across available sale units. Current unit readers do not establish the
necessary sale/publication/availability/currency coverage to derive that minimum.
Future price lists must match existing canonical project/unit IDs and currencies;
no importer, invented matching table or price is added here.

## Existing editing routes

- `/admin/newbuilds`: existing admin inline editor, `Цена от (THB)` then
  `Сохранить`. Successful edits invalidate canonical public readers.
- `/developer-portal/projects/:id`: existing developer project editor,
  `Цена от (THB)`. Original ownership checks and re-moderation remain in place;
  editing a published project does not silently bypass approval.
- Unit editors retain their existing currency fields and original private data.
  Public presentation masks do not overwrite or re-save their source values.

The isolated test uses actual AdminNewbuilds UI/mutation and actual canonical
query/card/detail/home components against an in-memory Supabase adapter. It
verifies save, refreshed reads, viewer-USD isolation and clear-without-legacy
fallback. It is not proof of live credentials, RLS or a real write.

## Public facts temporarily withheld

Construction stage/progress/completion, available/sold inventory, ROI/yield/risk,
project scores and related financial defaults are omitted across the shared
project projection, cards, details, previews, areas, maps, persisted comparisons,
microsites and structured metadata. Publication uses existing active + approved +
public_listing_enabled conditions; physical complex metadata remains separate.

Comparisons persist identity and reload current project prices by canonical ID.
Old PEYLAA campaign URLs resolve to the canonical project/inquiry route instead
of rendering embedded prices, payment figures or returns. Microsites require
existing explicit landing_enabled opt-in. Public floor plans retain descriptive
unit information without inferred availability or unqualified unit prices.

Generic calculator results require user-entered assumptions, including explicit
zero expenses. It no longer injects a fictional purchase price/rent/fee or silently
uses a persona's financial presets as project facts. Unknown price-band match
coverage does not become a zero or a misleading transactional count.

## Evidence and limitations

Local real-browser SPA checks use explicitly synthetic intercepted reads, block
live writes and capture widths320/390/430/1440/1920. Primary price screens and
mobile inquiry open/Tab/Escape/reopen passed; area and comparison prices were
checked separately at390/1440. Original search/property/area/complex return fixes
remain covered by their earlier actual SPA checks and regression tests.

Selected reference image pixels were not available to this executor; text-first
implementation was authorized. Final visual comparison remains separate.
Production browser acceptance follows publication and served-commit verification.
No live lead, booking, payment or protected editing write is part of these tests.
Exact committed-head CI and publication status are recorded in PR196, not implied
by this document or by earlier green heads.
