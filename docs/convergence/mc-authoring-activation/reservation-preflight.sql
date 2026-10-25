-- Read-only evidence collection. Run only on an explicitly selected/authorized
-- target. Never log guest data, credentials or service keys.
BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY;
SELECT current_setting('transaction_read_only') AS transaction_read_only;
SELECT current_database() AS database_name, current_setting('server_version') AS postgres_version;
SELECT n.nspname,p.proname,pg_get_function_identity_arguments(p.oid) AS args,
       md5(pg_get_functiondef(p.oid)) AS definition_md5,p.prosecdef,p.proconfig,p.proacl,md5(p.prosrc) AS body_md5
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname IN ('public','pms_commands') AND p.proname IN
 ('create_order_atomic','trg_sync_order_to_property_booking','trg_sync_order_item_to_property_booking',
  'guard_customer_order_update','actor_can_operate_property','actor_has_platform_admin',
  'create_property_reservation_checked','change_property_booking','property_checkout_allowed_checked',
 'create_financial_from_booking','create_property_booking_from_order','guard_orders_protected_columns','trg_release_availability_on_order_cancel')
ORDER BY n.nspname,p.proname,args;
SELECT table_schema,table_name,column_name,data_type,udt_name,is_nullable
FROM information_schema.columns
WHERE table_schema='public' AND table_name IN
 ('orders','order_items','order_participants','order_status_history','properties','property_bookings',
  'property_availability','payment_intents','manual_payment_requests','ledger_entries','property_financials')
ORDER BY table_name,ordinal_position;
SELECT c.relname,t.tgname,pg_get_triggerdef(t.oid) AS definition
FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND NOT t.tgisinternal AND c.relname IN
 ('orders','order_items','order_participants','order_status_history','property_bookings',
  'property_availability','payment_intents','manual_payment_requests','ledger_entries','property_financials');
SELECT * FROM pg_policies WHERE schemaname='public' AND tablename IN
 ('orders','order_items','order_participants','property_bookings','manual_payment_requests');
-- Catalogue metadata only; no business rows, provider sessions or journal SQL.
SELECT DISTINCT n.nspname AS enum_schema,t.typname AS enum_name,e.enumsortorder,e.enumlabel
FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace cn ON cn.oid=c.relnamespace
JOIN pg_type t ON t.oid=a.atttypid JOIN pg_namespace n ON n.oid=t.typnamespace JOIN pg_enum e ON e.enumtypid=t.oid
WHERE cn.nspname='public' AND c.relname IN ('orders','order_items','order_participants','order_status_history','properties','property_bookings','property_availability','payment_intents','manual_payment_requests','ledger_entries','property_financials','manual_booking_receipts','legacy_unpaid_reconciliation')
ORDER BY enum_schema,enum_name,e.enumsortorder;
SELECT n.nspname AS table_schema,c.relname AS table_name,con.conname,con.contype,
 con.convalidated,pg_get_constraintdef(con.oid,true) AS constraint_definition
FROM pg_constraint con JOIN pg_class c ON c.oid=con.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname IN ('public','pms_commands') AND c.relname IN ('orders','order_items','order_participants','order_status_history','properties','property_bookings','property_availability','payment_intents','manual_payment_requests','ledger_entries','property_financials','manual_booking_receipts','legacy_unpaid_reconciliation')
ORDER BY table_schema,table_name,con.conname;
SELECT schemaname,tablename,indexname,indexdef FROM pg_indexes
WHERE schemaname IN ('public','pms_commands') AND tablename IN ('orders','order_items','order_participants','order_status_history','properties','property_bookings','property_availability','payment_intents','manual_payment_requests','ledger_entries','property_financials','manual_booking_receipts','legacy_unpaid_reconciliation')
ORDER BY schemaname,tablename,indexname;
SELECT n.nspname AS table_schema,c.relname AS table_name,pg_get_userbyid(c.relowner) AS table_owner,
 c.relacl,c.relrowsecurity,c.relforcerowsecurity
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname IN ('public','pms_commands') AND c.relname IN ('orders','order_items','order_participants','order_status_history','properties','property_bookings','property_availability','payment_intents','manual_payment_requests','ledger_entries','property_financials','manual_booking_receipts','legacy_unpaid_reconciliation') AND c.relkind IN ('r','p')
ORDER BY table_schema,table_name;
-- Missing journals are explicit NULL; unreadable journals fail rather than claim
-- empty/applied. Select only migration identities, never stored SQL statements.
SELECT to_regclass('drizzle.__drizzle_migrations') AS drizzle_journal,
 CASE WHEN to_regclass('drizzle.__drizzle_migrations') IS NOT NULL THEN
 query_to_xml('SELECT to_jsonb(j)->>''id'' AS id,to_jsonb(j)->>''hash'' AS hash,to_jsonb(j)->>''created_at'' AS created_at FROM drizzle.__drizzle_migrations j ORDER BY to_jsonb(j)->>''id''',true,false,'')::text END AS drizzle_journal_rows,
 to_regclass('supabase_migrations.schema_migrations') AS supabase_journal,
 CASE WHEN to_regclass('supabase_migrations.schema_migrations') IS NOT NULL THEN
 query_to_xml('SELECT to_jsonb(j)->>''version'' AS version,to_jsonb(j)->>''name'' AS name FROM supabase_migrations.schema_migrations j ORDER BY to_jsonb(j)->>''version''',true,false,'')::text END AS supabase_journal_rows;
-- Historical eligibility is NOT inferred from these tables being empty.
-- Separately reconcile external provider sessions/attempts and bind the approved
-- manifest to exact order/property/hold/revision with evidence digest and reviewer.
-- No manifest import or production mutation is authorized by this read-only file.
-- Review deployment configuration separately: exposed Data API schemas must not
-- include pms_commands. Review all import/calendar/ledger writers for compatibility.
ROLLBACK;
