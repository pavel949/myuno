-- READ ONLY. Compare these rows to captured fixtures before activation; stop on drift.
SELECT current_database(),current_user,session_user;
SELECT policyname,permissive,roles,cmd,qual,with_check FROM pg_policies WHERE schemaname='public' AND tablename='listings' ORDER BY policyname;
SELECT p.proname,pg_get_function_identity_arguments(p.oid) AS arguments,p.prosecdef,pg_get_userbyid(p.proowner) AS owner,p.proacl,pg_get_functiondef(p.oid) AS definition
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND p.proname IN ('has_role','resolve_life_os_context','count_life_os_context','guard_listing_provider_privileged_update');
SELECT t.tgname,pg_get_triggerdef(t.oid) AS definition,pg_get_functiondef(t.tgfoid) AS function_definition
FROM pg_trigger t WHERE t.tgrelid='public.listings'::regclass AND NOT t.tgisinternal;
SELECT grantee,privilege_type FROM information_schema.role_table_grants WHERE table_schema='public' AND table_name='listings' ORDER BY grantee,privilege_type;
SELECT vertical,count(*) FILTER(WHERE is_active AND (approval_status='approved' OR approval_status IS NULL)) AS legacy_public,
 count(*) FILTER(WHERE is_active AND approval_status='approved' AND attributes->>'status'='published' AND lower(btrim(coalesce(attributes->>'operating_status',''))) NOT IN ('closed','temporarily_closed','permanently_closed')) AS strict_experience_public
FROM public.listings GROUP BY vertical ORDER BY vertical;

SELECT c.relname,c.relkind,c.reloptions,c.relrowsecurity,c.relforcerowsecurity,pg_get_userbyid(c.relowner) AS owner
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relname IN ('listings','providers','user_roles','experiences','tours','life_os_catalog');
SELECT policyname,tablename,permissive,roles,cmd,qual,with_check FROM pg_policies WHERE schemaname='public' AND tablename IN ('providers','user_roles') ORDER BY tablename,policyname;
SELECT grantee,column_name,privilege_type FROM information_schema.column_privileges WHERE table_schema='public' AND table_name='listings' ORDER BY grantee,column_name,privilege_type;

SELECT rolname,rolsuper,rolbypassrls,rolinherit FROM pg_roles WHERE rolname IN ('anon','authenticated','service_role');
