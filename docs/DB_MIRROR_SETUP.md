# PostgreSQL snapshot and restore rehearsal

The former anonymous REST export plus `ignoreDuplicates` importer was a partial copy, not a faithful snapshot. It could omit RLS-hidden rows, retain stale target values/rows and exit successfully after table failures. It is replaced by native PostgreSQL archives and explicit isolated restoration. The workflow no longer writes to the former hosted mirror target.

## Configuration (credential owner only)

The scheduled `.github/workflows/db-mirror-snapshot.yml` requires `SOURCE_DATABASE_URL` with direct PostgreSQL access and authorized complete reads of the selected schemas. No URL/credential is hardcoded or guessed. The script rejects an actor without explicit RLS-bypass/superuser capability and uses `row_security=off` so unreadable tables cannot look empty. Credential provisioning, live connection checks and workflow runs are not part of the local repair.

`pg_dump`/`pg_restore` must support the source server version. The candidate workflow installs PostgreSQL client tools; a server/client version mismatch fails closed and requires a version-pinned runner before activation. It uploads completed archives/manifests only after success; no partial artifacts are called backups.

Local invocation with separately authorized configuration:

```sh
SOURCE_DATABASE_URL='<provided privately>' SNAPSHOT_DIRECTORY='<new directory>' SNAPSHOT_SCHEMAS=public node scripts/export-data.mjs
```

Export uses one repeatable-read exported PostgreSQL snapshot for table contents and `pg_dump`. It preserves empty tables and the native schema, constraints, indexes, triggers, functions, policies and privileges in the archive. A manifest records exact per-table sorted canonical row SHA-256/count and schema evidence, including RLS, grants and sequences. There is no allowlist guessed from application `.from()` calls. Export errors exit nonzero; incomplete exports do not produce a completed manifest.

PostgreSQL sequences are not MVCC objects. Before publishing the manifest, export extracts the archive SEQUENCE SET entries without connecting pg_restore to the source and compares them with captured sequence state. Concurrent changes that disagree fail export before a completed manifest is written. Quiesce allocation/schema/ACL changes or retry; the concurrent-nextval regression verifies this safe rejection.

## Restore acceptance

```sh
TARGET_DATABASE_URL='<explicit fresh isolated database>' SNAPSHOT_DIRECTORY='<completed snapshot>' RESTORE_CONFIRMATION=fresh-isolated-database node scripts/import-data.mjs
```

Restoration refuses a nonempty target, does not merge/upsert, does not delete stale records and never offers a production overwrite flag. The built-in empty public schema is preserved; only its CREATE SCHEMA archive entry is omitted from the restore list, retaining its PostgreSQL initial privileges. All object, grant and policy entries are restored with `pg_restore --single-transaction --exit-on-error --no-owner`. Native constraints restore relationships. Any restore or parity failure exits nonzero and writes no success receipt. A failed parity check leaves the isolated restored database unaccepted for inspection; it is not silently deleted or used as production.

A successful receipt requires archive checksum, exact table row content (not input batch counts), schema definitions, relationships, policies and recorded sequence state to match. Restored object ownership belongs to the restore actor (`--no-owner`); global roles/ownership recreation and identity mappings require a separate plan. Missing roles, external-schema dependencies or privileges fail rather than weakening the archive. Databases with cross-schema foreign keys/functions need an explicitly reviewed complete schema set (`SNAPSHOT_SCHEMAS`), not a public-only completeness claim.

## Evidence boundary

The isolated regression uses only synthetic properties/requests and PostgreSQL test roles, including an RLS-hidden table, empty relationships, Unicode JSON, exact updated content, FK/orphan checks, enum/function/view/index/sequence parity, nonempty target refusal and corrupted-content rejection. Run with local PostgreSQL binaries:

```sh
node --test scripts/qa/database-snapshot.test.mjs
```

The test harness creates its own socket-only cluster. `RENTAL_TEST_PG_SOCKET=/tmp/<isolated-socket>` optionally selects an already disposable test server with the fixed `isolated_test` actor; hosted URLs are never accepted by this harness.

This is PostgreSQL schema/data recovery evidence for the explicit tested schema set. It is **not** full disaster recovery: Auth service users/sessions, Storage files, Edge deployments/secrets, scheduler configuration, global roles, cloud backups/PITR and an actual production restore were not tested. Existing provider backups were not inventoried and are not claimed absent.
