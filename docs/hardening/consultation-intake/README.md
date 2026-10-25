# Checked consultation intake — unapplied candidate / STOP before activation

This separate tranche extends the canonical consultation_requests writer. It does not modify properties, property authoring/publication, staff task assignment, project/unit RLS, roles, source ACL or deployment workflows. It is parked for review after the user's management-company priority change.

## Implemented source
- forward.sql adds nullable request-key/actor/hash columns and a partial unique index; keeps the existing UUID-returning RPC and inserts an explicit typed field allowlist. Server owns actor, pending/normal state and timestamps.
- Project/unit/physical-property links are checked against the existing public project and canonical bridge. Unknown offers are rejected. Private root property references require public-catalogue eligibility or the actual owner. No physical object is created.
- Identical actor+nonce+payload replay returns the existing UUID before current catalogue checks; a changed-payload conflict never overwrites processed state. Concurrent inserts are serialized by the unique key, so existing AFTER INSERT effects run once.
- Consultation-only triggers prevent browser direct-insert bypass, keep request identity/key metadata immutable, and preserve staff workflow updates under the existing stored admin role. Customer updates use a safe field allowlist, including protection against future operational columns. No broad table grant/policy revocation is performed.
- The three current browser RPC callers share consultationIntake.ts: useUniversalLead, useConsultationRequests and PropertyTourLeadForm. Pending nonce + SHA256 fingerprint survive an uncertain retry/remount in session storage; contact payload is not stored. Actor hints are refusal preconditions, never authorization. Concurrent/acknowledged repeats suppress repeated client dispatch; third-party delivery itself is not certified.
- rollback.sql closes the writer while preserving data/keys/guards and operator follow-up. It never restores the historical whole-record writer.

## Read-only production evidence
The associated Lovable database's RPC, column/constraint/index metadata, relevant policies/grants and trigger definitions were inspected with SELECT only. Existing request_type CHECK accepts five legacy property types; the fixture preserves that CHECK and status/FK constraints. This candidate does not silently expand other verticals. Actual direct INSERT and own-pending UPDATE policies make a RPC-only allowlist insufficient, hence the consultation-table guard. Actual notifications/CRM triggers remain unchanged; tests use inert database-local trigger sinks, never real messages or deals.

## Isolated verification
Local PostgreSQL 17.11 was extracted under /tmp; no system service/production connection was used. Tests use a disposable Unix socket with explicit database/user and mirror the observed role predicates. Current results: 23 PostgreSQL tests, 9 client-attempt tests and 16 existing-hook receipt tests = 48 passed. Coverage includes six concurrent identical submits, lost commit response followed by remount recovery through the actual client helper and SQL RPC, processed-state preservation, guest/private-read boundaries, real owner/admin cases, employment-only denial, metadata spoofing, new-column allowlists and security-preserving rollback.

Command:
`POSTGRES_TEST_BIN_DIR=/tmp/myuno-pg/root/usr/lib/postgresql/17/bin POSTGRES_TEST_SHARE_DIR=/tmp/myuno-pg/root/usr/share/postgresql/17 POSTGRES_TEST_LIB_DIR=/tmp/myuno-pg/root/usr/lib/postgresql/17/lib npx vitest run src/lib/__tests__/consultationIntake.postgres.test.ts src/lib/consultationIntake.test.ts src/hooks/useConsultationRequests.receipt.test.tsx`

Normal CI uses its installed PostgreSQL binaries. Project typecheck passed during this tranche. The new candidate has not received exact-head CI, independent migration review or live actor/JWT/PostgREST acceptance.

## Activation constraints
The key requirement changes the old RPC contract: cached/third-party callers without a key fail closed. Coordinate all client/backend activation and audit external callers first. Uncertain changed-details attempts remain blocked until original outcome is recovered; this is intentional rather than silently creating another request. Existing in-app database notifications are transactional; outbound transport delivery/recovery remains a separate acceptance item.

Existing broad grants including TRUNCATE remain a separately identified privilege-inventory concern; no destructive/API exploitability probe or grant change was made. Keep hold/payment containment and all prior launch gates.

Supabase CLI migration-name generation was attempted but could not create its user configuration directory on the read-only home filesystem, including the narrowly requested path permission. Therefore this is an executable, locally tested forward/rollback candidate, not a registered migration history entry. No db push/apply/deploy was attempted. Do not register/apply it automatically after tests.
