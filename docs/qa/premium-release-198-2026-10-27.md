# PR 198 release verification

The approved release combines the five groups documented in `premium-integration-2026-10-27.md`. That document records the original local checkpoint; its no-publication statement is historical. Admin checkpoint `cedbd235` remains separate and excluded.

## First exact-head CI and correction

For `c2824059`, verify, design-system, semantic and cleanup workflows passed. The connected-system workflow failed its final enforcement: the 105-case combined-layout stage had 75 passing and 30 failing rows. Intermediate `continue-on-error` step conclusions were insufficient evidence of success; the final enforcement correctly blocked release.

The 15 developer rows expected the old marketing header and four buttons. The migrated shared audience page uses the measured consumer header and seven canonical semantic links. The 15 owner rows expected two hash CTAs; the approved composition has one primary `#paths` action and a secondary `/my-property` link. Updated assertions retain all 105 cases, measured header bounds, 44px targets, overlap checks, destination navigation and strict anchor geometry. Owner coverage now exercises pointer and Enter activation, same-document/query retention, target focus and both downstream paths. No gate, matrix dimension, timeout or baseline is relaxed.

The owner primary now uses a native fragment anchor instead of a router document reload. Its target is focusable outside the Tab order; URL/history, query retention and modified clicks stay browser-owned. The global reduced-motion rule now disables root smooth scrolling, which previously continued despite reduced-motion animation/transition rules. This removes competing smooth focus/anchor scrolls without introducing a navigation handler. Independent review covers both the runtime repair and the test delta.

## Corrected local evidence

The final native-anchor/reduced-motion candidate passed all **105 unique cases**, with at most two active browser contexts, using the unchanged matrix helper and installed Chromium. All 15 audience/owner/marketing tests and three pure matrix-contract tests passed. This does not substitute for new exact-head CI; earlier experimental anchor-handler runs failed and were discarded.

## Acceptance boundaries

All browser fixtures remain isolated/synthetic. No real login, application, booking, payment or production-data mutation is exercised. Canonical route and business contracts remain unchanged. Original image comparison, selected hero delivery, live authenticated workflows and Google Maps billing remain outside this release's verified scope. Exact final-head CI and publication evidence are recorded in the release report, not inferred from an earlier head's successful jobs.
