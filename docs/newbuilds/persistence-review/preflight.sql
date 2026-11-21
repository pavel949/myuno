-- READ ONLY inventory for a separately authorized target. No source URLs, locators,
-- content, policy expressions, function definitions, secrets or business identifiers.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;

WITH expected(relname) AS (VALUES
  ('developers'), ('property_projects'), ('properties'), ('project_units'),
  ('project_drive_sources'), ('drive_import_jobs'), ('project_price_list_versions'),
  ('project_price_list_items'), ('project_fact_assertions'), ('project_documents'),
  ('property_price_offers'), ('payment_schedules'))
SELECT e.relname, c.oid IS NOT NULL AS present, c.relrowsecurity AS rls_enabled,
       c.relforcerowsecurity AS rls_forced,
       (SELECT count(*) FROM pg_catalog.pg_policy p WHERE p.polrelid = c.oid) AS policy_count
FROM expected e
LEFT JOIN pg_catalog.pg_namespace n ON n.nspname = 'public'
LEFT JOIN pg_catalog.pg_class c ON c.relname = e.relname AND c.relnamespace = n.oid
ORDER BY e.relname;

SELECT c.relname, a.attname, pg_catalog.format_type(a.atttypid, a.atttypmod) AS sql_type,
       a.attnotnull AS not_null
FROM pg_catalog.pg_attribute a
JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND a.attnum > 0 AND NOT a.attisdropped
  AND c.relname IN ('project_drive_sources','drive_import_jobs','project_price_list_versions',
                    'project_price_list_items','project_fact_assertions','project_documents','project_units')
ORDER BY c.relname, a.attnum;

SELECT c.relname, con.conname, con.contype, con.convalidated,
       target.relname AS referenced_relation
FROM pg_catalog.pg_constraint con
JOIN pg_catalog.pg_class c ON c.oid = con.conrelid
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_catalog.pg_class target ON target.oid = con.confrelid
WHERE n.nspname = 'public'
  AND c.relname IN ('project_drive_sources','drive_import_jobs','project_price_list_versions',
                    'project_price_list_items','project_fact_assertions','project_units','properties')
ORDER BY c.relname, con.conname;

SELECT p.proname, pg_catalog.pg_get_function_identity_arguments(p.oid) AS arguments,
       p.prosecdef AS security_definer,
       COALESCE((SELECT bool_or(acl.grantee = 0 AND acl.privilege_type = 'EXECUTE')
         FROM pg_catalog.aclexplode(COALESCE(p.proacl, pg_catalog.acldefault('f', p.proowner))) acl), false) AS public_execute
FROM pg_catalog.pg_proc p
JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'stage_drive_import_version'
ORDER BY arguments;

-- Aggregates only: verify bridge cleanliness without returning identifiers.
SELECT count(*) AS sales_rows,
       count(*) FILTER (WHERE u.property_id IS NULL) AS unlinked,
       count(*) FILTER (WHERE u.property_id IS NOT NULL AND p.id IS NULL) AS missing_physical,
       count(*) FILTER (WHERE p.id IS NOT NULL AND p.project_id IS DISTINCT FROM u.project_id) AS conflicting_project
FROM public.project_units u
LEFT JOIN public.properties p ON p.id = u.property_id;

ROLLBACK;
