# Local verification — 31 October 2026

Repository `pavel949/myuno`, base `2c9097e560a492dd136c61aaa721775bcaa32028`; local branch `codex/rental-request-recovery-20261031`. No remote workflows, production records, permissions, deployment or billing changed. Candidate SQL is outside migration journals.

## Real isolated SQL and restore

Official PostgreSQL 17.11 image, network disabled, synthetic database roles/data only. The optional test socket was `/tmp/myuno-request-pg-socket`; every test database was created/dropped locally. The complete-suite container independently ran its own socket-only PostgreSQL clusters with Node 22.

- **Final frozen aggregate: 401/401 files, 4,832/4,832 cases passed, zero failures/skips**, Node 22 + PostgreSQL 17.11 in a network-disabled container, two workers, no retries. The final JSON is `/tmp/myuno-aggregate-evidence/final-results.json`; raw log `/tmp/myuno-rental-final-aggregate.log`. All 486 assertions in 11 PostgreSQL files passed.
- Earlier diagnostic: 4,818 passed / 4 failed in 401 files. The four failures were `bookingWriterDates.test.tsx` mock rows that omitted newly selected status/metadata. Its fixture now supplies the selected fields and adds explicit pending-request/legacy-hold cases. Assertions were retained; the final complete aggregate above supersedes that diagnostic.
- Follow-up: 3 files / 67 passed, including corrected 41-case writer preflight, request receipt/confirmation/cancellation/rollback SQL, and receipt UI copy. This resolves those four diagnostic failures; it is not represented as a fresh repository-wide all-green run.
- Final request contract now has 25 PostgreSQL cases, all passed in the final aggregate; these include NULL owner/decision and unknown-intent regressions. The earlier scoped-date follow-up passed 23 SQL + 10 guest projection cases. Source contracts exercise same-key concurrency/lost acknowledgement, mismatched payload, first/late-write rollback, real private scope helpers, revoked access, denied roles, no pending inventory, exact confirmation linkage, half-open adjacency, concurrent overlaps, manual blocks, preparation rules, unpaid cancellation/rejection, paid-path containment, checked operator readback, emergency stop, and UTC/Bangkok/Los Angeles. New-contract civil dates are explicit; unproven legacy timestamps retain prior interpretation.
- Actual widget/consumer checks: 4 widget tests passed; an earlier 5-file focused run passed 79 cases. Another earlier 7-file PMS/contract group passed 105. These runs overlap and must not be summed into a unique coverage number.
- Native dump/restore regression passed on synthetic `public` and `operations` schemas: exact row content/hash, cross-schema FK/orphan checks, schema SQL digest, enums/functions/views/indexes, RLS/privileges and sequence state; empty-target requirement, explicit confirmation, corrupted archive/content, stale-success-receipt removal, insufficient source privileges and missing schema all fail closed. No Auth service users, Storage files or production restoration were certified.

Raw local logs: `/tmp/myuno-rental-aggregate.log`, `/tmp/myuno-aggregate-evidence/results.json`, `/tmp/myuno-rental-final-contract.log`, `/tmp/myuno-rental-timezones.log`, `/tmp/myuno-rental-freeze-tests.log`, `/tmp/myuno-restore-proof.log`.

## Frontend and source gates

- Isolated Playwright operational configuration: 11/11 passed at 375/390/430/1280 px. It verifies public tariff/cancellation eligibility and Search return. It blocks external HTTP and real business writes; it does not certify an authenticated deployed admin/owner flow.
- Production build: PASS, 7,127 transformed modules and PWA output. Synthetic loopback Supabase configuration; generated version/MCP/taxonomy files restored afterwards. Existing catalogue orphan-situation warning remains.
- Typecheck: PASS, exit 0 after the final reviewed-source run in `/tmp/myuno-rental-typecheck-reviewed.log`. The production build also passed.
- Repository lint: zero errors, 2,477 warnings in `/tmp/myuno-rental-lint-reviewed.log`; warning-free baseline is not claimed.
- `git diff --check`: PASS.

## Independent read-only review

A fresh local reviewer inspected current source and SQL without edits, test execution, remote access or activation. It found an archive/manifest sequence race and NULL decision ambiguity. Both were corrected, with archive-sequence comparison/concurrent-nextval coverage and explicit NULL decision rejection. Self-review additionally made all new list/decision/intent authorization NULL-safe, with ownerless-property privacy regressions. The reviewer re-read the corrections and reported no remaining blocking findings in this candidate. This is code review, not deployed privilege or full operational acceptance.

## Remaining operational gates

Independent critical-contract/security review, fresh read-only deployed schema/function/ACL/trigger comparison, migration registration and explicit backend activation consent remain required. Do not publish the frontend before its checked backend contract exists. Money, provider mapping, server repricing, legacy direct writers, deployed role acceptance and P&L are not certified by these tests. Customer amounts are explicitly estimates requiring operator review; no payment/settlement success is inferred.

The scheduled backup candidate requires an authorized direct source PostgreSQL URL, compatible version-pinned tools and a reviewed dependency-complete schema set. It creates archives only and no longer writes to the former hosted target. No credentials were provisioned, hosted backup state checked, remote job run, or production database restored.
