# Yachts and flowers discovery convergence

Scope: `/yachts` and `/flowers`, based on main `f3b55ae4c8d83ad5321f9193a6df6d0fa651d650`.

## Changes
- Shared public-commerce card treatment, compact editorial intro, real catalogue photography and request explanation. No replacement hero or invented supply.
- Both catalogues: one-column cards below 420px, two columns at 420px, three desktop columns; matching skeleton geometry.
- URL-owned search/filters, native detail links and browser history restoration. Clear removes catalogue criteria while retaining unrelated attribution/persona query keys.
- Yacht discovery adds recorded-capacity filtering and text search. Accessible native sorting replaces the click-only floating sort panel. Removed the broad Instant filter/SEO promise; per-offer booking-flow metadata and actual detail workflows are unchanged.
- Yacht price sorting compares full-day rates only, with unrecorded/non-finite rates last. Mixed or unknown currencies disable price comparisons. Cards display recorded currency instead of silently treating all amounts as THB.
- Flowers remove the negative condition-line margin, use a readable introductory conditions block, and expose only implemented filters. The former Size control was inert and is hidden rather than pretending to filter available variants.
- Bouquet adapters retain packaging facts but do not present editorial popularity/scarcity/social-proof fields as verified order statistics or inventory.
- Catalogue failures have distinct safe error/retry states, not a zero-results message. Search-only empty results can reset all criteria.

## Invariants
No DB/schema, auth, inventory, payment, request writer, cart, order or notification changes. No production business writes. Date availability remains a detail/request concern; capacity matching is not a reservation. myUNO handles the request; submission is not confirmation. No semantic validation of arbitrary marketing descriptions is claimed.

## Verification
- Focused Vitest: 16 passing tests (URL round-trip, invalid capacity/type/sort, price/currency comparisons, unknown-last ordering, bouquet badges, route search/detail/Back/Forward, reset and error/retry).
- Full TypeScript attempted: earlier runs exited 134/137 under the executor resource limit; final run status must be checked before release. No full typecheck pass is claimed.
- Focused ESLint: no errors; two existing `no-explicit-any` warnings in the shared localized-field adapter.
- `design:check`: 0 new/structural findings; existing baseline remains.
- `git diff --check`: passed.
- Production build attempted: Vite transform process killed by execution resource limit, not a verified build success. Generated version/MCP artifacts reverted.
- Isolated visual fixture bundled actual category pages, FeatureLayout, UnifiedHeader and CatalogCard with synthetic reads. Chromium could not launch (`socket() failed: Operation not permitted`), including permitted escalation. Therefore no verified screenshots/mobile geometry or live visual acceptance. Review in browser and exact-head CI still required before merge.

Draft PR only. No merge or deploy. This tranche does not certify end-to-end booking, notification delivery or commercial readiness.
