-- E2.8 follow-up: SELECT-only metadata/aggregate evidence. No actor emulation,
-- business payloads, handler calls, writes, migrations or setting changes.
-- pg_get_functiondef requires prokind='f' (aggregates must be excluded).
SELECT count(*) AS policies FROM pg_policies;
SELECT count(*) FILTER (WHERE p.prokind='f') AS ordinary_public_functions,
count(*) AS all_public_pg_proc_entries FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public';
SELECT p.proname,p.prokind FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.prokind<>'f' ORDER BY p.proname;

SELECT schemaname,tablename,policyname,roles,cmd,qual,with_check
FROM pg_policies WHERE schemaname IN ('public','storage')
AND concat_ws(' ',qual,with_check) ~ '(uno_team''|is_admin_or_uno_team\(\)|is_company_admin\(|is_finance_staff\(|is_team_member\(|mc_can_access\(|staff_can_access_property\(|can_manage_property\(|user_has_clearview_access\(|is_mcc_admin\()'
ORDER BY schemaname,tablename,policyname;

SELECT p.proname,pg_get_function_identity_arguments(p.oid) AS arguments,
md5(pg_get_functiondef(p.oid)) AS definition_md5,p.prosecdef,
has_function_privilege('authenticated',p.oid,'EXECUTE') AS authenticated_execute,
has_function_privilege('anon',p.oid,'EXECUTE') AS anon_execute,
pg_get_functiondef(p.oid) AS definition
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND p.prokind='f'
AND pg_get_functiondef(p.oid) ~ '(uno_team|is_admin_or_uno_team\(\)|is_company_admin\(|is_finance_staff\(|is_team_member\(|mc_can_access\(|staff_can_access_property\(|can_manage_property\(|user_has_clearview_access\(|is_mcc_admin\()'
ORDER BY p.proname;

SELECT n.nspname,c.relname,p.polname,p.polpermissive,p.polcmd,
pg_get_expr(p.polqual,p.polrelid) AS qual,pg_get_expr(p.polwithcheck,p.polrelid) AS with_check
FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE (n.nspname='public' AND c.relname IN ('providers','salons','listings','experience_media','experience_pricing','vendor_locations','team_member_permissions','uno_team_permissions','management_companies'))
OR (n.nspname='storage' AND p.polname LIKE '%backup%')
ORDER BY c.relname,p.polname;

SELECT c.relname,a.attname,
has_column_privilege('anon',c.oid,a.attname,'SELECT') AS anon_select,
has_column_privilege('authenticated',c.oid,a.attname,'SELECT') AS authenticated_select
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace JOIN pg_attribute a ON a.attrelid=c.oid
WHERE n.nspname='public' AND a.attnum>0 AND NOT a.attisdropped
AND ((c.relname='providers' AND a.attname IN ('commission_rate','total_earnings','pending_payout','email','phone','approval_status'))
OR (c.relname IN ('salons','listings') AND a.attname IN ('rejection_reason','reviewed_by','approval_status')))
ORDER BY c.relname,a.attnum;

SELECT p.proname,pg_get_function_identity_arguments(p.oid) AS arguments
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND p.prokind='f' AND pg_get_functiondef(p.oid) LIKE '%sub_permissions%';

SELECT p.proname,pg_get_function_identity_arguments(p.oid) AS arguments
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND p.proname LIKE '%convert%lead%';

SELECT tg.tgname,pg_get_triggerdef(tg.oid) AS definition
FROM pg_trigger tg JOIN pg_class c ON c.oid=tg.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relname IN ('team_member_permissions','uno_team_permissions') AND NOT tg.tgisinternal;

SELECT jsonb_build_object('at',now(),'companies',(SELECT count(*) FROM public.management_companies),
'enforced',(SELECT count(*) FROM public.management_companies WHERE operating_spaces_enforced IS TRUE),
'spaces',(SELECT count(*) FROM public.operating_spaces),'assignments',(SELECT count(*) FROM public.operating_space_properties),
'members',(SELECT count(*) FROM public.operating_space_members),'catalog',(SELECT count(*) FROM public.public_property_catalog),
'properties',(SELECT count(*) FROM public.properties),'bookings',(SELECT count(*) FROM public.property_bookings),
'orders',(SELECT count(*) FROM public.orders),'ledger',(SELECT count(*) FROM public.ledger_entries),
'contacts',(SELECT count(*) FROM public.crm_contacts),'company_members',(SELECT count(*) FROM public.management_company_members));

SELECT count(*) AS catalog_rows,count(DISTINCT id) AS unique_ids,
count(*) FILTER (WHERE is_active IS NOT TRUE OR approval_status IS DISTINCT FROM 'approved') AS non_active_or_non_approved
FROM public.public_property_catalog;