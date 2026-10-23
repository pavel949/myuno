-- Read-only evidence collection. Run only on an explicitly selected/authorized
-- target. Never log guest data, credentials or service keys.
BEGIN READ ONLY;
SELECT current_database() AS database_name, current_setting('server_version') AS postgres_version;
SELECT n.nspname,p.proname,pg_get_function_identity_arguments(p.oid) AS args,
       md5(pg_get_functiondef(p.oid)) AS definition_md5,p.prosecdef,p.proconfig,p.proacl
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname IN ('public','pms_commands') AND p.proname IN
 ('create_order_atomic','trg_sync_order_to_property_booking','trg_sync_order_item_to_property_booking',
  'guard_customer_order_update','actor_can_operate_property','actor_has_platform_admin',
  'create_property_reservation_checked','change_property_booking','property_checkout_allowed_checked');
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
SELECT to_regclass('drizzle.__drizzle_migrations') AS drizzle_journal,
       to_regclass('supabase_migrations.schema_migrations') AS supabase_journal;
-- Historical eligibility is NOT inferred from these tables being empty.
-- Separately reconcile external provider sessions/attempts and bind the approved
-- manifest to exact order/property/hold/revision with evidence digest and reviewer.
-- No manifest import or production mutation is authorized by this read-only file.
-- Review deployment configuration separately: exposed Data API schemas must not
-- include pms_commands. Review all import/calendar/ledger writers for compatibility.
ROLLBACK;
