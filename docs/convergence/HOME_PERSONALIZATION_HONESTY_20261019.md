# Home preferences and account-data honesty

## Evidence and bounded scope

Source audited at `f868e276a01406b6b50be1e4c8cec9855fffa7fc` against the supplied mobile screenshot. The screenshot's vet appointment, school term and dinner were `SIGNAL_SEED` examples, shown by Home V2 when account queries were pending, empty or failed. The legacy Home's any-live gate could also expose unrelated seed cards. `HOME_FEED_SEED` fabricated the V2 activity rows. Demo badges did not make these appropriate account records.

The bottom sheet was opened only by explicit controls. It presented lifestyle interests and audience contexts as access roles. Its reorder controls called a function that deleted/reinserted membership records, while every read and optimistic update then restored a fixed sort order. Notifications/settings links targeted query tabs on `/account`, which redirects to `/me` and discards those tabs.

## Changes

- Both Home variants use real-only signal results with separate loading, empty and partial-error states and a retry action. Source resolvers remain read-only. Seed records and unused seed blend exports are removed.
- The V2 activity section links to the existing `/me` activity surface rather than inventing a second activity stream.
- Real event timestamps are formatted in Asia/Bangkok; civil dates stay civil dates; new home controls, states and date labels support RU/EN/TH. Owner records use the canonical inventory-release predicate and half-open dates, displaying booking dates and source status without claiming physical occupancy. Investor cards count deals without summing unlike currencies. The unverified provider-org/auth-user aggregate is removed, with an explicit unavailable summary and existing workspace link.
- “Customize home” is an explicit action in the hero and menu. Context and lifestyle selections are explained as home preferences, separate from permissions. Mobile controls use existing tokens and 44px targets, with fixed sheet header/footer and wrapping labels.
- `user_personas` remains authoritative for selected memberships. Display order is an account-scoped local preference on this device; it never grants membership and does not promise cross-device sync. Reordering no longer mutates DB rows. Guest order remains in the existing guest preference key; blocked storage leaves the session usable and reports persistence failure.
- All preference mutations bind their initiating actor through preflight, optimistic state, rollback and late completion. Account switching cannot apply one account’s selection or saved order to another. Failed optimistic changes restore display priority as well as membership.
- Guest migration waits for the account read and uses additive upsert through the existing `user_personas` path rather than delete/reinsert. Existing accounts are not overwritten while loading.
- The hero does not present the default tourist recommendation fallback as an explicitly chosen preference.
- Notifications, profile and settings controls point to their existing canonical routes.

No schema, RLS, role grants, production data, payment/inventory writers or backend permission logic changed.

## Verification

42 focused tests across home component states, sheet interaction/localization, role-signal reads/time formatting, preference ordering and login/account isolation passed. Date/source tests also pass under America/Los_Angeles. An independent source review found no remaining blocker in this bounded change. Targeted ESLint and whitespace validation passed. Synthetic source/mock tests do not establish live data completeness.

Full build/typecheck and browser execution were intentionally not run locally. Connected CI should verify final TypeScript integration and visual containment at 375/390/430px and desktop, including RU/EN/TH, long names, open sheet, partial failure and close/reopen.

## Known boundary

This change retains the canonical `/me` feed and bounded per-persona reads, with the unverified provider summary deliberately unavailable. It does not claim those resolvers cover all services or supply a complete operational dashboard. Failed reads are visible rather than replaced by examples. Display priority is device-local; cross-device ordering needs a separately reviewed persistent preference contract.


## Isolated browser fixture

`scripts/qa/home-preferences-ui.mjs` bundles the real HeroGreeting, HomeTopBar, SignalStack, HomeActivityFeed and RoleSheet with synthetic account/read hooks and the production stylesheet plus any component-imported CSS. Its Python runner intercepts all requests, serves only its three local fixture assets, and fails on external requests or runtime errors. It checks EN/RU/TH at 375/390/430/1280px, explicit open, keyboard reordering, add/remove, close/reopen, fixed footer, 44px preference controls, account links, loading/empty/partial-error/unavailable states, disabled mutations and horizontal containment. Screenshots and JSON results are uploaded by the existing connected-system check.

Only fixture bundle compilation, Python/Node syntax, focused tests and lint were performed locally; no local browser or full app build was run. New strings, preference failure feedback and displayed signal dates have Thai translations. Existing business/workspace metadata and raw source status codes are not claimed to be fully localized. Missing visa/project statuses and missing unit sales stay explicitly unknown rather than becoming active/zero.
