# Public guest UX fixes — 19 October 2026

Base: main `20d3cb3954202710ec4db62ca54e9db88ccba4cb`, reverified through GitHub during integration. This tranche integrates public search, listing, navigation, consent, unavailable-market and support-copy fixes. It excludes the separate employee/complex release and all DB, permission and payment changes. The asset-cache response guard and bundle-independent recovery are included; deployment/publishing itself is outside this PR.

## Behavior

- Search emits civil-date URLs, retains legacy bookmark hydration, leaves unspecified guest count unfiltered, and accepts only whole guest counts. Rental-only entry starts in rent mode.
- Developer detail read failures show localized retry rather than claiming the profile does not exist; offplan badges only link embedded matching active developer profiles.
- The sale-price helper rejects legacy generic-price fallback when an explicit rental mode contradicts the sale type. Verified contradictory public rows retain unknown sale prices rather than presenting nightly rent as a purchase amount.
- Listing amounts retain their actual billing period. Missing prices remain unknown; sale prices use the canonical helper; computed stay amounts are explicitly estimates.
- Property maps show localized recovery text and the existing external address/coordinate link when load/provider-rendered errors occur. This does not repair or certify provider configuration.
- Sign-in carries the current route, query and fragment through the canonical sanitized auth path. Mobile active destinations now have matching accessibility state.
- Consent sits above navigation with short-screen scrolling; its presence hides the global chat launcher. Catalog controls use normal flow to avoid double sticky-header collisions. Footer lifecycle labels include Thai.
- The already disabled market now gates page mounting rather than overlaying live commerce DOM/hooks. Its unavailable message and alternatives are truthful. No market activation occurs.
- Bundle-independent recovery handles missing module entry/slow bootstrap with one bounded retry and an accessible manual action. The Workbox asset cache rejects HTML shell responses for asset requests. No caches, credentials or drafts are deleted.
- Support copy distinguishes requests from confirmed bookings and removes unsupported response-time, refund, verification and final-price promises. Contact actions and legal terms are unchanged.

## Integration verification

- Before the boot addition, 221 tests passed across 15 focused suites: changed public components, route/search integration, property intent, canonical navigation and post-auth destinations.
- Search/date suites also passed in Asia/Bangkok and America/Los_Angeles (26 tests each). Boot recovery (19), existing startup (2) and PWA integration (35) passed after the addition.
- Changed TypeScript/TSX ESLint: zero errors, 19 warnings in existing code.
- Updated two existing network-denying Playwright fixtures to assert exact civil-date output instead of UTC-midnight instants; added an absent-guests assertion. Legacy ISO input hydration, all original interactions, network isolation and geometry assertions remain.
- Late developer/error-state and sale-price regressions: 44 tests across four suites passed (17 additional distinct cases, 294 distinct tests across 20 suites overall).
- Both edited Python fixtures compile; `git diff --check` passes.
- Full typecheck, all tests, production build and browser execution are deferred to unchanged GitHub CI gates due local execution limits. Focused unit results are not post-deployment/browser verification.

## Release checks still required

CI must finish on this exact tree, followed by fresh production mobile/desktop screenshots and interactions. Separately observed stale HTML requesting a removed JS bundle and receiving HTML fallback remains an open deployment/cache investigation; the new recovery and cache admission guard prevent recurrence paths but cannot retrofit recovery into already cached old HTML. Fresh release verification remains necessary. No production writes were used for QA.
