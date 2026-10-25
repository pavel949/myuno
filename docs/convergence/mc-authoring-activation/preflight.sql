-- Read-only metadata only. No user/property records or permission assignments.
SELECT p.proname,pg_get_function_identity_arguments(p.oid) arguments,
 p.prosecdef,pg_get_functiondef(p.oid) definition,p.proacl
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND p.proname IN (
 'actor_has_platform_admin','mc_can_access_e28_private','actor_can_operate_property',
 'actor_private_property_ceiling','actor_is_operating_company_overseer',
 'create_managed_property_checked','actor_can_notify_property_submission',
 'is_mc_member_for_property','notify_vendor_on_content_status_change',
 'fn_auto_expense_on_task_done','log_task_activity') ORDER BY p.proname;

SELECT tablename,policyname,permissive,roles,cmd,qual,with_check FROM pg_policies
WHERE schemaname='public' AND tablename IN ('properties','property_complexes',
 'property_operational_tasks','property_documents','inventory_inspections',
 'owner_portal_settings','portal_messages','property_activity_log','admin_audit_logs')
ORDER BY tablename,policyname;

SELECT tgrelid::regclass::text table_name,tgname,pg_get_triggerdef(oid) definition
FROM pg_trigger WHERE NOT tgisinternal AND tgrelid IN ('public.properties'::regclass,
 'public.property_complexes'::regclass,'public.property_operational_tasks'::regclass)
ORDER BY table_name,tgname;

SELECT table_name,column_name,data_type,is_nullable,column_default
FROM information_schema.columns WHERE table_schema='public' AND table_name IN (
 'properties','property_complexes','operating_spaces','operating_space_properties',
 'operating_space_members','property_operational_tasks') ORDER BY table_name,ordinal_position;

SELECT conrelid::regclass::text table_name,conname,pg_get_constraintdef(oid) definition
FROM pg_constraint WHERE conrelid IN ('public.properties'::regclass,
 'public.property_complexes'::regclass,'public.project_units'::regclass,
 'public.operating_spaces'::regclass,'public.operating_space_properties'::regclass)
ORDER BY table_name,conname;

SELECT c.relname,c.relrowsecurity,c.relforcerowsecurity,c.reloptions
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relname IN ('properties','property_complexes',
 'property_operational_tasks','public_property_catalog','public_complex_catalog');

SELECT grantee,table_name,privilege_type FROM information_schema.role_table_grants
WHERE table_schema='public' AND grantee IN ('anon','authenticated') AND table_name IN (
 'properties','property_complexes','public_property_catalog','property_operational_tasks','admin_audit_logs')
ORDER BY table_name,grantee,privilege_type;

SELECT table_name,is_updatable,is_insertable_into,check_option
FROM information_schema.views WHERE table_schema='public' AND table_name='public_property_catalog';
