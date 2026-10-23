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
| Real card capture/refund and paid lifecycle | NOT IN MILESTONE | No payment/refund completion claim; paid/unknown/unverified legacy mutations remain fail-closed |
| Production migration, edge deployment, frontend publication and live acceptance | NOT ACTIVATED | No production writes or deployment performed |

The compatibility tranche exercises the actual registered migration with captured
legacy column shapes, commission/financial/duplicate/protected-field/release and
timestamp hooks, plus service-role atomic writers and the actual calendar upsert
helper. Supporting auth/permissions remain synthetic: this is representative
committed-schema evidence, not a claim of full current production equivalence.

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
HTTP gateway accepts only allowlisted reservation RPCs and a scoped synthetic PMS raw-read boundary, fixed synthetic identities and
parameterized SQL. Requests outside the local gateway are blocked. It is test
infrastructure, not an authentication service or deployable API.

## Activation prerequisites

1. Review `preflight.sql` against the explicitly authorized target without writes:
   exact predecessor fingerprints, schema/enum types, grants/RLS, trigger order,
   migration journal, and import/calendar/payment writers. Do not infer production
   equivalence from the synthetic supporting schema.
2. Validate this registered migration on a representative isolated database.
   There is no live backfill. Legacy adoption additionally requires a private,
   reviewed external-payment reconciliation manifest bound to the exact order
   revision, property and inventory row. Application and service roles cannot
   create this evidence. Missing payment rows are not proof of safety.
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

## Review correction: eligibility and legacy operational compatibility

New guest creation must match published rental supply, not merely an arbitrary
active/approved UUID: `deleted_at IS NULL`, canonical rent eligibility
(`listing_type='rent'` or `listing_modes` contains `rent`), and explicit `short`
tenancy. Only absent/empty tenancy modes use a finite positive nightly-price
fallback. Check this again after acquiring the property row lock. A previously
committed actor/property/intent-bound receipt remains replayable after soft delete,
unpublishing or rental-mode change, and its guest can still cancel.

## Reviewed unpaid legacy transition

Exact-linked, independently reconciled unpaid records now have an atomic transition
path: authorized minimal revision read, owner/scoped staff adoption under the
property/order locks, persisted adoption audit, then the same CAS command. No
adoption by dates, no raw-write fallback, no change of commercial customer.
Adoption and the requested mutation roll back together on failure.

| Record cohort | Result |
| --- | --- |
| New receipt-backed unpaid guest/manual | Create, scoped edit/confirm/cancel, persisted read and date release |
| Exact-linked legacy unpaid with reviewed reconciliation evidence | Scoped edit/confirm/cancel; preserve original customer/history; one adoption receipt |
| Legacy with no reconciliation evidence or changed reviewed revision | Refused; existing authorized raw reads retained |
| Paid, attempted/unknown payment, ambiguous or foreign legacy | Refused; no refund/financial completion claimed |
| Calendar inventory without canonical order | Remains inventory; not adopted by dates; actual upsert/repeat/edit/overlap helper tested |
| Checked-in/completed fulfilment | Outside this unpaid milestone |

The private `legacy_unpaid_reconciliation` manifest must come from independently
reviewed provider/session reconciliation, with an evidence reference and SHA-256,
not from absence of database traces or operator self-attestation. No production
manifest has been populated. Its creation needs separately authorized reconciliation
and controlled activation; no provider export/tool is available in this executor.
The new durable `payment_gate` prevents future Checkout/adoption races but cannot
prove that an unrecorded session was never created before this migration.

Actual external calendar fetch/authentication, full deployed trigger equivalence,
real Supabase Auth/PostgREST and payments remain UNVERIFIED. Representative tests
use committed schema/captured functions and synthetic records; they do not obtain
or alter production data. Production activation remains NO-GO pending these
preflight and historical reconciliation gates.

## Compatibility tranche validation

- 58 real PostgreSQL/Chromium cases passed, including guest/PMS-hook readback,
  legacy adoption, exact permissions/CAS, concurrency, payment-gate races,
  representative hooks, service-role atomic creation and actual iCal upserts.
- 46 focused helper/hook checks passed in the same run (104 total).
- Nine client/handler suites: 106 passed (overlap with the 46 above; do not add
  these as disjoint coverage). Earlier 107 existing regressions remain recorded.
- Fresh 390px confirmed and 1440px cancelled detail screenshots inspected.
  Synthetic shell/auth, real backend and production CSS; not live-site evidence.
- Independent bounded source review: GO; production activation: NO-GO pending
  independently reviewed historical reconciliation and actual-target preflight.
- Final typecheck, production build and scoped ESLint passed. Generated version/MCP output excluded from the patch.
