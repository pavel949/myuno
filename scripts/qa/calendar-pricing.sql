-- Isolated PostgreSQL fixture ONLY. Run in a fresh local test database.
\set ON_ERROR_STOP on
CREATE SCHEMA auth;
DO $$ BEGIN CREATE ROLE anon; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE authenticated; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('test.actor',true),'')::uuid $$;
CREATE TABLE properties(id uuid primary key,owner_id uuid,currency text);
CREATE FUNCTION can_manage_property_e28_private(p uuid) RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT EXISTS(SELECT 1 FROM properties WHERE id=p AND owner_id=auth.uid()) $$;
CREATE FUNCTION actor_private_property_ceiling(p uuid) RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT can_manage_property_e28_private(p) AND current_setting('test.scope_denied',true) IS DISTINCT FROM 'true' $$;
CREATE TABLE property_room_categories(id uuid primary key,property_id uuid);
CREATE TABLE property_availability(property_id uuid,date date,price_override numeric,status text,booking_id uuid,min_nights_override int, UNIQUE(property_id,date));
CREATE TABLE property_stay_restrictions(property_id uuid,category_id uuid,date date,price_override numeric,min_stay_nights int,closed_to_arrival boolean not null default false,closed_to_departure boolean not null default false,stop_sell boolean not null default false);
CREATE UNIQUE INDEX restrictions_unique ON property_stay_restrictions(property_id,coalesce(category_id,'00000000-0000-0000-0000-000000000000'::uuid),date);
CREATE TABLE property_activity_log(property_id uuid,actor_id uuid,actor_role text,action text,entity_type text,entity_id uuid,details jsonb);
GRANT USAGE ON SCHEMA public,auth TO authenticated;
GRANT SELECT,INSERT,UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_property ON properties TO authenticated USING(owner_id=auth.uid()) WITH CHECK(owner_id=auth.uid());
ALTER TABLE property_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_prices ON property_availability TO authenticated USING(can_manage_property_e28_private(property_id)) WITH CHECK(can_manage_property_e28_private(property_id));
\ir ../../supabase/migrations/20261021062539_canonical_pricing_calendar.sql
INSERT INTO properties VALUES ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002','THB');
INSERT INTO property_room_categories VALUES ('00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000001');
INSERT INTO property_availability VALUES ('00000000-0000-0000-0000-000000000001','2026-10-21',100,'blocked','00000000-0000-0000-0000-000000000004',3);
SET ROLE authenticated;
SET test.actor='00000000-0000-0000-0000-000000000002';
SELECT set_property_calendar_price('00000000-0000-0000-0000-000000000001',NULL,'2026-10-21','2026-10-23',2500.50,'THB','{"2026-10-21":{"price":100,"minimum":3,"status":"blocked","booking":"00000000-0000-0000-0000-000000000004"}}');
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM property_availability WHERE date='2026-10-21' AND status='blocked' AND booking_id='00000000-0000-0000-0000-000000000004' AND min_nights_override=3 AND price_override=2500.50) THEN RAISE EXCEPTION 'Occupancy changed'; END IF;
 IF (SELECT count(*) FROM property_availability)<>2 THEN RAISE EXCEPTION 'Half-open range violated'; END IF;
 BEGIN
 PERFORM set_property_calendar_price('00000000-0000-0000-0000-000000000001',NULL,'2026-10-21','2026-10-22',99,'THB','{}');
 RAISE EXCEPTION 'Stale snapshot accepted';
 EXCEPTION WHEN serialization_failure THEN NULL; END;
 BEGIN
 PERFORM set_property_calendar_price('00000000-0000-0000-0000-000000000001',NULL,'2026-10-23','2026-10-24',99,'USD','{}');
 RAISE EXCEPTION 'Currency mismatch accepted';
 EXCEPTION WHEN serialization_failure THEN NULL; END;
END $$;
SELECT set_property_calendar_price('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000003','2026-10-21','2026-10-22',800,'THB','{}');
SET test.scope_denied='true';
DO $$ BEGIN
 BEGIN
 PERFORM set_property_calendar_price('00000000-0000-0000-0000-000000000001',NULL,'2026-10-23','2026-10-24',99,'THB','{}');
 RAISE EXCEPTION 'Scope ceiling bypassed';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SET test.scope_denied='false';
SET test.actor='00000000-0000-0000-0000-000000000005';
DO $$ BEGIN
 BEGIN
 PERFORM set_property_calendar_price('00000000-0000-0000-0000-000000000001',NULL,'2026-10-23','2026-10-24',99,'THB','{}');
 RAISE EXCEPTION 'Unauthorized actor accepted';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
DO $$ BEGIN
 IF (SELECT count(*) FROM property_activity_log)<>2 THEN RAISE EXCEPTION 'Audit missing or failed write committed'; END IF;
END $$;
