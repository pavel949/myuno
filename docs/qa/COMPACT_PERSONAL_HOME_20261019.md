# Compact personal home — 19 October 2026

## Scope and source contract

Initial base: `dec344de5`, in the isolated `fix/compact-personal-home-20261019` branch. Main updates were merged without conflicts at `36fee777b` (local merge `d3cebfd9b`) and, after PR124 merged, `cb3e02c7f` (local merge `3ce63725e`). No unmerged feature branch was applied. This remains a separate home change; the employee release now arrives only through normal main ancestry. No new backend migration, permission change, deployment, or production data write is part of the home diff.

Both authenticated home variants now use a compact identity header, explicit personal/work navigation, one search entry, four stable personal shortcuts, account reminders, and topic-scoped updates. Interests and recommendations follow those actions; weather is lower. The guest router and consumer-shell contract are unchanged. The `home_v2` admin/feature-flag gate remains unchanged.

The work entry reads existing `useUserContext`/`useOwnerType` results and opens existing workspaces. A per-account local preference remembers only the last explicitly selected destination. Each render checks that the remembered destination still exists in the available links. It does not grant a role, change active context, automatically redirect `/`, or supply operational scope. Generic team/staff roles point to their existing `/team` or `/staff` workspace; they do not imply `/mc` authority.

## Truthful account summaries

- The bell reads the existing `useNotificationActions` source, not pending commercial orders. It remounts per auth identity, and opening it performs navigation only. The canonical source reads the latest 50 notifications and exposes no read-error flag; neutral bell copy must not be interpreted as an all-clear assertion.
- The pending-order reminder keeps the existing status set (`pending`, `awaiting_client_payment`, `pending_deposit`), excludes deleted rows, and is bound to the authenticated customer. It displays a count of pending orders, not a payment-due assertion. It no longer adds amounts in potentially different currencies and prefixes the result with THB. Loading and failed reads remain distinct from a successful zero count.
- Topic updates are explicitly scoped to selected interests. No result does not mean the entire account has no stays, service requests, or work. The hook still does not aggregate `service_orders`.
- Pet updates read only `pet_service` commercial orders, not human `medical` orders. Known commercial-order records link to the existing order-tracking route. Other source resolvers and their access boundaries remain unchanged.
- Existing real profile lifecycle tips are retained below the stable account actions in legacy Home.

## Removed unsupported template statements

The former `HomeConcierge` component used only selected-interest names/counts to generate claims such as «Я собрал ваши приоритеты по роли…» and «Сегодня вы носите … шляп. Я поставил задачи…». Its “Focus mode” and “Ask” buttons both opened search. This unused component was removed along with its V2 placement.

The former `TrustMarker` component rendered these static strings without a source lookup:

- «Лицензировано и регулируется» / “Licensed & regulated”
- «SEC Таиланд · DBD 0105567890123 · соответствие PDPA» / “SEC Thailand · DBD 0105567890123 · PDPA compliant”

Exposure was the authenticated Home V2 composition, reached when `home_v2` was enabled and `useIsAdmin` returned true. It had no additional verification gate and was rendered below the category grid. The component and its placement were removed because these statements were unsupported template copy. This is not evidence that the business lacks a license or registration; no legal research or business-status finding is made here.

## Verification

- After merging current main and adding the immediate-focus regression, 99 focused tests passed across 9 files: all home component tests, `useRoleSignals`, and the consumer-shell regression suite.
- After the PR124 main update, all 11 lightweight browser-runner contract tests passed without launching a browser. A structural workflow comparison confirmed that all 13 existing pre-enforcement steps, including the two-worker runner, remain unchanged.
- Focused ESLint: passed with no errors or warnings on changed source/tests.
- `git diff --check`: passed.
- New synthetic fixture JS and production CSS compiled at `/tmp/browser/compact-personal-home-isolated`; JS/Python syntax checked. It bundles actual Index/IndexV2 and the changed first-screen components, stubs account reads/lower ancillary modules, and rejects production data modules.
- The prepared fixture covers RU/EN/TH, 375/430/1280, personal/work audiences, remembered/revoked/cross-account destinations, loading/empty/error/live states, preference close/reopen, and action routing. Local browser/socket execution remains blocked and was not retried; browser execution now runs in PR CI. Bundle compilation is not visual verification. Direct guest/V2 renders exercise component resilience, not the application's guest router or rollout authorization.
- Initial local full TypeScript attempts exhausted memory or were killed (137); a full Vite attempt was cancelled (130), and its generated MCP file was restored. Full TypeScript, production build, all 3,340 tests and existing browser fixtures subsequently passed in the first PR126 CI run at `6a3c1f7`; the new home smoke did not pass in that run (see below). The amended head requires a fresh complete CI result.

Required before release: full CI typecheck/build and browser execution of the isolated fixture, then normal code review. A separate Draft PR is authorized after PR124 merged into main. No remote merge or deployment is included in this task.

## CI registration and runtime budget

`connected-system-check.yml` adds an independent `home_browser` gate with the existing network guard and `timeout 180s node scripts/qa/compact-personal-home-ui.mjs --run-browser`. All existing typecheck, unit, timezone, build, lint and browser steps remain unchanged, including main's two-worker browser runner and its own tests. The final enforcement requires this additional step to succeed; `continue-on-error` allows evidence collection, not a passing gate. Existing artifact upload includes the fixture's `/tmp/browser/compact-personal-home-isolated` evidence.

The original exhaustive render matrix alone called `networkidle` 432 times, implying at least 216 seconds of idle waits before interactions. The default CI run must therefore use the representative smoke suite rather than that full cross-product. The smoke runner uses DOM/query readiness instead of a fixed network-idle delay, and a fail-closed 150-second browser budget leaves headroom for bundle/CSS compilation within the 180-second fixture cap. The amended-focus CI run measured 35.963 seconds for the complete smoke browser phase (see below).

Default smoke plan: **36 render cases + 8 preference exercises + 12 access-boundary cases + 2 interaction groups = 58 planned groups**.

- Every combination of two home surfaces, RU/EN/TH and 375/430/1280 is represented (18 combinations, two render cases each). The six main audiences (guest component fallback, resident, admin, MC-managed owner, vendor and generic employee) are distributed so every language and every width includes all six on each surface. Loading, empty, full error, partial error and live states are represented. This is representative coverage, not the complete role/state cross-product.
- The two core interaction groups run at EN/375, once per home surface. They retain routing, remembered/revoked/malicious workspace choices, account-switch isolation, notification no-mutation, pending-order read/error/count and preference-error checks.
- Additional access cases explicitly exercise staff, property manager, investor, self-managed owner, unresolved account roles and unresolved owner type, once per surface. Generic employment cannot expose management, and interest choices cannot grant a workspace.
- Preference close/reopen/reorder and 44px controls run in all three languages at 375 on both surfaces, with additional guest exercises in the core groups. Other viewport and language sheet permutations remain optional exhaustive coverage.
- `node scripts/qa/compact-personal-home-ui.mjs --list-cases` validates and lists the smoke manifest without importing Playwright or launching a browser. `--list-cases --exhaustive` lists the optional full plan: 432 render cases, 108 preference exercises, 108 boundary cases and 18 interaction groups. Both commands report `planned-not-run`.
- `node scripts/qa/compact-personal-home-ui.mjs --build-only` compiles only. An authorized browser run uses `--run-browser`; append `--exhaustive` for the optional full plan with a separate 1,200-second browser budget, outside the default CI fixture cap.
- Successful reports require exact equality between executed and planned case IDs and include actual counts and elapsed time. Timeout/incomplete runs fail; they cannot silently shorten coverage. Build-only reports keep `browserValidation: not-run`.

The no-browser smoke/exhaustive manifests and JavaScript/Python syntax checks passed locally. Bundle/CSS compilation passed with zero production data modules. Browser assertions, screenshots and runtime remain unrun locally; complete verification of each amended head remains a CI gate.

## First CI focus correction

The [first PR126 run](https://github.com/pavel949/myuno/actions/runs/39226982072) correctly failed final enforcement with `HOME_BROWSER=failure`; the step's post-`continue-on-error` conclusion must not be treated as its raw outcome. The smoke completed two render cases and then sampled a focused preference button before its computed ring was painted (1.433 seconds into the browser phase, not a runtime-cap failure). The [preserved evidence](https://github.com/pavel949/myuno/actions/runs/39226982072/artifacts/12176697150) includes the computed-style failure and a subsequently captured screenshot with a visible navy focus ring.

The preference control now limits transitions to colors so its focus ring is immediate, matching the neighboring personal actions. The fixture waits for the computed visible-focus predicate within a bounded deadline and still requires `:focus-visible` plus a visible outline or ring. It does not skip a scenario, relax the predicate, accept a missing indicator or bypass enforcement. A fresh CI run and actual screenshot review are required before this correction is accepted.

## Amended-focus CI and PostgreSQL fixture isolation

The [second connected run](https://github.com/pavel949/myuno/actions/runs/39230444236) checked merge ref `52819091bb0df825fbbf15c68048e5c67415a2a4` (home head `55653980c53413212d0328c48b7d48e4fe483ae8` plus main `e818d958ea84cbd1b61e704850d5f191b121be63`). Final enforcement reports `home_browser=success`, `browser=success`, and successful typecheck, focused/timezone, build and lint outcomes. Home completed all 58 planned groups in 35.963 seconds; all 20 existing browser fixtures also passed. The [browser evidence](https://github.com/pavel949/myuno/actions/runs/39230444236/artifacts/12177866716) ZIP SHA256 is `d1d5ea2f40d9a9b9d3e49a68d196ce564f6de9fa86c54b0e36750f91fd07cc51`. RU/375, EN/430 and TH/1280 admin screenshots were actually viewed: the compact controls and long signal text fit without clipping. These are synthetic, system-font screenshots, not production-font or live-account verification.

That run remains **failed**: the unit artifact records 3,340 passed, one failed, zero skipped. `managedPropertyPublication.postgres.test.ts` timed out in the unchanged 5,000ms deadline while testing all four raw `portal_messages` operations for a content-only employee. The log reports a timeout, not an authorization assertion mismatch. The separate [verify run](https://github.com/pavel949/myuno/actions/runs/39230444235) on the same merge ref passed all 3,341 tests, including all 101 publication cases. Differences include separate hosted runners/reporters; verify's `E28_JIT_PROFILE=1` applies only to the separate `unoTeam` fixture.

The tiny publication fixture now starts its own disposable Unix-socket PostgreSQL cluster with `jit=off`, matching the existing isolation approach in `unoTeam.postgres.test.ts`. Cluster startup covers every pooled session. Nested portal/owner-settings RLS and unanalysed synthetic tables make compilation overhead a plausible contributor, not a proven production diagnosis. No policy, authorization assertion, role, timeout, schema/index or production setting changes. No local socket test was retried. The resulting commit still requires all 101 publication cases and the full CI suite to pass.

Concurrent main subsequently added `bun.lock` changes at `17d69a4687f298a772bf9d951b11de349c42470c`; the home branch does not overwrite them. Both source CI workflows use `npm ci` and the unchanged `package-lock.json`. Their success cannot certify the changed Bun dependency graph used by a separate Lovable production build. The next PR merge-ref must be checked against fresh main before claiming final integration coverage.

## Deterministic concurrent-lock observation

The [next connected run](https://github.com/pavel949/myuno/actions/runs/39233264963) checked merge ref `cb28865265313a85c90fce359b9446d5f96cb49f` (home `15c5ca278cee1c3538dabab7f5b80f7fb8b3dda5` plus main `17d69a4687f298a772bf9d951b11de349c42470c`). All 101 publication tests passed; the former portal denial case took 18.128ms. Home again passed all 58 groups in 35.903 seconds, and all 20 existing browser fixtures passed. Final enforcement nevertheless correctly failed on the sole unit timeout: the complex-publication test that revokes admin status while a review waits on a row lock. Separate verify passed all 3,341 tests on the same merge ref.

The lock-holder queried `pg_stat_activity` repeatedly within one transaction. Its backend-query snapshot can retain a pre-review query even after the reviewer is blocked, as documented in [PostgreSQL 16 monitoring statistics](https://www.postgresql.org/docs/16/monitoring-stats.html#MONITORING-STATS-VIEWS). The fixture now deliberately primes the initial false observation before starting the review, then executes a separate awaited `pg_stat_clear_snapshot()` before every poll. This makes the formerly unlucky ordering a deterministic regression. The true blocked-state assertion, role revocation while holding the lock, exact revoked-admin rejection, pending-row assertion and bounded loop/test deadline remain intact. Repository search found no other analogous activity-polling loops.

Both workflows use the same npm lock, Vitest config, network guard and two workers. Each PostgreSQL fixture owns a distinct temporary Unix socket; the complex pool allows four connections for a two-connection scenario. Different runners/reporters can expose scheduling races, but no evidence justifies changing global worker limits or complex-cluster JIT. This correction changes only the isolated test and this evidence record. Full CI on the corrected head remains required; no local socket run or production change was attempted.

## Moderation tab transition readiness

On home head `31bfc52061969e0c88a492255053739dedf1fc0a`, [connected run 39235914119](https://github.com/pavel949/myuno/actions/runs/39235914119) tested merge `43b32b296a7bf20ef2b38387f849c43dda917e15`, including main/PR127 at `bccb10515acefe61f4503d4bd42da4c84998209f`. All 3,342 unit tests passed, including 101 property and 75 complex PostgreSQL cases; the forced snapshot regression took 20.602ms. Home passed all 58 groups in 34.387 seconds. Final enforcement still correctly failed because one of the 20 existing browser fixtures, moderation queue, exited with an assertion error. All other outcomes passed.

The failure was the immediate exact option-array read after switching to the inactive queue. Both queues have four synthetic rows and count `4`, so those waits do not distinguish the old router tree during `startTransition`. The later failure screenshot shows the correct inactive rows, and runtime-error/blocked-request lists are empty. The actual failing array was not logged; a pre-commit sample is the evidence-backed inference, not a claimed captured value. Moderation fixture/component/tabs sources are unchanged between main and the tested merge.

The fixture now waits for the exact committed route and selected-tab accessibility state after all three queue-tab switches, reusing its existing route observer. Combined filters that keep one matching row also wait for their selected values before capture. The original exact option-array assertion, status distinctions, routing, geometry and zero-write/network isolation assertions remain unchanged. There are no fixed sleeps, skipped scenarios, timeout increases, UI/CSS changes or gate changes. A fresh complete CI result is still required.
