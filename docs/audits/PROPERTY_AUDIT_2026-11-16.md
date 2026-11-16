# Public property audit — 16 November 2026

Candidate base: `0d7bf6357ed160753db67d90b2f9ba3e36d14854`. Scope: anonymous property discovery, public listing/detail/return routes, recovery states, catalogue filtering, and installed-app artwork. This is a public UX/code audit, not certification of private operations or commercial settlement.

## Journey findings and changes

1. **Choose rent or buy — corrected.** The buy entrance previously reported a generic zero despite separate resale and newbuild catalogues. It now labels direct sale listings explicitly and explains the separate catalogues. Mobile newbuild CTA buttons wrap and fit their containers.
2. **Search rentals — regression verification.** Existing civil-date, guest, district, home-type and URL state remain canonical. No booking or inventory writer changed.
3. **Explore resale — regression verification.** Existing catalogue/detail and contextual return paths remain in place. No separate inventory introduced.
4. **Explore newbuilds — corrected.** Project/detail/developer returns preserve the full filtered URL. Unsupported completion, ownership, beach and private analytical facets are no longer offered against deliberately withheld public data; legacy URLs show a reset notice. Unknown prices sort last. Public search sharing copies the full URL instead of creating notification jobs with incomplete matching criteria. Legacy saved-search navigation restores all known fields and explicitly flags unsupported ones.
5. **Explore commercial property and land — corrected.** Commercial sale price bounds now affect the public query and only compare recorded positive THB sale prices. Rental price filtering is withheld until comparable recorded periods exist. Cards/details use existing recorded-price selectors and never borrow sale prices as rent or infer currencies/periods. Category chips no longer compress text. Filter drafts refresh on reopening. Invalid or unsupported URLs show recovery rather than silently broadening results.
6. **Explore hotels — corrected.** Active navigation recognises hotels. Management mode is an explicit request entrance, not a false empty sale catalogue. Private occupancy/operator-management filters are withheld. Room/license controls have accessible names and integer/range validation.
7. **Open details and companies — corrected.** Residential IDs cannot render as land/commercial/hotel listings. Read failures have retry states distinct from confirmed missing records. Company portfolios wait for the resolved company ID rather than briefly querying the whole market. Public catalogue persona prompts no longer obstruct discovery; authentication and authorisation guards are unchanged.
8. **Map and app identity — checked/updated.** The production map rendered markers without page errors or horizontal overflow in the inspected anonymous desktop rental case. A fresh navy/ivory U-and-sun icon is exported for browser, Apple touch and PWA launchers. Versioned icon URLs refresh artwork while retaining `/myuno-pwa-2025` as the installed-app identity.

## Evidence and reproducibility

Fresh local artifacts are in `artifacts/property-audit-20261116/` (ignored by Git):

- `before/`, `before-extra/`: production RU mobile/EN desktop route captures. Guessed `/property/areas` and the heading-less guide probe are excluded from accepted visual evidence.
- `before-flows/results.json`: four reproduced failures, including filtered project return, clipped mobile CTA/category text and residential ID accepted as land.
- `after-flows/results.json`: the same four checks pass against the candidate with actual anonymous catalogue reads.
- `before-map/results.json`: production map render evidence; write requests were blocked. Google viewport metadata POST was also blocked, so this does not certify every map interaction.
- `after/`, `after-rental/`, `after-listings/`, `after-area/`: candidate routes, date/guest criteria, native detail returns and area/detail return evidence. The first listing probe was obscured by a PWA update banner; the accepted rerun dismisses the banner. The first area probe expected a link where the UI correctly uses a button; the corrected probe passed.

New regression tests cover recorded currencies/rental periods, price-bound query construction, URL validation, unknown-price ordering, public read recovery, asset-class rejection, return state, filter drafts, search-link fallback and app icon dimensions/identity. Local verification: 4,777 non-PostgreSQL tests passed. The initial full run could not discover PostgreSQL and therefore failed 10 suites and skipped 3; after adding the existing embedded PostgreSQL binaries to PATH, all 13 disposable-database suites passed (504 tests), alongside a 17-test property regression rerun. Combined unique coverage: 5,281 tests. TypeScript and production build passed; lint reported 0 errors (warnings remain). Design audit reported 0 new/structural findings; icon export test passed. Fresh candidate browser checks: 20 route/language combinations without page errors or horizontal overflow, four corrected bug reproductions, three listing/detail returns, three rental date/guest cases and one area/detail return. Final hosted CI and publication status belong in the PR/release receipt.

React review: existing QueryClient/canonical readers reused; conditional company query avoids an unnecessary whole-market request; no new dependencies, context, workflow engine, authentication or data authority introduced. Buttons/filters retain native semantics and explicit labels. This is not a full WCAG certification.

## Boundaries and remaining verification

- No migrations, financial changes, Edge deployments, auth/RLS changes, recipient mappings or real inquiries/bookings/payments are part of this change.
- Public newbuild analytical/construction data hold remains intact. Do not infer unavailable facts to restore those facets.
- Existing saved-search backend notification matching is **not certified**: its worker and existing subscriptions require a separately governed contract review. This change removes the unreliable public creation promise and provides full-criteria URL sharing; it does not deploy a worker fix.
- Commercial/land/hotel public supply may genuinely be empty. Synthetic fixtures exercise positive/error branches without inventing production listings.
- Actual inquiry delivery, authenticated owner/staff operations, backup restoration and settlement remain outside anonymous read-only acceptance.
- No finite audit proves the absence of all bugs. Findings above are evidence-backed fixes and bounded verification.

## Icon source

`design/brand/myuno-app-icon-master.png` is the generated artwork. `scripts/generate-app-icons.mjs` performs only technical ImageMagick exports. `scripts/app-icons.test.mjs` checks opaque PNG sizes, versioned manifest references and stable PWA identity. Existing textual/brand SVG logos are retained.
