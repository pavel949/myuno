# Admin data integrity repair

The live audit found disposable transactions, public catalogue mutation grants, incompatible unit-state vocabularies, stale supplier detail reads, a nonfunctional reference-list Add action, and a finance shortcut that fabricated paid orders and commission.

## Design
Keep existing canonical entities and writers. Full project_units.unit_status is authoritative; status is a coarse compatibility summary. Unknown data stays unknown. Public catalogues admit active approved real suppliers and services with active categories. Quote prices may remain null. Public views retain safe owner-executed allowlisted projections and SELECT; all mutation grants are revoked. No provider/org mapping is invented.

The finance shortcut now opens the existing manual-payment verification workflow. Supplier details are loaded as one context-tagged snapshot with cancellation and sign-out protection. Reference-list creation uses the existing taxonomy definition writer with duplicate/error handling.

## Verification
23 focused frontend tests passed. 11 isolated PGlite PostgreSQL scenarios passed, including anonymous-write reproduction, access denial for anon/authenticated/service_role, public catalogue admission, full-state preservation, compatible transitions, conflicting-write rejection and idempotent replay.

Run scripts/qa/admin-data-integrity-db.mjs with REPO MIGRATION PGLITE_ROOT, where PGLITE_ROOT contains @electric-sql/pglite. Only disposable synthetic fixtures are written. Never use the shared production database for QA writes.

## Recovery
Prefer a forward fix. Do not restore public mutation grants. Preserve full unit state and status_version; do not restore stale available summaries. Recover deleted test transactions only from an authorized backup if ever required. The separately authorized transaction reset preserves catalogues, users, configuration and independent tasks/availability blocks; it is not part of the replayable schema migration.
