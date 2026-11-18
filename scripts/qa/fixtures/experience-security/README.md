# Isolated experience publication security fixture

Dated 2026-11-18. Policy, has_role and resolver/count function definitions were retrieved read-only from the live MyUNO database and reviewed independently. Tables, identities, records and the fields-only `life_os_catalog` projection are synthetic. The fixture starts a private Unix-socket-only PostgreSQL cluster; it never connects to production and never applies a migration there.

`src/lib/__tests__/experiencePublication.postgres.test.ts` reproduces the existing draft/closed SELECT and SECURITY DEFINER RPC leaks, applies the proposed read, RPC and guarded UPDATE fixes inside the isolated database, and verifies actual role switching for anon, ordinary authenticated member, provider and admin. It preserves other-vertical read behavior and unchanged editor policies; the recursive provider UPDATE policy is explicitly replaced only in the fixture. Provider-owned draft SELECT and permitted descriptive UPDATE are tested.

Proposal SQL here is **test input**, not an automatic production migration. A separate reviewed migration PR, rollback, exact-head verification and controlled activation are required. This is not staging acceptance or a full-schema Supabase/PostgREST integration test. No verified staging project was accessible through connected resources.

Additional proposed UPDATE fix is exercised only inside this fixture: it first reproduces the inherited recursive policy error (42P17), then tests admin writes, provider-owned descriptive writes and denied identity/moderation/operational-field changes. It is not applied to production. Supplier UI compatibility is NOT established: `VendorExperiences` writes legacy fields to the `experiences` view while its schema exposes different names. Repairing that separate writer must preserve canonical `listings` ownership and this security boundary; expanding permissions is not a remedy.

The captured timestamp trigger is installed unchanged. Emergency containment is separately tested: deny provider UPDATE while retaining the guard, administrator access and strict public admission. It does not restore the known-recursive policy or reopen public drafts.
