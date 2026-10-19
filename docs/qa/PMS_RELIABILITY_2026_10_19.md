# PMS reliability correction — 19 October 2026

Repository: `pavel949/myuno`. Source baseline: `796c0ee2a501e7c3feeac18ec25c96503daf0c69`.

## Implemented corrections

- Booking create/update preflights reject errors from order, item, block and current-order reads. Missing current rows and invalid/reversed/zero-night civil dates cannot reach a writer.
- Released orders no longer disable dates in the calendar booking form. Conservative unknown inventory statuses remain holds. Checkout remains exclusive.
- Secondary guest-detail response/transport failures return the saved primary record with an explicit warning; the UI instructs the operator to review, not recreate it. Task preparation uses Bangkok civil dates.
- Portfolio queries propagate incomplete source reads. Company query keys include the actor. Task-source errors remain visible, zero-row task completion cannot report success, cancelled work is excluded from pending cleaning/maintenance, and reopened tasks clear completion metadata.
- Order-backed details use `order_status_history.order_id/reason`; inventory records retain their inventory history. History transport failures render an error, disabled subscriptions ignore late events, and highlights/timers are cleared between records.
- Detail and list preserve actual checkout/no-show/refund/unknown labels. Displayed total uses the stored amount/currency, preserving zero and unknown values. Total is not represented as a receipt, deposit or balance.
- Management details link to the existing property calendar/tasks and workspace with the correct property context. Owner surfaces do not show management shortcuts.
- Add an isolated real-detail browser fixture (RU/EN; 375/390/430/1280; normal/error) to the blocking connected workflow. All backend/network side effects are denied.

## Verification

Local focused baseline after the new cases: 109 passed, one expected-text assertion corrected; corrected date suite 39/39. Final combined focused, lint/types and remote CI results belong to the PR head and are reported in its description, not inferred from these earlier runs.

Local aggregate TypeScript was attempted with the default Node heap and aborted with V8 out-of-memory; it is not counted as a pass. Disposable PostgreSQL and Python Playwright are not installed in this local execution environment. The repository's existing GitHub Actions workflow installs both and performs the broader type/unit/PostgreSQL/build/browser checks. No hosted write acceptance is claimed.

## Explicit residual gates

This bounded correction is **not full financial or resort-production acceptance**:

1. Atomic order + inventory commitment is still unresolved. Separate browser writes and the bridge that catches overlap are not made atomic by a successful preflight. No new reservation or payment writer is introduced here.
2. Financial contracts PC-01–PC-05 and direct/manual/webhook/ledger compatibility remain open in `docs/convergence/final_order_mutation/P0A_PRICE_SETTLEMENT_CONTRACTS.md`. Existing PR #95 is containment, not a compatible financial replacement; merging it blindly would deny the current manual browser writer.
3. Operating Space setup in PR #96 depends on #95 and migrations 0035–0038; setup is not completed runtime isolation. Real property/member manifests and staged runtime enforcement remain required. No staff, assignments or enforcement flags were seeded/changed here.
4. Completing a task still does not establish actual order check-in/out. That requires a separately checked lifecycle command; this patch never fabricates one.
5. The UI/operational repair PR #110 and iCal containment PR #111 are separate work. No claim they are merged or deployed.

## Release and rollback

No schema, ACL/RLS, Edge handler, payment/ledger rule or real business record is changed by this patch. Source-only release; verify deployed frontend SHA separately. Revert the patch for code rollback; no business-data/schema rollback is needed. Do not restore false-success behavior as an operational workaround.
