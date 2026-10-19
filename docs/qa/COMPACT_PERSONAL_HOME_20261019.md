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

The original exhaustive render matrix alone called `networkidle` 432 times, implying at least 216 seconds of idle waits before interactions. The default CI run must therefore use the representative smoke suite rather than that full cross-product. The smoke runner uses DOM/query readiness instead of a fixed network-idle delay, and a fail-closed 150-second browser budget leaves headroom for bundle/CSS compilation within the 180-second fixture cap. No successful wall-clock browser runtime is claimed until CI measures it.

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
