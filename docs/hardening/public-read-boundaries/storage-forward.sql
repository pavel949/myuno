-- Review-only Class C candidate. Exact observed 12 broad policies, not all public buckets.
BEGIN;
LOCK TABLE storage.objects IN SHARE ROW EXCLUSIVE MODE;
DO $storage_review$
DECLARE item record; expected_qual text;
BEGIN
  IF NOT pg_catalog.has_function_privilege('authenticated','public.actor_has_active_platform_admin()','EXECUTE')
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='storage' AND table_name='objects' AND column_name='owner_id' AND data_type='text')
  THEN RAISE EXCEPTION 'Storage owner/admin contract changed'; END IF;

  -- Verify all predecessors before making any policy change. All statements
  -- execute in one transaction, so a drift error rolls back the package.
  FOR item IN SELECT * FROM (VALUES
    ('bouquet-images', 'Public read bouquet-images (no list)', true),
    ('company-assets', 'Public read company-assets (no list)', true),
    ('company-logos', 'Public read company-logos (no list)', true),
    ('complex-media', 'complex_media_public_read', false),
    ('experience-images', 'Public read experience-images (no list)', true),
    ('magnet-landings', 'Public read magnet-landings', false),
    ('project-images', 'Public read project-images (no list)', true),
    ('property-images', 'Public read property-images (no list)', true),
    ('property-videos', 'property-videos public read', false),
    ('tour-media', 'Public read tour-media (no list)', true),
    ('vendor-uploads', 'Public read vendor-uploads (no list)', true),
    ('yacht-images', 'Public read yacht-images (no list)', true)
  ) AS t(bucket_id, policy_name, has_name_test)
  LOOP
    expected_qual := CASE WHEN item.has_name_test
      THEN pg_catalog.format('((bucket_id = %L::text) AND (name IS NOT NULL))',item.bucket_id)
      ELSE pg_catalog.format('(bucket_id = %L::text)',item.bucket_id) END;
    IF NOT EXISTS (SELECT 1 FROM storage.buckets b WHERE b.id=item.bucket_id AND b.public IS TRUE)
       OR NOT EXISTS (SELECT 1 FROM pg_catalog.pg_policies p
          WHERE p.schemaname='storage' AND p.tablename='objects' AND p.policyname=item.policy_name
            AND p.cmd='SELECT' AND p.permissive='PERMISSIVE' AND p.roles=ARRAY['public']::name[] AND p.qual=expected_qual)
       OR EXISTS (SELECT 1 FROM pg_catalog.pg_policies p WHERE p.schemaname='storage' AND p.tablename='objects'
          AND p.policyname='Owner or active admin read '||item.bucket_id)
    THEN RAISE EXCEPTION 'Storage policy/bucket drift for %; stop and review',item.bucket_id; END IF;
    EXECUTE pg_catalog.format(
      'CREATE POLICY %I ON storage.objects FOR SELECT TO authenticated USING (bucket_id = %L AND (owner_id = (SELECT auth.uid()::text) OR (SELECT public.actor_has_active_platform_admin()) IS TRUE))',
      'Owner or active admin read '||item.bucket_id,item.bucket_id);
    EXECUTE pg_catalog.format('DROP POLICY %I ON storage.objects',item.policy_name);
  END LOOP;
END;
$storage_review$;
COMMIT;
