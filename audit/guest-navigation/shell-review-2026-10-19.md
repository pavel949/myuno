# Public guest navigation shell review — 2026-10-19

Baseline: `20d3cb395`. Scope: shared public header/mobile menu and bottom navigation. No permission, auth guard, database or deployment changes.

## Live evidence

Read-only Firecrawl fetches with `maxAge: 0`, `mobile: true`, 390×844 viewport, full-page screenshot, 3-second wait:

- https://www.myuno.app/ — HTTP 200, version metadata 3.55.5; scrape `01a154c9-3bf5-7656-a462-a91498d350f3`.
- https://www.myuno.app/for-business — HTTP 200, version metadata 3.55.5; scrape `01a154ca-9221-7463-bd6b-902a91f60307`.

Both screenshots visually inspected. Header fits the captured mobile viewport. Homepage has its own footer; business page renders the consumer bottom navigation. No horizontal shell overflow apparent in these captures. Initial homepage cookie notice covers part of the search form; dismissal interaction was not tested. Business header's extracted Sign in URL is `/auth`, losing the originating page. These are pre-change deployed screenshots, not verification of this local patch.

## Changes

- ConsumerHeader reuses canonical `buildAuthPath` with router pathname, search and hash for both desktop and mobile sign-in. Auth code and permissions remain untouched.
- Mobile menu reuses header active-route aliases, applies a subtle existing-token background/weight, and exposes `aria-current`.
- BottomBar uses Link plus canonical active-state `aria-current`, so property/service sibling routes announced to assistive technology match the existing visual highlight. Destinations and role resolution are unchanged.

## Verification

107 tests pass across ConsumerHeader (4), BottomBar (8), navigationModel (77), postAuthDestination (18). Header tests cover RU/EN/TH, Escape, return path with filters/anchor, and mobile active alias. Bottom tests cover seven destinations and an unrelated business page. Changed-file ESLint and `git diff --check` pass. No full build, browser interaction, production writes, remote push or deploy performed. Local post-change visual validation remains unavailable under current browser restrictions.

## Remaining observations (not changed)

- Live metadata contains duplicated Russian baseline and English page OG/title/description values; rendered English copy itself is coherent.
- Source-only: CompactFooter lifecycle links currently use RU/EN fallback despite a Thai UI option. This footer is not rendered on the two captured pages. Broader registry/copy work should retain existing canonical surface destinations.

## Follow-up: overlapping public controls

Fresh https://www.myuno.app/services capture with 8-second wait, desktop 1440×1000, `maxAge: 0`, scrape `01a154cf-32d4-72f5-bf35-1b20a4a04f70` reproduced the title/search covering category buttons. Returned HTML has route opacity 1/transform none and matches the baseline single sticky FeatureLayout wrapper. Therefore this is not established source drift or a transient entrance animation. Exact browser scroll-container mechanics remain unverified.

- FeatureLayout catalog title/search/filter group now stays in normal document flow; only the shared global navigation is sticky. This removes the second overlapping sticky layer without guessing offsets. Local structure tests cover this; post-change rendering is still required.
- Cookie banner now stacks above mobile navigation, keeps device-safe bottom spacing, and scrolls within the available viewport when preferences expand. A DOM marker hides the global chat launcher via CSS only while the banner is present. Consent persistence/defaults/dismissal semantics are unchanged. Component test verifies the existing rejection values and controls.
- CompactFooter lifecycle title/links now use explicit Thai translations from the existing canonical surface registry.

Combined focused suite: 113 tests across 7 files passed. Some contracts inspect source/CSS and are not substitutes for browser geometry checks. No full build or deployment performed.
