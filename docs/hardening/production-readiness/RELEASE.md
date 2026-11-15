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

## Registered source migrations — NOT APPLIED

The CLI configuration blocker was resolved using the official Supabase CLI 2.81.3 binary. Three new migration files were generated through the CLI; no historical migration was edited or replayed:

1. `supabase/migrations/20261115101016_production_readiness_atomic_payments.sql`: reviewed inventory, managed booking, manual intake, Stripe reconciliation, manual receipts and order authority in one outer transaction. Source hashes are embedded. The generator refuses to overwrite a populated migration.
2. `supabase/migrations/20261115101107_checked_consultation_intake.sql`: existing reviewed idempotent consultation intake, separately registered.
3. `supabase/migrations/20261115102726_restrict_unchecked_payment_recipient_mutations.sql`: revoke direct browser mutation of trusted provider→org bindings. Live read-only inspection found that generic staff currently pass the old broad finance predicate. No public replacement writer is exposed.

Isolated PostgreSQL fixtures execute the actual registered source files. This proves their tested contracts against synthetic predecessors, not compatibility with the complete restored production schema. Apply only after predecessor inspection, successful recovery drill and coordinated frontend/Edge cutover. Merely committing these files does not apply them or establish migration-history parity.

## Approved recipient scope — NOT CONFIGURED

The owner explicitly confirmed **Ignatev Estate Co., LTD for all 24 active properties**, including the 23 managed by Show Property Phuket. Read-only inspection confirmed all 24 have NULL provider IDs and no trusted provider→org bindings exist. Neither existing active organization represents this legal entity; both are test organizations and must not be repurposed.

`configure-ignatev-recipients.sql` is a privileged, explicit operator transaction, not an automatic migration or browser RPC. It requires a verified exact 24-ID manifest and the existing real Ignatev Estate provider. It creates/reuses one unambiguous legal organization and binds the approved properties through the existing provider→org model. It preserves management-company/owner assignments, existing orders and provider publication state; any changed public catalogue visibility or conflicting recipient aborts the transaction. Nine isolated PostgreSQL checks cover replay, scope, conflict, privilege and atomic rollback behavior.

The concrete manifest is saved outside Git at `/workspace/myuno-approved-recipient-manifest.json` with mode 0600. Re-read current context immediately before execution; never expand its scope automatically. First capture a secure before-image and postcondition evidence. Recovery and full-schema acceptance remain prerequisites. On failure the transaction rolls back; after a committed configuration, contain financial writers and review the captured before-image before any reversal. Never blindly detach a recipient that already has commercial history.

Deploy paired `create-property-deposit-checkout`, `stripe-webhook`, `confirm-manual-payment`, `confirm-transfer-operator` only through a controlled cutover; do not enable checkout while old handlers and new DB contracts disagree. Rebuild the frontend from the approved commit with actual deployment configuration. The local verification build uses loopback credentials and is **not** a deployable artifact. MCP was rebuilt for SDK 3.5.0 and the correct myuno public project ref; verify runtime compatibility separately before deploying MCP.

After activation, capture read-only grants/functions/build evidence again, run isolated/sandbox-provider acceptance and inspect the real reconciliation queue. Do not run business-mutation tests against the shared production backend.

## Existing consultation-intake correction

The audit also found the deployed consultation RPC still creates a new UUID on each retry. Reuse the existing reviewed candidate `docs/hardening/consultation-intake/forward.sql` and its adjacent rollback, rather than introducing another lead writer. Its existing browser helper and PostgreSQL/client tests remain in the full suite. This is a separate activation: inspect its README, current RPC/trigger definitions and old cached/third-party clients, use the separately registered new migration only after review, then verify actor/key/fingerprint replay. It is not silently applied by the financial cutover.

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
- Dependency compatibility follow-up is implemented in source: Router 7, audited compiler/glob/minimatch upgrades and tested XLSX export. Production dependency audit is clean; four low build-only deepmerge-chain entries remain explicitly reviewed and pinned by the advisory gate. See `docs/qa/PRODUCTION_READINESS_ACTIVATION_2026_11_15.md`.
