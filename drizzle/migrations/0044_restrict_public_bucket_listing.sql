-- CANDIDATE ONLY. Excludes intake-uploads, which needs a separate private cutover.
-- Do not apply before upload/replace/delete matrix passes. No bucket flag changes.
DO $patch$
DECLARE item record; replacement text; flag boolean;
BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_class WHERE oid='storage.objects'::regclass AND relrowsecurity) THEN
    RAISE EXCEPTION 'storage.objects RLS disabled';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='storage' AND table_name='objects' AND column_name='owner_id' AND data_type='text') THEN
    RAISE EXCEPTION 'unexpected storage owner_id schema';
  END IF;
  IF to_regprocedure('public.has_role(uuid,public.app_role)') IS NULL THEN RAISE EXCEPTION 'missing role helper'; END IF;
  FOR item IN SELECT * FROM (VALUES
    ('bouquet-images','Public read bouquet-images (no list)'),
    ('company-assets','Public read company-assets (no list)'),
    ('company-logos','Public read company-logos (no list)'),
    ('complex-media','complex_media_public_read'),
    ('experience-images','Public read experience-images (no list)'),
    ('magnet-landings','Public read magnet-landings'),
    ('project-images','Public read project-images (no list)'),
    ('property-care','Public read property-care (no list)'),
    ('property-images','Public read property-images (no list)'),
    ('property-videos','property-videos public read'),
    ('tour-media','Public read tour-media (no list)'),
    ('vendor-uploads','Public read vendor-uploads (no list)'),
    ('yacht-images','Public read yacht-images (no list)')
  ) AS v(bucket,old_policy) LOOP
    SELECT b.public INTO flag FROM storage.buckets b WHERE b.id=item.bucket;
    IF NOT FOUND THEN RAISE EXCEPTION 'missing expected bucket %; review inventory',item.bucket; END IF;
    IF flag IS DISTINCT FROM true THEN RAISE NOTICE 'private bucket % unchanged; record explicit disposition before GO',item.bucket; CONTINUE; END IF;
    -- main 0042 already drops property-care's old policy; never restore it.
    IF item.bucket <> 'property-care' AND NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname=item.old_policy AND cmd='SELECT') THEN
      RAISE EXCEPTION 'unexpected missing SELECT policy %; inspect drift',item.old_policy;
    END IF;
    replacement := 'Owner or admin read ' || item.bucket;
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects',replacement);
    EXECUTE format($q$CREATE POLICY %I ON storage.objects FOR SELECT TO authenticated USING (bucket_id=%L AND (owner_id=(SELECT auth.uid()::text) OR public.has_role((SELECT auth.uid()),'admin'::public.app_role)))$q$,replacement,item.bucket);
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects',item.old_policy);
    -- Per-bucket restrictive ceilings prevent another permissive SELECT/ALL policy
    -- from reopening listing. Other buckets are untouched by this ceiling.
    replacement := 'myuno select ceiling ' || item.bucket;
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects',replacement);
    EXECUTE format($q$CREATE POLICY %I ON storage.objects AS RESTRICTIVE FOR SELECT TO public USING (
      bucket_id IS DISTINCT FROM %L OR CASE WHEN current_user='authenticated' AND (SELECT auth.uid()) IS NOT NULL THEN
        owner_id=(SELECT auth.uid()::text) OR public.has_role((SELECT auth.uid()),'admin'::public.app_role)
      ELSE false END)$q$,replacement,item.bucket);
  END LOOP;
END
$patch$;
-- Owner/admin SELECT does not grant UPDATE or DELETE; original write policies remain.
-- Ownerless and cross-employee replacements are intentionally denied unless existing
-- independently scoped rights are designed/tested. Prefer fresh object keys.
