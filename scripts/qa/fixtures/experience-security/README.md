# Isolated experience publication security fixture

Dated 2026-11-18. Policy, has_role and resolver/count function definitions were retrieved read-only from the live MyUNO database and reviewed independently. Tables, identities, records and the fields-only `life_os_catalog` projection are synthetic. The fixture starts a private Unix-socket-only PostgreSQL cluster; it never connects to production and never applies a migration there.

`src/lib/__tests__/experiencePublication.postgres.test.ts` reproduces the existing draft/closed SELECT and SECURITY DEFINER RPC leaks, applies both proposed fixes inside the isolated database, and verifies actual role switching for anon, ordinary authenticated member, provider and admin. It preserves other-vertical behavior and editor policies. Provider own-draft SELECT is tested; existing provider UPDATE-policy defects are not fixed or certified.

Proposal SQL here is **test input**, not an automatic production migration. A separate reviewed migration PR, rollback, exact-head verification and controlled activation are required. This is not staging acceptance or a full-schema Supabase/PostgREST integration test. No verified staging project was accessible through connected resources.
