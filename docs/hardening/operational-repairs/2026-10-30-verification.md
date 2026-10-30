# Original tranche verification record — 2026-10-30

This historical matrix covers the original tranche `1b367c2605139eafe759acf8921bc9f0dfcea46c`. Follow-up review, lead lifecycle, unit metadata and test-efficiency repairs are subsequent separable commits. Their final frozen-SHA aggregate evidence is recorded in the draft PR; this original matrix must not be read as a fresh all-green aggregate claim for those follow-ups.

Scope and remaining operational gates: [repair contract](2026-10-30.md).
Base: `5b71c3fa74f5d94739bddaf73ac155ab0b58cead`; dedicated branch `codex/operational-repairs-20261030`.
Main was fetched again at the same SHA before preparing this release candidate.

| Check | Result | Evidence / limits |
| --- | --- | --- |
| Final production build (`npm run build`) | PASS | 7,123 modules, Vite build and PWA generation completed. Existing catalogue warning: management_company/vendor_onboarding lack mapped services. Build is not deployment. |
| Final `npm run typecheck` | PASS | Exit 0 after correcting parameterization typing in a new regression test. |
| Repository lint | PASS | `npm run lint -- --ignore-pattern 'test-results/**'`: exit 0, zero errors, 2,458 warnings. Ignoring transient browser output avoids its directory-deletion race; source coverage is unchanged. |
| Changed-source lint | PASS | Zero errors, 42 warnings. No warnings are represented as errors or clean-baseline proof. |
| Focused final regressions | PASS | 11 files / 82 tests: cancellation, tariff resolver, journey return safety, admin property/unit write failures, bulk result confirmation, physical project properties, lead double-click/uncertain retry and KPI failure/zero separation. Bulk parameterization was subsequently corrected and rerun as 6 tests. |
| Isolated browser flow (`npx playwright test --config playwright.operational.config.ts`) | PASS | 6/6: global search → synthetic property → exact global search query/category at 375/390/430/1280px; direct monthly-only inquiry redirects without a nightly quote; valid nightly inquiry displays the canonical strict cancellation text. Loopback-only backend fixtures; external HTTP is aborted, analytics and an explicit read-RPC allowlist are locally stubbed, business POST/DELETE/PATCH requests are blocked and asserted absent. No real submission/payment/booking. |
| Repository-wide diagnostic `npm test` during implementation | FAILED / ENVIRONMENT BLOCKED | Complete diagnostic run: 384 files = 372 passed, 9 failed, 3 skipped; 4,430 tests = 4,224 passed, 3 failed, 203 skipped. This is not a clean final-SHA all-green claim. Seven failing suites cannot initialize because `postgres`/`pg_config` are absent; two UI files account for three failures. |
| Recheck of both failing UI files, one worker | PASS | All 27 tests in CalendarPriceEditor and ServiceRoutes.integration passed without code changes to those files. This resolves those three diagnostic UI failures on rerun, not the PostgreSQL blocker. |
| Local PostgreSQL suites | NOT EXECUTED | Seven suite-import failures: catalogNotifications, finalOrderMutation, operatingSpaces, propertyInventory, publicPropertyCatalog, resortPublicCatalog, unoTeam. Local package download was attempted without global installation; configured APT cannot locate postgresql-17/postgresql-client-17. No production DB substituted. |
| Default Playwright config | NOT RUN | Its seed/teardown hooks can write live business records; replaced with the isolated configuration above. |
| Authenticated live CRUD / storage / full building chain | NOT RUN | Requires authorized real actors, verified deployed backend and separately governed production acceptance. Synthetic component/query tests are not this evidence. |
| Live migrations / security changes / merge / deployment / billing | NOT RUN | Outside this tranche's authorization. No production records or permissions changed. |
| `git diff --check` | PASS | Generated unrelated version/MCP/taxonomy audit writes restored; no migration/lockfile changes. |

Task-local raw logs are under `/tmp/myuno-*.log`: `build-final`, `lint-verified`, `regressions-final`, `rows-final`, `e2e-release`, `tests`, `recheck-failures`, and `typecheck-release`. These are local supporting output, not deployed service logs or permanent hosted artifacts.

Earlier browser runs exposed synthetic collection-shape mistakes and overly broad mutation assertions that counted stubbed telemetry/read RPCs. The final six-test run uses the corrected fixtures; failures are not hidden as production fixes. An early repository lint run raced browser-output directory cleanup and was rerun successfully with that output ignored. A new negative-case test used Vitest's tuple expansion incorrectly; wrapped cases now exercise whole row arrays and retain six bulk checks. Final runtime source did not change for these fixture corrections.

**Release decision: draft review only; production operational acceptance remains NO-GO.** See the repair contract for exact backend, readback/idempotency, deployment-SHA, billing and credential-owner gates. Do not merge/deploy or activate #183/#184 based only on these local checks.
