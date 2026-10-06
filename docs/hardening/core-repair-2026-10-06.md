# Core booking and payment repair — 2026-10-06

Baseline: `9dd8825b43cf816086e2de7368c00a3b6b923e6e` in pavel949/myuno. This is not myUNO-final.

## Changes

- Service catalogue requires active AND approved services, both in the query and in the pure normalization model. Pending, rejected and missing approval are rejected even if a stale/misbehaving query returns them.
- Signed checkout fulfillment handles both immediate completion and delayed-payment success; an unpaid completion does not fulfill.
- Canonical orders must match exactly one persisted Stripe payment. Validate settled payment status, exact minor-unit amount, currency and checkout/intent reference before confirmation. A deposit is checked against its payment amount, not the full stay amount.
- Confirmation uses a waiting-state allowlist in the conditional UPDATE. Cancelled, refunded, disputed and completed orders cannot be resurrected; losing a race to cancellation is surfaced as a reconciliation error rather than a successful duplicate.
- Update only the matched payment record. Shared checkout carries order linkage onto Stripe PaymentIntent metadata so refund charge events can resolve it.
- Allocate rental and cleaning deposit line items in minor units. Their sum equals the recorded deposit even with fractional cleaning fees.
- Synchronize npm lockfile with package.json. Scope ESLint's AJV requirement to its compatible version instead of forcing AJV 8 into AJV 6 callers.
- Unit tests construct Supabase using explicit local placeholders; they do not inherit production credentials. Node Request uses its native AbortSignal rather than the incompatible jsdom realm.

## Verification

- Initial `npm ci`: failed because lockfile omitted declared packages and peers; repaired install and `npm ci --dry-run --ignore-scripts --no-audit --no-fund` passed.
- Final full unit suite: 66 files, 1,279 tests passed. Targeted payment/allocation suite: 19 passed, including two new fractional-allocation cases.
- ESLint on changed frontend/model/test/config files: passed.
- Full `npm run typecheck` with NODE_OPTIONS=--max-old-space-size=6144: passed. Default heap failed; do not confuse that with a type error.
- Production build: passed separately in 1m 11s, including PWA generation. First attempt was killed for memory while typecheck ran concurrently. Large-chunk warnings remain; they were not suppressed.
- No database migrations, Stripe charges, notifications or deployment performed. Edge handler integration against signed fixtures and an isolated database remains a deployment gate.

## Remaining core release gates

1. Exact authoritative quote: replace client total range and unconditional early/last-minute discount allowance with one server rate/season/restriction engine shared with the booking UI.
2. Atomic settlement and posting: order confirmation, payment update, unique event receipt, ledger posting and retryable outbox must not partially commit. Existing early-confirmed return and non-fatal ledger error remain unresolved here.
3. Refund accounting: idempotent partial/full reversals, remaining balance, fees, deposit and availability reconciliation. Linking charge metadata alone does not solve accounting.
4. Availability: rental holds/expiry, calendar projection, iCal reconciliation and concurrent reservation tests; provider busy-slot read followed by insert needs a database concurrency guarantee.
5. Provider organization mapping requires verified business data; do not invent mappings. Service fee and slots remain unresolved commercial configuration.
6. Isolated backend and Stripe test environment for real role, concurrency and end-to-end validation. Preview shares production data.
7. Consolidate legacy through measured adapters and reconciliation; service_orders remains an active request domain.

## Delivery and rollback

This change is intended for a review branch. GitHub branch creation returned 403 "Resource not accessible by integration"; public read access does not grant the installed app repository write access. No main branch or live backend was modified.

Apply the delivered patch on the pinned baseline using `git apply --check` then `git apply`. Rollback is a code revert. Do not reverse payments or delete financial history as a deployment rollback.
