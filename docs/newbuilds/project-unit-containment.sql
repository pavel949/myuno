-- READ-ONLY REVIEW INVENTORY; not a migration and not applied by this task.
-- Initial April 16 broad policies were removed by later source migrations.
-- Lovable read-only review found three live scoped project_units policies.
-- Do not infer policy effect from one historical migration or NULL with_check alone.
-- No blanket privilege revocation is proposed without positive/negative actor tests.
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'project_units'
ORDER BY policyname;

SELECT grantee, privilege_type, is_grantable
FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND table_name = 'project_units'
  AND grantee IN ('anon', 'authenticated')
ORDER BY grantee, privilege_type;
-- Broad table grants coexist with scoped RLS for row operations. TRUNCATE is not
-- constrained by RLS and warrants separate privilege review; API exploitability
-- has not been demonstrated. Never execute TRUNCATE to test this in production.
-- Preserve request-only edge containment until checked writer/actor tests pass.
