# REST snapshot containment — source change, not recovery acceptance

The scheduled source export uses anonymous REST visibility. Its empty tables may be RLS-hidden, and it omits schema, Auth users and Storage bytes. It is a partial catalogue archive, not a complete restore source.

This tranche labels that limitation in the machine summary, makes export/import errors nonzero, and refuses legacy/partial archives before creating a target client. Retained artifacts remain available for audit. No live export, import, credentials, scheduler, database or permissions are changed by local verification.

The import helper no longer ignores existing rows or falls back to a second insert after an uncertain response. It stops immediately on failed batches, records only acknowledged row counts, and explicitly retains stale target rows. Local file names, row shapes and manifest counts are validated before the first write. A complete manifest label is a prerequisite, not independent proof of backup correctness.

## Remaining release gates

- Obtain an authorized complete source export including schema and required identities/files; do not relabel the anonymous archive to bypass preflight.
- Restore to a fresh isolated target and compare exact row content, constraints, relationships and orphan checks. Verify Auth, Storage and functions separately.
- Prove the canonical assisted enquiry and operator handoff, then supervised booking/cancellation/finance acceptance with role boundaries. Existing synthetic tests do not certify production delivery.

The current export is intentionally ineligible for the existing importer. This change prevents misleading mirror success; it does not repair or certify disaster recovery. Rollback must retain nonzero errors and partial-archive admission rejection, never restore automatic replay of uncertain batches.

## Local verification, 2026-11-27

- Four pure importer tests passed: partial admission denial, existing-row updates, lost second response with no replay, invalid row denial.
- Six real CLI preflight tests were retained, but local child-process creation returned EPERM; they did not reach the importer. They remain required in verify CI and must not be described as locally passed.
- Existing request recovery/receipt and marketplace integration tests: 42 passed across three files, with hosted networking denied. These are synthetic frontend contracts, not production transactions.
- Changed JavaScript syntax and focused ESLint checks passed before the final generated-export cleanup adjustment; rerun syntax for the final tree.
- PostgreSQL binaries are absent in this environment. No restore or production-database acceptance is claimed.
