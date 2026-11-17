# Homepage clarity — 17 November 2026

Base: `0e599eaf467eed60d49f7f86e417f93bf364c345` (main, PR #213).
Scope: public anonymous homepage only; no tokens, shared navigation primitives, auth, database or production changes.

## Changes
- Keep four direct hero intents; remove the repeated search-shaped discovery link and tenancy row.
- Reduce content-driven hero spacing and make the owner entry secondary.
- Put experiences/services before new developments; preserve the experiences catalogue route on empty photo previews with an honest empty state.
- Keep the partner grid for owners/operators/developers/providers; remove the consumer card and duplicate owner panel.
- Align rental-card content; replace dual rent/buy links in the rental showcase with a single rental-detail action.
- Preserve every canonical recorded tariff. If different periods carry the same amount, request confirmation explicitly in RU/EN/TH. Equality is not proof either amount is incorrect. No guessed correction, conversion or database edit.

## Verification
- 160 tests passed in 19 homepage/component suites, including RU/EN/TH, empty/error/loading, intent routing, tariff preservation, media failure and auth-loading separation.
- Design-system audit: zero new/structural findings (existing baseline remains).
- Scoped ESLint: zero errors, three pre-existing warnings.
- Independent read-only source review: no blocking homepage logic findings.
- Isolated browser fixture compiled from actual components with synthetic reads; production client excluded.
- Chromium could not launch: `socket() failed: Operation not permitted`, also after authorized sandbox escalation. No mobile/desktop screenshot acceptance claimed.
- Production build stopped during transform (`Killed`), not a successful build.
- Initial default-heap typecheck ran out of memory; larger-heap retry recorded separately below.
- Initial concurrent broad suite had an unrelated RoleSheet timeout; bounded final rerun passed all 160 tests without skips or assertion weakening.

## Remaining gates
Actual responsive visual review (375/390/430 + desktop), full build/typecheck/CI on the exact candidate, and current-main overlap reconciliation before integration. Other active platform design work is separate. This is a draft, not a deployment.

Data-source verification of Canvas tariffs and editing database-authored listing titles remain outstanding. Shared `/search` taxonomy/field accessibility is deliberately outside this narrowly coordinated homepage change.

## Owner follow-up: category breadth and consistent galleries

- Group rentals and purchase/newbuild discovery together before experiences/services.
- Newbuilds use the same HomeGallery/HorizontalRail contract as rentals, up to six actual records, native touch/keyboard scrolling, no autoplay, visible catalogue link. Three or fewer records remain a desktop grid; mobile shows a next-card peek.
- Prefer named/photo-backed homes with explicit unambiguous recorded THB tariffs in the homepage preview. Stable ranking only: retain all other eligible homes as fallback, never suppress a named development or alter stored rates.
- Add a yacht category from active live taxonomy, alongside flowers; always keep clearly labelled catalogue navigation available even when supply preview is empty. Flowers and yachts reuse existing repository photos as explicitly labelled inspiration/category imagery, not bookable offers. Visually inspected both files; the flower file name says roses but depicts a lily, so no rose/product identity is asserted. Original upstream licensing is not independently established.
- Previous production build retry reached chunk rendering but was killed (exit 137); browser launch remains blocked by this environment. CI and screenshot review remain release gates.

## CI visual follow-up

Reviewed actual EN 320px failure screenshot from connected-system run 44003277595. The fixture still expected four rails/categories after adding the purchase rail and yacht category. Updated exact expectations to five rails, five categories, six category destinations; added newbuild touch-swipe and aligned property-heading gutter checks. Also corrected inherited CSS that hid category photographs and removed newbuild container gutters. Browser fixture serves only the two explicit repository category-photo paths and asserts that both images visibly load; other illustration visibility remains unchanged. Existing locale/viewport matrix, network denial, route, overflow and keyboard checks remain intact.
