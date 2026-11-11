# Critical backlog recheck — 21 October 2026

This is source and isolated-test evidence, not production acceptance. Reviewed main: `fb4b944a4c736f680ddb8e4b178f833030e021b1`. No hosted database, real booking, payment provider, role, credential, scheduler, Edge deployment or migration runner was changed.

| PR | Inspected head | Current evidence and remaining boundary |
| --- | --- | --- |
| 125 | `49a53420749778cccd16bc7fadcdcdee969c60ed` | Exact-head GitHub verify/connected/semantic/regression checks were already successful. Clean integration with current main. Fresh disposable PostgreSQL and focused client tests below pass. Client adoption is unconditional while RPC and accepted atomic bridge prerequisite are unregistered candidates: **merge/deploy/activation NO-GO**. |
| 140 | `043ea6c115ee7183ef07833558ce0c46f6f701e3` | Exact-head verify/connected/semantic/regression checks are successful. Not a generic red-test fix: contract explicitly refuses historical/unreconciled orders and requires shared durable checkout reservation/locking among competing writers. Proposed SQL remains outside migrations. **NO-GO for independent activation or client/Edge cutover**; do not weaken refusal to make cancellation appear functional. |
| 111 | `6697b22bdef627347bcc613e277a368c2a2c0fc8` | Exact-head verify/connected/semantic/regression checks are successful. Inventory-only iCal candidate remains draft. Authenticated ingress deliberately rejects the recorded anonymous scheduler caller; scheduler/gateway parity, historic financial reconciliation and actual OTA formats remain unaccepted. No scheduler or credentials were changed. |
| 95 | `3994397da24bbb0d2332c97ccdf65c4c48618b55` | Historical verify failures. A fresh merge-tree confirms a real journal conflict: its `0035_final_order_mutation_containment` collides with main `0035_restore_anon_execute_public_read_rpcs`. Main already contains the restrictive review SQL and real PostgreSQL tests under `docs/convergence/final_order_mutation/`; this PR adds raw-order INSERT revocation and registers the candidate. Do not merely renumber/register: compatible checked writer and checkout contracts must precede browser INSERT removal. Applied main migration 0035 must not be edited. |
| 80 | `f0b573a0449e323e20f837cda313b62ddb08bd5d` | Historical failing checks. Its InvestorGuard intent is already superseded by stronger main: no self-selected persona, admin-mode or generic `uno_team` bypass. Do not restore those bypasses. Remaining source delta disables DELETE in external-data-api; main currently retains a narrower primary-key-only DELETE with audit. This is a separate external-consumer contract decision, not a reason to restore the older permissive proxy. Proposed storage/RLS SQL is deliberately dormant; public bucket flips without signed-link client adoption would break legitimate access. |
| 17 | `2b895d62ccba01053152e78b2d76619c1c822d8e` | Historical semantic/regression failures; old broad checkout/webhook rewrite. Its UUID normalization is not trusted provider→org resolution. Its stale flower source predates main's authoritative bouquet price validation. Do not transplant the old handler and lose current guards. Surfacing raw database error messages to users is not an acceptable observability fix. Payment/refund/idempotency effects need a separate finite contract review with current writers; no provider calls were made. |

## PR 125 current-main verification

The candidate was merged locally with current main without conflicts. The six focused files passed **128/128** tests, including **61/61 real PostgreSQL** cases. Existing coverage includes concurrent same-ID replay, competing overlap rollback, adjacent nights, blocks/imported rows, Bangkok civil dates, owner/admin/delegated/anonymous/Space authorization, receipt isolation, late rollback and restrictive rollback.

Added four tests at this recheck: actual concurrent property ownership revocation while the command waits for a row lock; and separate drift rejection for the item bridge, protected admin helper and operational-property helper (in addition to the existing order-bridge drift test). Each drift assertion also proves no private command schema or public wrapper survives rejected preflight. The expanded actual PostgreSQL suite passed **65/65**; the final six-file focused suite passed **132/132** on the refreshed integration in 84.92 seconds. Scoped ESLint and `git diff --check` also passed. These tests reuse actual candidate SQL/captured helper definitions and synthetic dependency fixtures; they do not certify all live RLS policies or current production definitions.

Reproduction (local PostgreSQL binaries must be installed):

```sh
npx vitest run src/lib/__tests__/manualPropertyBooking.postgres.test.ts src/lib/manualPropertyBooking.test.ts src/hooks/__tests__/manualPropertyBooking.integration.test.tsx src/hooks/__tests__/bookingWriterDates.test.tsx src/hooks/__tests__/useMultiPropertyBookings.dates.test.tsx src/hooks/__tests__/usePropertyBookings.preparation.test.tsx --maxWorkers=1 --no-file-parallelism
```

`docs/convergence/manual_property_booking/rollback.sql` remains restrictive: revoke wrapper/private entry/schema access and retain orders, inventory and receipt evidence. No raw-write fallback is restored. Candidate SQL and migration journals are unchanged by this recheck.

## GO / NO-GO

**GO** for the additional tests and evidence; **NO-GO** for production publication/activation or treating any of these six PRs as a bulk ready-to-merge group. Main's new homepage candidate PR 156 is independent and unchanged. Resolve one critical writer/activation contract at a time under PROJECT.md §§16/20; passing tests does not authorize the next critical cutover.
