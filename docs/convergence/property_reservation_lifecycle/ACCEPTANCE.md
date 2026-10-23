# First process milestone: unpaid property reservation

Base: main `815952632b6540e1dbc0c03e23456b90dea2bfbc`.
Branch: `codex/property-lifecycle-20261023`.
Status: source / isolated acceptance. **Not activated in production.**

| Process evidence | Result | Environment and limits |
| --- | --- | --- |
| Guest durable pending reservation, exact order/item/guest/hold | PASS | Registered 0036 on disposable PostgreSQL 16.15 |
| Same-key concurrent replay and different-key overlap | PASS | Real row/advisory locks, GiST exclusion, complete loser rollback |
| Timeout/lost response and repeat creation/cancellation | PASS | Actual client adapters + Chromium + real PostgreSQL; first committed HTTP responses deliberately aborted |
| Guest persisted status; manager confirmation and readback | PASS | Checked SQL readers and command; synthetic authenticated DB roles |
| Owner/manager PMS list despite legacy RLS denying raw order SELECT | PASS | Real SQL role test and actual hooks with isolated SDK-boundary tests |
| Cancellation, stale revision, unauthorized/anonymous attempts, date release/rebooking | PASS | Real PostgreSQL roles and persisted readback |
| Atomic late failure / suppressed audit insert; raw mirror detachment / forged history | PASS | Fault injection and actual protected triggers |
| Owner manual creation and date/guest edits | PASS | Same canonical transaction, mirror validation and overlap constraint |
| New cohort refuses Stripe/manual-payment activation | PASS | Actual handler source executed with synthetic SDK boundaries; zero payment/ledger/notification effects on refusal; real SQL payment guards |
| Guest status/detail and modal pixels, 390 and 1440 widths | PASS | Screenshots inspected; production CSS, synthetic auth/layout shell. Not a complete live NavShell/PMS screen audit |
| Existing PMS/calendar/detail/preparation regression suites | PASS | 107 component/hook tests; fixture data |
| Real Supabase Auth/PostgREST, deployed DB/financial/import trigger compatibility | UNVERIFIED | Requires representative isolated target and read-only preflight, then separately approved activation |
| Real card capture/refund and paid/historical lifecycle | NOT IN MILESTONE | No payment/refund completion claim; historical/paid mutations remain fail-closed |
| Production migration, edge deployment, frontend publication and live acceptance | NOT ACTIVATED | No production writes or deployment performed |

Targeted acceptance: 125 tests passed across ten files, including 22 real
PostgreSQL/browser scenarios. Additional existing regression: 107 passed across
eight files. Lint, typecheck and build results are recorded with the final commit
report; test counts are not production activation evidence.

## Reproduction

Native PostgreSQL binaries are supported in CI. This executor used the pinned
image `postgres@sha256:9e2cf6287f25c3151f4c9421ccce2b17f3e60061c111a29165e0d2cdd9ff0a97`
with `--network none`, no TCP listener, and a private temporary Unix socket.

```sh
npm run typecheck
npm run lint
npm run build
PROPERTY_LIFECYCLE_PG_DOCKER_IMAGE=postgres@sha256:9e2cf6287f25c3151f4c9421ccce2b17f3e60061c111a29165e0d2cdd9ff0a97 PROPERTY_LIFECYCLE_BROWSER=1 PROPERTY_LIFECYCLE_ARTIFACT_DIR=/tmp/property-lifecycle-evidence NODE_OPTIONS='--require ./scripts/qa/local-network-only.cjs' npm test -- --run src/lib/__tests__/propertyReservationLifecycle.postgres.test.ts --maxWorkers=1
```

Browser execution requires local Chromium and Python Playwright. Its temporary
HTTP gateway accepts only three allowlisted RPCs, fixed synthetic identities and
parameterized SQL. Requests outside the local gateway are blocked. It is test
infrastructure, not an authentication service or deployable API.

## Activation prerequisites

1. Review `preflight.sql` against the explicitly authorized target without writes:
   exact predecessor fingerprints, schema/enum types, grants/RLS, trigger order,
   migration journal, and import/calendar/payment writers. Do not infer production
   equivalence from the synthetic supporting schema.
2. Validate this registered migration on a representative isolated database.
   There is no live backfill; receipt-backed new orders alone enter the new
   mutation contract. Old/paid/ambiguous orders are not silently adopted.
3. Approve activation scope explicitly. Besides checked commands/readers and
   private receipts, 0036 tightens property overlap propagation and manual block
   serialization. Those bridge changes also affect legacy property writers and
   require compatibility review. Service/payment functionality outside this
   cohort is not certified by these tests.
4. Deploy in a coordinated sequence: schema and checked eligibility RPC first;
   verify them before deploying the two guarded edge handlers and new frontend.
   A missing eligibility RPC deliberately fails closed before payment work, so
   deploying handlers first would interrupt legacy Checkout.
5. Keep the restrictive stop SQL in
   `docs/hardening/rollback/property-reservation-lifecycle-stop.sql` ready.
   Preserve receipts, stays, audit and payment refusal during rollback. Never
   restore an overlap-swallowing bridge or erase uncertainty to make a retry pass.
6. Verify the exact deployed frontend, edge versions and DB migration, then the
   allowed request-only journey. Publication alone does not activate or prove
   the server contract. No live customer booking/payment is authorized here.
