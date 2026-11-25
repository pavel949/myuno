\set ON_ERROR_STOP on
-- Fresh disposable PostgreSQL database only, not Supabase/production.
-- Run from this directory with psql -X -d myuno_344_345_test -f isolated_regression.sql.
SELECT current_database() = 'myuno_344_345_test' AS disposable \gset
\if :disposable
\else
  \echo 'Refused: wrong database name'
  \quit 3
\endif
BEGIN;
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN BYPASSRLS;
CREATE SCHEMA auth;
CREATE SCHEMA storage;
CREATE TYPE public.app_role AS ENUM ('admin','uno_team','user');
CREATE TABLE public.user_roles(user_id uuid, role public.app_role);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
CREATE FUNCTION public.has_role(uuid,public.app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS(SELECT 1 FROM user_roles WHERE user_id=$1 AND role=$2) $$;
CREATE TABLE public.providers(id uuid PRIMARY KEY,user_id uuid);
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_provider ON public.providers FOR SELECT USING(user_id=auth.uid());
CREATE TABLE public.gyms(id int PRIMARY KEY,provider_id uuid,is_active boolean,approval_status text);
CREATE TABLE public.legal_services(LIKE public.gyms INCLUDING ALL);
ALTER TABLE public.gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Gyms are viewable by everyone" ON public.gyms FOR SELECT USING(true);
CREATE POLICY "Legal services are viewable by everyone" ON public.legal_services FOR SELECT USING(true);
CREATE POLICY "Anyone can view approved gyms or own content" ON public.gyms FOR SELECT USING(is_active AND approval_status='approved' OR EXISTS(SELECT 1 FROM public.providers p WHERE p.id=gyms.provider_id AND p.user_id=auth.uid()));
CREATE POLICY "Anyone can view approved legal services or own content" ON public.legal_services FOR SELECT USING(is_active AND approval_status='approved' OR EXISTS(SELECT 1 FROM public.providers p WHERE p.id=legal_services.provider_id AND p.user_id=auth.uid()));
CREATE POLICY "Admins can view all gyms" ON public.gyms FOR SELECT USING(public.has_role(auth.uid(),'admin'));
-- Additional permissive policies intentionally simulate drift, including FOR ALL.
CREATE POLICY unexpected_all ON public.gyms FOR ALL TO authenticated USING(true) WITH CHECK(true);
CREATE POLICY unexpected_read ON public.legal_services FOR SELECT USING(true);
CREATE TABLE public.management_companies(id int PRIMARY KEY,paid_slots int,free_slots int);
CREATE TABLE public.mc_property_slots(id int PRIMARY KEY,company_id int,is_active boolean);
CREATE TABLE storage.buckets(id text PRIMARY KEY,public boolean);
CREATE TABLE storage.objects(bucket_id text REFERENCES storage.buckets(id),name text,owner_id text,PRIMARY KEY(bucket_id,name));
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
DO $$DECLARE i record; BEGIN FOR i IN SELECT * FROM (VALUES
('bouquet-images','Public read bouquet-images (no list)'),('company-assets','Public read company-assets (no list)'),('company-logos','Public read company-logos (no list)'),('complex-media','complex_media_public_read'),('experience-images','Public read experience-images (no list)'),('magnet-landings','Public read magnet-landings'),('project-images','Public read project-images (no list)'),('property-care','Public read property-care (no list)'),('property-images','Public read property-images (no list)'),('property-videos','property-videos public read'),('tour-media','Public read tour-media (no list)'),('vendor-uploads','Public read vendor-uploads (no list)'),('yacht-images','Public read yacht-images (no list)')) v(bucket,pol) LOOP
INSERT INTO storage.buckets VALUES(i.bucket,i.bucket<>'vendor-uploads');
EXECUTE format('CREATE POLICY %I ON storage.objects FOR SELECT USING(bucket_id=%L)',i.pol,i.bucket);
END LOOP; END $$;
INSERT INTO storage.buckets VALUES('intake-uploads',true),('unrelated',false);
CREATE POLICY "Public read intake-uploads (no list)" ON storage.objects FOR SELECT USING(bucket_id='intake-uploads');
\ir ../../../drizzle/migrations/0042_enforce_mc_slot_limit_and_close_public_listing.sql
INSERT INTO public.management_companies VALUES(1,1,0);
INSERT INTO public.mc_property_slots VALUES(1,1,true);
CREATE POLICY synthetic_legacy_read ON storage.objects FOR SELECT USING(true);
CREATE POLICY synthetic_owner_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK(owner_id=auth.uid()::text);
CREATE POLICY synthetic_owner_update ON storage.objects FOR UPDATE TO authenticated USING(owner_id=auth.uid()::text) WITH CHECK(owner_id=auth.uid()::text);
CREATE POLICY synthetic_owner_delete ON storage.objects FOR DELETE TO authenticated USING(owner_id=auth.uid()::text);
GRANT USAGE ON SCHEMA auth,storage,public TO anon,authenticated,service_role;
GRANT SELECT ON public.providers,public.gyms,public.legal_services,storage.buckets TO anon,authenticated;
GRANT SELECT ON storage.objects TO anon,authenticated,service_role;
GRANT INSERT,UPDATE,DELETE ON storage.objects TO authenticated;
INSERT INTO public.user_roles VALUES('00000000-0000-0000-0000-000000000003','admin'),('00000000-0000-0000-0000-000000000004','uno_team'),('00000000-0000-0000-0000-000000000005','admin');
INSERT INTO public.providers VALUES('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001'),('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000002');
INSERT INTO public.gyms VALUES(1,'10000000-0000-0000-0000-000000000001',true,'approved'),(2,'10000000-0000-0000-0000-000000000001',true,'pending'),(3,'10000000-0000-0000-0000-000000000002',false,'approved'),(4,'10000000-0000-0000-0000-000000000002',true,'pending');
INSERT INTO public.legal_services SELECT * FROM public.gyms;
INSERT INTO storage.objects SELECT id,'own','00000000-0000-0000-0000-000000000001' FROM storage.buckets;
INSERT INTO storage.objects SELECT id,'other','00000000-0000-0000-0000-000000000002' FROM storage.buckets;
INSERT INTO storage.objects SELECT id,'legacy',NULL FROM storage.buckets;
CREATE FUNCTION public.assert_true(ok boolean,label text) RETURNS void LANGUAGE plpgsql AS $$BEGIN IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'FAIL: %',label; END IF; END$$;
\ir ../../../drizzle/migrations/0043_drop_permissive_select_gyms_legal_services.sql
\ir ../../../drizzle/migrations/0044_restrict_public_bucket_listing.sql
SELECT public.assert_true(NOT EXISTS(SELECT FROM pg_policies WHERE schemaname='storage' AND policyname='Public read property-care (no list)'),'0042 remains closed');
SELECT public.assert_true(EXISTS(SELECT FROM pg_policies WHERE schemaname='storage' AND policyname='Public read vendor-uploads (no list)'),'private bucket preserved');
SELECT public.assert_true((SELECT public FROM storage.buckets WHERE id='intake-uploads'),'intake not silently flipped');
SELECT public.assert_true(EXISTS(SELECT FROM pg_trigger WHERE tgname='trg_enforce_mc_property_slot_limit' AND tgenabled='O'),'0042 trigger preserved');
DO $$BEGIN BEGIN INSERT INTO public.mc_property_slots VALUES(2,1,true); RAISE EXCEPTION 'test slot unexpectedly accepted' USING ERRCODE='XX000'; EXCEPTION WHEN SQLSTATE 'P0001' THEN NULL; END; END$$;
SET LOCAL ROLE anon;
SELECT public.assert_true((SELECT array_agg(id ORDER BY id) FROM public.gyms)=ARRAY[1],'anon gyms only approved');
SELECT public.assert_true((SELECT array_agg(id ORDER BY id) FROM public.legal_services)=ARRAY[1],'anon legal only approved');
SELECT public.assert_true((SELECT count(*) FROM storage.objects WHERE bucket_id NOT IN ('intake-uploads','vendor-uploads','unrelated'))=0,'anon list denied despite extra permissive policy');
RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
SELECT public.assert_true((SELECT array_agg(id ORDER BY id) FROM public.gyms)=ARRAY[1,2],'mapped provider sees own draft');
SELECT public.assert_true((SELECT array_agg(id ORDER BY id) FROM public.legal_services)=ARRAY[1,2],'mapped legal owner');
SELECT public.assert_true((SELECT count(*) FROM storage.objects WHERE bucket_id='property-images')=1,'owner only metadata');
SELECT public.assert_true((SELECT count(*) FROM storage.objects WHERE bucket_id='property-care')=1,'property-care owner read restored narrowly');
INSERT INTO storage.objects VALUES('property-images','new','00000000-0000-0000-0000-000000000001') ON CONFLICT(bucket_id,name) DO UPDATE SET owner_id=excluded.owner_id;
INSERT INTO storage.objects VALUES('property-images','new','00000000-0000-0000-0000-000000000001') ON CONFLICT(bucket_id,name) DO UPDATE SET owner_id=excluded.owner_id;
WITH d AS (DELETE FROM storage.objects WHERE bucket_id='property-images' AND name='other' RETURNING *) SELECT public.assert_true((SELECT count(*) FROM d)=0,'cannot delete another owner');
WITH d AS (DELETE FROM storage.objects WHERE bucket_id='property-images' AND name='new' RETURNING *) SELECT public.assert_true((SELECT count(*) FROM d)=1,'own delete');
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000004',true);
SELECT public.assert_true((SELECT array_agg(id ORDER BY id) FROM public.gyms)=ARRAY[1],'uno_team no global gym drafts');
SELECT public.assert_true((SELECT array_agg(id ORDER BY id) FROM public.legal_services)=ARRAY[1],'uno_team no global legal drafts');
SELECT public.assert_true((SELECT count(*) FROM storage.objects WHERE bucket_id='property-images')=0,'uno_team no global storage');
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',true);
SELECT public.assert_true((SELECT count(*) FROM public.gyms)=4,'admin gyms');
SELECT public.assert_true((SELECT count(*) FROM public.legal_services)=4,'admin legal');
SELECT public.assert_true((SELECT count(*) FROM storage.objects WHERE bucket_id='property-images')=3,'admin sees ownerless too');
RESET ROLE;
-- Separate staged intake model, synthetic data only. A real bucket flag is changed via Storage API, not SQL.
CREATE TABLE public.ai_intake_sessions(id int PRIMARY KEY, admin_id uuid NOT NULL);
ALTER TABLE public.ai_intake_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY synthetic_session_broad ON public.ai_intake_sessions FOR ALL USING(true) WITH CHECK(true);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.ai_intake_sessions TO authenticated;
INSERT INTO public.ai_intake_sessions VALUES(1,'00000000-0000-0000-0000-000000000003'),(2,'00000000-0000-0000-0000-000000000004');
\ir intake-cutover-hold.STAGED-NOT-IN-JOURNAL.sql
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',true);
DO $BEGIN BEGIN INSERT INTO storage.objects VALUES('intake-uploads','during-hold','00000000-0000-0000-0000-000000000003'); RAISE EXCEPTION 'unexpected hold insert success' USING ERRCODE='XX000'; EXCEPTION WHEN insufficient_privilege THEN NULL; END; END$;
RESET ROLE;
UPDATE storage.buckets SET public=false WHERE id='intake-uploads';
\ir intake-private.STAGED-NOT-IN-JOURNAL.sql
DROP POLICY "myuno intake cutover hold insert" ON storage.objects;
DROP POLICY "myuno intake cutover hold update" ON storage.objects;
DROP POLICY "myuno intake cutover hold delete" ON storage.objects;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',true);
INSERT INTO storage.objects VALUES('intake-uploads','00000000-0000-0000-0000-000000000003/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.png','00000000-0000-0000-0000-000000000003');
SELECT public.assert_true((SELECT count(*) FROM storage.objects WHERE bucket_id='intake-uploads')=1,'intake own new key only');
SELECT public.assert_true((SELECT array_agg(id) FROM public.ai_intake_sessions)=ARRAY[1],'admin reads only own intake sessions');
WITH u AS (UPDATE storage.objects SET name='00000000-0000-0000-0000-000000000003/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb.png' WHERE bucket_id='intake-uploads' RETURNING *) SELECT public.assert_true((SELECT count(*) FROM u)=0,'private object immutable');
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000005',true);
SELECT public.assert_true((SELECT count(*) FROM storage.objects WHERE bucket_id='intake-uploads')=0,'other admin cannot read private originals');
SELECT public.assert_true((SELECT count(*) FROM public.ai_intake_sessions)=0,'other admin cannot read private sessions');
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',true);
DO $$BEGIN BEGIN INSERT INTO storage.objects VALUES('intake-uploads','wrong-prefix/file','00000000-0000-0000-0000-000000000003'); RAISE EXCEPTION 'unexpected insert success' USING ERRCODE='XX000'; EXCEPTION WHEN insufficient_privilege THEN NULL; END; END$$;
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
SELECT public.assert_true((SELECT count(*) FROM storage.objects WHERE bucket_id='intake-uploads')=0,'nonadmin cannot read intake');
SELECT public.assert_true((SELECT count(*) FROM public.ai_intake_sessions)=0,'nonadmin cannot read sessions');
DO $$BEGIN BEGIN INSERT INTO storage.objects VALUES('intake-uploads','00000000-0000-0000-0000-000000000001/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.png','00000000-0000-0000-0000-000000000001'); RAISE EXCEPTION 'unexpected insert success' USING ERRCODE='XX000'; EXCEPTION WHEN insufficient_privilege THEN NULL; END; END$$;
RESET ROLE;
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claim.sub','',true);
SELECT public.assert_true((SELECT count(*) FROM storage.objects WHERE bucket_id='intake-uploads')=0,'anon intake denied');
RESET ROLE;
SET LOCAL ROLE service_role;
SELECT public.assert_true((SELECT count(*) FROM storage.objects WHERE bucket_id='intake-uploads')=4,'service role retains controlled access');
RESET ROLE;
ROLLBACK;
\echo 'Synthetic SQL assertions passed; not a Storage HTTP/API test.'
