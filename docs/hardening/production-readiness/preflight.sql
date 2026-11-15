-- Read-only release evidence. Run against the identified myuno database only.
-- This is NOT an activation script. Retain results with the release SHA.
SELECT current_database(),version(),now();
SELECT p.oid::regprocedure AS signature,md5(pg_get_functiondef(p.oid)) AS definition_md5,
 p.prosecdef AS security_definer,p.proacl AS grants
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public'
 AND p.proname IN ('create_order_atomic','create_order_checked','guard_customer_order_update',
 'record_ledger_entries','property_booking_holds_inventory','actor_has_platform_admin',
 'actor_can_operate_property','create_managed_property_booking_checked','private_property_payment_recipient',
 'settle_stripe_order_checked','create_manual_property_request_atomic','can_confirm_manual_receipt',
 'confirm_manual_receipt_checked','confirm_manual_payment_atomic') ORDER BY p.oid::regprocedure::text;
SELECT c.relname,t.tgname,pg_get_triggerdef(t.oid) AS definition FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname IN ('orders','order_items','manual_payment_requests') AND NOT t.tgisinternal ORDER BY c.relname,t.tgname;
SELECT tablename,policyname,cmd,roles,permissive,qual,with_check FROM pg_policies
WHERE (schemaname='public' AND tablename IN ('orders','order_items','payment_intents','ledger_entries','manual_payment_requests'))
 OR (schemaname='storage' AND tablename='objects' AND (qual LIKE '%manual_payment_proofs%' OR with_check LIKE '%manual_payment_proofs%'))
ORDER BY tablename,policyname;
SELECT grantee,table_name,privilege_type FROM information_schema.role_table_grants
WHERE table_schema='public' AND grantee IN ('anon','authenticated') AND table_name IN
 ('orders','order_items','order_participants','order_addresses','payment_intents','ledger_entries','manual_payment_requests')
ORDER BY table_name,grantee,privilege_type;
SELECT t.typname,e.enumlabel FROM pg_type t JOIN pg_enum e ON e.enumtypid=t.oid
WHERE t.typname IN ('order_status','payment_method') ORDER BY t.typname,e.enumsortorder;
SELECT id,public,file_size_limit,allowed_mime_types FROM storage.buckets WHERE id='manual_payment_proofs';
SELECT count(*) AS duplicate_manual_references FROM (
 SELECT provider_ref FROM public.payment_intents WHERE provider_ref LIKE 'manual:%' GROUP BY provider_ref HAVING count(*)>1
) duplicates;
SELECT count(*) AS duplicate_manual_proofs FROM (
 SELECT metadata->>'proof_file_path' FROM public.payment_intents
 WHERE metadata->>'verified_receipt_source'='manual_admin_v1'
 GROUP BY metadata->>'proof_file_path' HAVING count(*)>1
) duplicates;
SELECT status,currency,count(*) AS receipt_count FROM public.payment_intents
WHERE status::text='succeeded' AND coalesce(metadata->>'verified_receipt_source','') NOT IN ('manual_admin_v1','stripe_signed_v1')
GROUP BY status,currency;
SELECT count(*) AS property_orders_without_recipient FROM public.orders
WHERE deleted_at IS NULL AND vertical='property' AND provider_org_id IS NULL;
SELECT count(*) AS properties_without_verified_recipient FROM public.properties p
WHERE p.is_active AND NOT EXISTS(SELECT 1 FROM public.provider_org_links l JOIN public.orgs o ON o.id=l.org_id AND o.is_active WHERE l.provider_id=p.provider_id);
SELECT count(*) AS overlapping_active_property_tariffs FROM public.property_rate_seasons a
JOIN public.property_rate_seasons b ON a.id<b.id AND a.property_id=b.property_id
 AND daterange(a.start_date,a.end_date,'[]') && daterange(b.start_date,b.end_date,'[]')
WHERE a.is_active AND b.is_active;
-- Compare public base-table names/primary keys to scripts/lib/snapshot-inventory.json.
SELECT c.relname AS table_name,array_agg(a.attname ORDER BY k.ordinality) FILTER(WHERE a.attname IS NOT NULL) AS primary_key
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
LEFT JOIN pg_index i ON i.indrelid=c.oid AND i.indisprimary
LEFT JOIN LATERAL unnest(i.indkey) WITH ORDINALITY k(attnum,ordinality) ON true
LEFT JOIN pg_attribute a ON a.attrelid=c.oid AND a.attnum=k.attnum
WHERE n.nspname='public' AND c.relkind IN ('r','p') GROUP BY c.relname ORDER BY c.relname;
