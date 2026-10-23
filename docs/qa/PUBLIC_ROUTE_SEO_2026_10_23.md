# Public route metadata repair — 23 October 2026

Base: `fdb7cffeb` in `pavel949/myuno`. No backend, auth, catalogue data, workflow thresholds, robots exclusion or hosting changes.

## Reproduced and repaired

The static document's canonical always pointed to the homepage. The actual `/discover` registry component is `ServicesIndex`; `/property` is `PropertyLanding` (already has SEOHead), `/property/search` is `PropertySearchPage`, `/newbuilds` is `NewbuildsLanding`, and `/legal` is `LegalServicesIndex`. Discover, search, newbuilds and legal components lacked page metadata; the existing property hub metadata was duplicated by the static homepage fallback. They now render descriptive metadata through the existing SEOHead. Embedded ServicesIndex does not override its containing page's metadata.

React 19 / Helmet 3 natively hoists metadata but does not remove static index tags. Four regression cases initially failed with duplicate homepage canonical/description. The static fallbacks are now explicitly marked; SEOHead removes only those marked tags once page metadata mounts. Tests import the actual static document and require one canonical and one description, without query/hash or noindex.

The property map is loaded through React.lazy only when the existing map mode is selected, with a localized Suspense status. Filters, query/data contracts and map callbacks are preserved.

## Verification and limits

- Existing ServicesIndex suites: 20 tests passed.
- SEOHead and actual React/Helmet compatibility: seven tests passed. The final four-case metadata regression also passed using the actual index shell.
- Scoped ESLint: zero errors, seven existing warnings (SEOHead mixed exports and newbuilds memo dependency).
- Browser fixtures use synthetic catalogues and deny external requests. System Chromium `/usr/bin/chromium` is used in scratch copies of the existing Python runners because the downloaded Playwright executable is absent; repository runners are unchanged.
- Original property-browse fixture targets PropertyIndex, so its passing cases are adjacent regression evidence, not direct coverage of changed PropertySearchPage. The unified-property-search fixture covers the changed actual page.
- Lighthouse 39923626510 identified link-text, accessible-name and distinguishable-link failures, but its log does not expose failing nodes. Report storage/public-site requests are blocked by the environment CONNECT proxy. No link/name fix is guessed from audit names. Those nodes and post-fix Lighthouse scores remain unverified; no live version or production acceptance is claimed.

## Completed Chromium evidence

- Actual PropertySearchPage: eight RU/EN × 375/390/430/1280 groups passed, covering URL hydration, in-place editing/history, date exclusions/reset, filters, legacy redirects, rent/buy, map toggling and containment. No runtime errors or external requests. RU390 and EN1280 screenshots were visually inspected.
- Actual SEOHead + actual static index fallbacks: eight route/width cases (`/discover`, `/property`, `/newbuilds`, `/legal` × 390/1440) passed in installed Chromium. Each has one canonical and one description after rendering, and query/hash are omitted. This small metadata fixture is not a complete rendering of all four route components.
- Adjacent PropertyIndex: eight RU/EN × 375/390/430/1280 browser groups also passed.
- Preserved screenshots/results: `/workspace/artifacts/public-seo-20261023/`. Detailed local logs: `/tmp/public-seo-head-final.log`, `/tmp/public-seo-tests.log`, `/tmp/public-seo-search-browser-system.log`, `/tmp/public-seo-head-browser.log`, `/tmp/public-seo-lint.log`.
- Scratch browser entrypoints: `/tmp/public-seo-search-browser.py`, `/tmp/public-seo-head-browser-build.mjs`, `/tmp/public-seo-head-browser.py`; no browser-runner or workflow changes.

Full `npm run typecheck` completed successfully (exit 0), using `/workspace/myuno-ready-dependencies/node_modules` matching current main's dependency set. Build and new Lighthouse scores remain integration checks; this tranche did not change thresholds or suppress audits.
