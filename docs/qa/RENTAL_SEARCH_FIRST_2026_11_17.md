# Rental search first-visit UX — 2026-11-17

Scope: make category search criteria immediately usable; keep selected rent/buy intent clear.

- Criteria open on entry. Submission still closes them and focuses results.
- Area precedes rental dates; guests are inline before the submit button, with no duplicate guest editor.
- Explicit rent/buy result cards expose the corresponding offer action. Unfiltered catalogues and detail pages retain all valid offers.
- Existing URL criteria, dates, filters, history, availability and canonical data remain unchanged.
- No production writes, bookings, migrations, auth changes or price changes.
- Exact-address/map privacy issue deliberately untouched; requires a separate privacy-safe review of data exposure.

## Verification

- 84 search-route and HomeDiscoverySearch tests passed.
- 7 PropertyJourney tests passed, including focused CTA and mixed-offer regression coverage.
- Scoped ESLint: 0 errors; 6 existing warnings.
- Design-system audit: 0 new/structural findings.
- git diff --check passed.
- Browser visual acceptance at 375/390/430 and desktop, RU/EN: NOT VERIFIED here. Required before release.
- Full typecheck result recorded in PR/checks, not inferred from targeted tests.
