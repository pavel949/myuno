# Isolated Drive staging SQL acceptance

The test owns a disposable PostgreSQL cluster and uses its local Unix socket
only, with TCP disabled. It does not load `DATABASE_URL`, hosted credentials
or actual project records. This is not a migration or a deployment instruction.

`drive-stage-exact-rpc.sql` is the source-only `pg_get_functiondef` result for
`public.stage_drive_import_version(uuid,jsonb,jsonb,jsonb,text,text)` read via
the canonical myUNO project on 2026-11-21. SHA-256:
`7fe068a597e99f7ba2794657912fdfe7c1bd2a64c69addc8693a3ad75dcb068d`.
No customer, supplier, property or access data is in the function snapshot.
Read-only metadata also confirmed execute access: anon false, authenticated
false, service_role true. The fixture applies this same grant matrix in its
disposable cluster, with a synthetic JWT role claim helper. It does not
certify the deployed RLS or actor admission itself.

`drive-stage-base.sql` uses synthetic canonical parents and the inspected
staging defaults and foreign keys. The test imports the actual adapter and
runs it against the exact function without invoking the production RPC. It
asserts that the approved row becomes one pending review version, one item and
five pending facts; the item/facts do not yet have physical FKs populated.
The adapter validates and returns the existing private sales/physical pair.
Inventory, project, source, jobs and financial snapshots must not change.

The RPC intentionally replays by job, including a mismatched payload. The
adapter must return a matching prior receipt without RPC retry, refuse
different content hash or parser version, and never treat malformed input or
failed item insertion as a confirmed stage. The tests cover grant/actor
denials and rollback after the local RPC has attempted its version insert.
No coverage claim is made for a private approved-evidence server, live JWT,
or physical output authority beyond the isolated fixture.

Run on an executor with PostgreSQL binaries in PATH:
`npx vitest run src/lib/__tests__/driveStageExact.postgres.test.ts`.
