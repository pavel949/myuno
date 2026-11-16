# Public listings, navigation and role portals — 2026-11-16

Target: `pavel949/myuno`, base main `65bc193083a1385bd2ec1bdcfba0283aceb35d0d`. Branch: `fix/public-journey-clarity-20261116`.

The owner prioritised clear public listings, understandable menus, category segmentation, role/scenario landings and reliable filtering. Initial payments are manual; automated financial activation is excluded. Existing providers, catalogue IDs, ownership, role checks, quote/inventory authority and canonical financial writers are preserved.

## Flow audit and corrections

Fresh public read-only screenshots were captured for this audit at `artifacts/ux-clarity/before/`; no production inquiry/order/message/payment was submitted. The before captures are evidence of the observed public screen, not proof of authenticated operations. After captures use actual React components with explicit synthetic data/shell boundaries and deny hosted backend transport.

| Step | Surface and observed problem | Resulting behaviour and health |
|---|---|---|
| 1 | Main menu: Experiences and Services were simultaneously marked current on `/experiences` and its details | One dedicated desktop/mobile-menu destination wins; mobile bottom-bar grouping remains unchanged. Focused menu regressions pass. |
| 2 | Experiences: hero links changed `type` in the address but the mounted page retained its initial local filter; separate horizontal chips obscured segmentation | Tours, activities and yachts are distinct entry paths. Topic cards are built only from returned category records. Type/category/search/sort are owned by the URL, including native links, refresh and Back. |
| 3 | Experiences: read failure looked like zero offers or “Not Found”; detail Back discarded catalogue conditions; cards were pointer-only; missing prices rendered a bare currency symbol | Retryable errors differ from confirmed empty/missing records. Native card links carry validated public journey context; actual detail Back restores it. Callback-only shared cards have keyboard activation. Unknown prices say “Price on request”; foreign amounts are not relabelled THB, and raw mixed-currency amounts are not ranked as one price. |
| 4 | Services: the first screen promoted isolated services and hid legal/health/family/pet categories; an empty provider layer preceded the valid category map | Main returned active categories are visible first with their real service examples and canonical IDs. Provider fallback follows the category map. Unknown/unpublished supply is not invented. |
| 5 | Buying: the actual home→buy search path did not clearly expose resale versus new projects | Both the goal entry and mounted buy search expose the existing resale/newbuild destinations. Existing district/type/THB budget rules are retained. |
| 6 | Resale: URL filters were ignored; detail Back reset filters; cards lacked native links; failures looked empty and failed photos stayed blank | Tab/district/type/budget are read from and written to the URL. Native keyboard links, complete return context, distinct retry errors and explicit failed-image states are verified. Existing THB ranges are used; no monthly/yearly or cross-currency amount comparison is invented. |
| 7 | Role/scenario landings: an arrival “checklist” opened an area guide; existing partners/companies had no direct workspace action; directory counts/grouping were stale | CTA wording matches the actual area-guide route. Existing partners and companies can open guarded `/vendor` and `/mc`. The directory derives its count from the 33 published configs and places each once under the appropriate role. |
| 8 | Legacy role copy: unsupported fees, yields, reply-time promises, review totals and old owner pricing contradicted individually agreed terms; owner persona received an investor package | Public copy describes individual terms and the actual process. Config IDs, routes, status, canonical identity and billing rules are unchanged. Only the irrelevant owner-page upsell is hidden; the global investor recommendation contract is unchanged. |

The agreed landing scope comes from `docs/architecture/UNIFIED_LANDING_ARCHITECTURE_2026_11_15.md`; historical persona audits are treated as evidence, not current implementation authority. Property-specific details are in `PROPERTY_JOURNEY_CLARITY_2026_11_16.md`.

## Verification

- Public menu/nav: dedicated regression checks for one active destination in desktop and modal menus.
- Services: 73 focused tests; 6 actual-component browser cases across EN/RU and 390/768/1440px.
- Experiences: focused URL/history/search/sort/error/native-link regression suite; reusable `scripts/qa/experiences-journey-ui.mjs` and `.py`, 6 actual-component browser cases RU/EN/TH ×390/1440. The fixture detail is an explicitly synthetic destination; actual detail error/missing/loading return is separately unit-tested with the actual header/back button.
- Property: 96 focused checks plus 148 existing rental/date/query/history regressions (overlap; do not sum). Actual buyer/resale browser matrix: 12/12 at RU/EN/TH ×375/390/430/1440, including deliberate image failure.
- Role/scenario landings and persona content: 381 focused/completeness checks; 36 actual-component browser cases with synthetic shell/read boundaries. Marketing-action assertions retain their real native destinations and the full source-browser geometry checks.
- Final complete isolated suite: **5,204/5,204 tests, 453/453 files, 0 skipped**, success true (259.73 seconds). TypeScript passes. Authored-source lint has **0 errors / 2,222 existing warnings**. Design source audit: **3,939 retained, 0 new/structural, 342 resolved**; baseline unchanged. Focused runs overlap this full suite and are not additional independent tests. Production build passes with synthetic loopback configuration; it is not a deployment artifact. UI-evidence/workflow validators and the 5 combined-layout / 16 browser-runner contract checks pass. Exact-commit CI must finish before publication.
- Browser evidence includes state/route assertions and inspected saved screenshots. It does not establish complete WCAG compliance, all live supply, external operator availability or a completed booking/payment workflow.

New experience and resale fixtures run in the existing isolated design CI. Existing hosted mutation E2E remains deliberately skipped; no live financial QA was enabled.

## Limits and release boundary

No schema, Edge, recipient binding, provider publication, dependency or payment changes are included. In particular, draft #208 and its financial cutover are not activated. Existing manual business handling remains separate from public UI acceptance. Real administrator/delegate sessions, actual inquiry delivery, supplier confirmation, real bookings and payment reconciliation are not tested by synthetic UI receipts.

Custom arbitrary budget ranges, automatic currency/period conversion and the entire Airbnb feature set are not claimed. Existing supported price bands, rental/date/guest filters and canonical offer authority are preserved. No new availability or price fact is inferred from a navigation link.

Before publication: require the complete isolated suite, TypeScript/build/lint, design source/register checks, and connected/design GitHub gates for the exact source. Rollback of this UI-only release is the base main frontend; no data reversal is required. Record the publication receipt separately after the host actually serves the new build.
