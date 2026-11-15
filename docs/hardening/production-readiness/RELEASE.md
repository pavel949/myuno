# Reviewed activation package — NOT APPLIED

Target is **pavel949/myuno**, source baseline `be1224b5ed838bffebffddf12b127871adf41bad`; Lovable project `dcc2b024-7627-4ad9-a915-a3df3dd839f0`, database ref `kakkwibljrjsawxgnupk`. `myUNO-final` is a different project and is not this release target.

Local source implements the approved price-authority and manual-RUB rules. Source checks do not establish deployed parity. No migration, Edge deployment, role assignment, business test write or notification was performed in production.

## Required release evidence

1. Capture `preflight.sql`, currently deployed Edge versions and exact frontend SHA. Compare the current predecessor definitions, existing policies/grants and enum labels. Resolve drift before registering any migration. Confirm `manual_payment_proofs` is private; configure document size/MIME constraints without exposing older evidence.
2. Back up database schema/data, Auth and Storage, then demonstrate recovery into an isolated target with outbound messages disabled. The encrypted REST row snapshot covers **public base-table rows only**, has no cross-table transactional snapshot guarantee and cannot substitute for this recovery gate.
3. Reconcile earlier THB sessions potentially charged at 1/100, legacy succeeded receipts without verified source, incomplete ledgers, missing provider→active-org mappings and existing inventory links. No bulk trusted-marker backfill or automatic charge/refund is included.
4. Review all affected legacy callers. Restricting direct order/item/payment/ledger writes intentionally disables unsafe financial editors and browser cancellation paths. Transfer rejection and manual rejection/refunds remain contained pending a separately checked atomic reversal/cancellation decision. An unavailable writer returns an explicit error; no direct-write fallback exists.
5. Record the real administrator/delegates and company/property duties using the existing checked assignment process. No role/member/property assignments are supplied. Existing Operating Spaces remain a separate gate: evidence showed zero spaces/assignments/enforced companies; a verified team/property manifest is required before activation.
6. Obtain the final GO/NO-GO for this concrete package under PROJECT.md §20. Passing tests do not activate financial functions.

## Forward dependency order (candidate SQL)

Use the established migration generator to register reviewed **new** migrations after predecessor verification. Existing historical migrations must not be edited or replayed. The local CLI could not create its configuration directory on the read-only agent home; these files remain review candidates, not migration-history entries.

1. Existing reviewed inventory candidate: `docs/convergence/atomic_property_order/forward.sql` (verify its predecessor hashes and rollback first).
2. `managed-booking.sql`: checked booking writer plus private trusted recipient resolver.
3. `manual-request.sql`: service-only quoted intake, including retry key, order/guest/hold/request in one transaction.
4. `stripe-settlement.sql`: verified receipt/order/inventory/ledger reconciliation with replay repair.
5. `manual-receipts.sql`: actor-bound documented FX receipt settlement, immutable evidence ceiling, trusted delegation and rejection of forged browser financial fields.
6. `order-authority.sql`: close direct browser financial writes and require checked pricing/transition authority. This is the restrictive cutover and must be coordinated with the paired handlers/UI.

Isolated PostgreSQL tests cover the forward candidates against the actual predecessor inventory function definitions, with synthetic schema/data and stubbed duty predicates. They do not replace testing the full production schema/functions in a restored isolated environment.

Deploy paired `create-property-deposit-checkout`, `stripe-webhook`, `confirm-manual-payment`, `confirm-transfer-operator` only through a controlled cutover; do not enable checkout while old handlers and new DB contracts disagree. Rebuild the frontend from the approved commit with actual deployment configuration. The local verification build uses loopback credentials and is **not** a deployable artifact. MCP was rebuilt for SDK 3.5.0 and the correct myuno public project ref; verify runtime compatibility separately before deploying MCP.

After activation, capture read-only grants/functions/build evidence again, run isolated/sandbox-provider acceptance and inspect the real reconciliation queue. Do not run business-mutation tests against the shared production backend.

## Existing consultation-intake correction

The audit also found the deployed consultation RPC still creates a new UUID on each retry. Reuse the existing reviewed candidate `docs/hardening/consultation-intake/forward.sql` and its adjacent rollback, rather than introducing another lead writer. Its existing browser helper and PostgreSQL/client tests remain in the full suite. This is a separate activation: inspect its README, current RPC/trigger definitions and old cached/third-party clients, register a new migration only after review, then verify actor/key/fingerprint replay. It is not silently applied by the financial cutover.

## Rollback

Every new writer has an adjacent `*-rollback.sql` that revokes execution and retains receipts/evidence/immutable boundaries. Apply containment for the affected writer first, disable checkout/confirmation entry points, and preserve already committed canonical data. For the inventory prerequisite use its reviewed adjacent rollback. Never restore unsafe direct writes or use historical metadata as proof of received money. Frontend/Edge rollback alone cannot reverse schema or financial effects.

## Backup operation

`db-mirror-snapshot.yml` requires source service key and a 32-byte base64 `BACKUP_ENCRYPTION_KEY`; no secrets were installed. It verifies exact counts/pages/primary keys and hashes, encrypts AES-256-GCM, uploads only ciphertext and removes plaintext. Inventory was read-only verified on 2026-11-15: 432 public base tables, 13 non-`id` primary keys, including composite keys. Refresh this inventory after schema changes. Failure of any table blocks a success manifest/import.

Automatic schedule exports only. Target import is explicitly opt-in on manual dispatch, uses canonical conflict keys, may execute target triggers and is not an atomic whole-database restore; target schema/Auth/FKs and notification isolation require a recovery drill. Deletion mirroring is intentionally absent. No target database was mutated here.

## Remaining acceptance limits

- Refunds, overpayment allocation, existing-order repricing and arbitrary legacy order state transitions need their own checked workflows; they are not silently enabled by this package.
- Stripe deposits are recorded without full-order revenue/paid flags. A second automatic Stripe installment is routed to reconciliation; documented manual receipts may complete a known THB balance.
- Resort category/rate-plan intake and the public eligibility of assigned units need isolated acceptance. A missing public catalogue row or trusted recipient blocks that payment path.
- Email/voucher delivery is best effort after committed settlement; no UI promise of successful delivery is made. A separate durable delivery/retry acceptance remains required.
- Dependency audit retains moderate/low findings; a Router 7 migration and remaining build/Excel chains need separate compatibility/security review. No `audit fix --force` downgrade is used.
