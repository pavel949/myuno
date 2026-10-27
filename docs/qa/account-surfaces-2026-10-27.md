# Account and system surfaces — local checkpoint, 27 October 2026

Branch: `codex/premium-account-surfaces-20261027`, based on main `046663d895ccdc4beedacaa436e6e7044938895b`. No predecessor branch is merged into this tranche. No push, PR, merge or deployment is authorized for this group.

## Actual scope

- `/auth`: opt-in warm surface, canonical serif heading scale, keyboard focus, 44px controls. Mobile places the existing form before the value panel; desktop retains two columns. Login/signup state, OAuth redirect, providers, session handling, payloads and writers are unchanged.
- `/auth/forgot-password`, `/auth/reset-password`: same compact form surface and single semantic navigation links. Recovery email now has an associated label, invalid state and error description. Existing password validation, session initialization, request payloads, reset/logout confirmation and canonical destinations remain unchanged. Primary Thai labels added; some existing secondary recovery feedback still falls back to English.
- Wildcard `NotFound`, shared `AccessDenied`, shared `ErrorBoundary`: opt-in readable system typography, wrapping, focus and targets. 404 has Thai primary text; AccessDenied Thai heading/description. Required/current role labels and existing access actions are unchanged; Thai role labels still use existing English fallback.
- `/me/profile`: local wrapper, Thai title/sign-out label and target spacing only. Nested profile/menu/download primitives were mocked in browser acceptance, not accepted as a complete private account surface.
- `/profile`, `/profile/settings`: reading-width shell only. Nested editors, security settings, linked accounts, form submission, loading and profile-data states are not visually accepted in this tranche.
- `/start`: heading/surface shell only. Canonical decisions, feature flag and onboarding steps remain unchanged. `/onboarding/*` redirects remain unchanged; steps and Thai onboarding content still require their own acceptance.
- Callback aliases share Auth markup, but no OAuth/session completion is claimed. Account type, setup-password, OAuth consent, profile edit/personal-details/notifications/referral and other account routes remain untouched.

AuthValuePanel no longer invents a floor of 50 services or displays unsupported family counts, 24/7 support or tenure claims. The count uses the existing eligible-catalogue helper and is omitted when empty; no new taxonomy, query or model was added.

## Verification and evidence boundaries

- Focused tests cover recovery initialization failure/expiry/valid state, password success versus refused logout, MeProfile logout refusal, post-auth destinations, RoleGuard verification, error recovery, labelled invalid email and catalogue counts. All backend/auth functions in new tests are mocks. No real login, reset email, sign-out, account edit or application was performed.
- Browser harness bundles actual Auth, ForgotPassword, ResetPassword, NotFound, AccessDenied and MeProfile components with isolated auth/data hooks. Google OAuth, preferences, AppLayout/MeShell and nested account primitives are explicit boundaries. The metafile assertion excludes the real Supabase client; external requests are aborted.
- 53 browser checks: six surfaces at 320/390/430/768/1440/1920 EN; all six at 390 RU/TH; recovery checking/unavailable/valid states; keyboard traversal, recovery cancel and Back, password visibility/reload, reduced motion. Browser output contains no runtime exceptions or horizontal overflow. This is not live authorized-flow acceptance.
- Real screenshots (12 representative desktop/mobile captures) and JSON results are preserved at `/workspace/myuno-ui-evidence/account-surfaces-20261027`. Consumer inspected pixels directly. Local evidence paths are not publicly reachable preview URLs; Library delivery remains blocked from earlier tranches and was not retried.
- Harness source lives outside production: `/tmp/myuno-account-harness.mjs`, `/tmp/myuno-account-browser.mjs`. Production import graph has no QA fixture entry.
- Full source route coverage is recorded in `premium-route-coverage-2026-10-27.md`; shared styles do not certify every route.

## Integration boundaries

Preserve property `37dd479`, services `2ccaa8a`, audience `93c87c5` and workspace `2e3663d`. They are separate checkpoints, not a jointly validated release. This tranche shares existing design tokens but introduces only `premium-account.css` and opt-in classes, not changes to token values or auth/security contracts. Later local integration must repeat compatibility, route and exact-head checks; no release is implied.

## Exact local checks

- Focused Vitest: **58 tests / 7 files passed** (`/tmp/myuno-account-tests-exact.log`).
- Typecheck: **passed** (`/tmp/myuno-account-typecheck-exact.log`).
- Full ESLint: **0 errors, 2459 warnings** (`/tmp/myuno-account-lint-exact.log`); existing repository warnings retained.
- Build: **7117 modules, passed in 2m17s** (`/tmp/myuno-account-build-exact.log`). Initial prebuild correctly rejected local geometry/type literals; implementation now uses existing canonical tokens, without changing checks/baselines.
- Design audit: **4125 findings, 0 new/structural, 156 resolved baseline entries**.
- Independent source review: no remaining blocker; isolated browser/build evidence remains separately scoped.
