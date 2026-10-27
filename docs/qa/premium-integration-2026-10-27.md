# Local premium integration — 27 October 2026

Integration branch: `codex/premium-local-integration-20261027`. Remote main was fetched and remained `046663d895ccdc4beedacaa436e6e7044938895b`; no intervening changes were omitted. No push, PR, merge or deployment was attempted. The prior property PR denial is not retried.

## Composition and preserved checkpoints

| Group | Preserved source SHA | Integration cherry-pick |
|---|---|---|
| Property | `37dd479e7dadd485e9c91ee0b75a3b0e4cf38b58` | `5115157bd` |
| Services | `2ccaa8a25308e4e8d84bf119d7aa359b8b09ae0b` | `ce25ddf07` |
| Audience | `93c87c5c1f6676e97a1b390e32c75efb6eb52867` | `49bb90e40` |
| Workspace | `2e3663d5c66e9eda948b7e8b148115037b05fc4b` | `6bcd13b2e` |
| Account/system | `e9f12c5bc4030cf8bcf3fc7f362c384da9c84780` | `7a3e427ff` |

The source branches remain unchanged. There were no textual conflicts. Independent combined review checked scoped stylesheet selectors, shared public card/frame rules, currency/THB-only cart behavior, request routes and operational state. No new token values, taxonomy, auth/RBAC/session/provider contract, SQL/RLS, billing, credential, commercial payload or writer change was introduced by integration. Generated MCP/version build artifacts are excluded from the final commit.

The combined source touches **22 page TSX files, 10 shared TSX files, 2 TS hook/presentation files and 6 stylesheets**. Tests and dated QA documentation are additional files. File counts are not counts of fully accepted routes.

## Route-level scope and limitations

21 named route templates/entries are targeted across the five groups, with boundaries below. This is not all 433 canonical entries or all 712 source declarations.

| Group | Concrete entry surfaces | Acceptance boundary |
|---|---|---|
| Property (6) | `/property/search`, `/property/offplan`, `/property/offplan/:id`, `/property/:id`, `/property/complex/:id`, `/area/:slug` | Existing public journey plus catalog/detail/frame/card refinements. No real inventory or booking acceptance; maps provider not accepted. |
| Services (3) | `/services`, concrete `/discover/services` goal, `/services/provider/:id` | Existing canonical category/situation mapping and provider/request UI. The dynamic `/discover/:goal` family is only partially covered by the services goal. Dedicated transport/beauty/pets/legal wizards remain separate. |
| Audience (5) | `/for-owners`, `/for-developers`, `/for/agent`, `/partners`, `/for-business` | Four public introductions; business primary UI/request state only. Actual applications and protected role workflows not submitted. |
| Workspace (4) | `/mc/today`, `/mc/tasks`, `/mc/bookings-list`, `/mc/calendar` | Actual page components and shell in isolated role/data harnesses. Nested booking/editor boundaries mocked. No authenticated live PMS acceptance. |
| Account (3) | `/auth`, `/auth/forgot-password`, `/auth/reset-password` | Isolated hooks; DOM/navigation/initialization states, not real login/OAuth/reset/account operations. |

Shared `NotFound`, `AccessDenied`, `ErrorBoundary` styling does not certify every wildcard, guard or crash context. `/me/profile`, `/profile`, `/profile/settings`, `/start` are partial shell adoption; nested editors/onboarding steps remain unaccepted. Auth callback aliases retain the same Auth shell but OAuth/session completion is untested. Account-type/setup-password/consent/profile-edit/personal-details/notifications/referral remain untouched.

Other untouched groups include most admin/finance/operational routes, root MC dashboard and operations directory, dedicated service verticals, remaining audience homes and authenticated owner/developer/partner workspaces. The exhaustive source-level table is `premium-route-coverage-2026-10-27.md`; aliases and layout declarations are not independent screens, and shared CSS is not visual acceptance.

Thai: primary migrated labels were exercised; role metadata, some secondary recovery feedback, onboarding, nested profile/security editors and nested task/calendar dictionaries retain existing English fallback. Database titles may fall back to the existing English name. No new translated business identity or taxonomy is invented.

## Joint verification

Results below refer to the integrated source, not inherited standalone branch results. Final statuses are recorded after running checks.

- Full Vitest: **PASS, 4682 tests / 384 files, no skips**, 312.08s; `/tmp/myuno-integration-tests-final.log`. Seven isolated PostgreSQL suites also passed independently (258 tests). PostgreSQL 17.11 was extracted under `/tmp` and supplied through PATH; no system DB service or shared backend was used.
- Typecheck: **PASS**, including final test adjustments; `/tmp/myuno-integration-typecheck-final.log`.
- Full lint: PASS, 0 errors / 2456 warnings, `/tmp/myuno-integration-lint-final.log`.
- Build: PASS, 7120 modules / 5m12s, `/tmp/myuno-integration-build.log`.
- Design audit: 4073 findings / 0 new or structural / 208 resolved baseline entries. Baseline and checks unchanged.
- Browser: **PASS, 9 result files / 121 recorded matrix rows**, plus explicit state/close/retry assertions. No runtime exceptions in recorded suites. Property: 31 rows (six widths plus RU/TH at 390/1440). Services: 10 render rows (provider at six widths; catalogue at 390/1440), loading/error/empty and request reopen/close. Audience: 10 renders at 390/1440 and 8 named guest/anchor/reduced-motion scenarios. Workspace: 10 representative render rows at 390/1440 with all integrated styles resident, calendar error/retry and checkbox/modal checks. Account: 53 rows, six widths and RU/TH primary UI. Offer/search/inquiry journey: 5 widths. Cross-group SPA journey: 1440/390. These counts are neither unique routes nor live business acceptance.
- Source review: combined production diff and three test adjustments reviewed independently; no blockers. Final exact-head confirmation is reported with the commit SHA.

The initial full run is retained at `/tmp/myuno-integration-tests.log`: seven suites could not collect without PostgreSQL, a pricing-editor test timed out during concurrent build load, and six assertions expected obsolete UI structure/Thai labels. The pricing test passed unchanged independently and in the final full run. Only three UI test files were adapted, preserving canonical links, full accessible labels, wrapping/44px targets, single-gutter ownership and display-font bounds; no production code, timeout, exclusion, skip or baseline was changed to obtain PASS. Initial environment failure is not reported as successful acceptance.

The production build predates only test/documentation corrections. `git diff 7a3e427ff -- src` contains exactly those three test files; the runtime graph remains the jointly built source (7120 modules). No runtime repair was necessary after integration.

## Reusable evidence and safe test boundaries

`/workspace/myuno-ui-evidence/integration-20261027/` holds copies of browser scripts, 83 dated screenshots and 9 JSON result files; `browser-index.json` indexes the suites. `scripts/run-local-checks.sh` records sequential test execution with local PostgreSQL. Protected bundles are rebuilt from current source; all four opt-in stylesheets are appended together to exercise resident-style interactions. Public browser scripts run the actual Vite app with synthetic read responses and blocked writers. Read-only search/busy-slot RPCs are stubbed; no live account, reset email, booking, application, payment or production-data change is performed.

Cross-group browser navigation checks the same SPA document through home → owners → guest auth → Back → home → services → Back/Forward/reload. Property scenarios retain offer intent, filters and repeated/cancelled inquiry/filter dialogs. Service and workspace scenarios cover loading/empty/error boundaries and modal close/reopen. These are local synthetic checks, not live production acceptance.

Localhost and evidence paths are not user-accessible external previews. Library transfer remains blocked from earlier work and was not retried. The new selected hero asset is not installed. Original-reference image fidelity and Google Maps billing availability remain outside this local acceptance. Future release requires specific approval and exact-head gates.
