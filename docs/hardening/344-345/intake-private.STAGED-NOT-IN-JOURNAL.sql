-- NOT A REGISTERED MIGRATION. Do not run before client/Edge and historical references are migrated.
-- Proposed contract: protected platform admin plus own new UUID-prefixed objects;
-- legacy ownerless files need an independently authorized server-side migration.
-- First freeze direct writes using the separate staged hold; flip public=false via Storage API, then install final policies. Never make public again as rollback.
DO $patch$
DECLARE operation text; predicate text;
BEGIN
  IF NOT EXISTS(SELECT 1 FROM storage.buckets WHERE id='intake-uploads' AND public IS FALSE) THEN RAISE EXCEPTION 'intake bucket must already be private'; END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_class WHERE oid='storage.objects'::regclass AND relrowsecurity) THEN RAISE EXCEPTION 'storage RLS disabled'; END IF;
  DROP POLICY IF EXISTS "Intake files are publicly readable" ON storage.objects;
  DROP POLICY IF EXISTS "Public read intake-uploads (no list)" ON storage.objects;
  DROP POLICY IF EXISTS "Owner or admin read intake-uploads" ON storage.objects;
  DROP POLICY IF EXISTS "Admins can upload intake files" ON storage.objects;
  DROP POLICY IF EXISTS "Admins can delete intake files" ON storage.objects;
  -- All direct authenticated reads/writes confined to actor-owned UUID-prefixed keys.
  predicate := $p$CASE WHEN current_user='authenticated' AND (SELECT auth.uid()) IS NOT NULL THEN
    public.has_role((SELECT auth.uid()),'admin'::public.app_role) AND
    owner_id=(SELECT auth.uid()::text) AND split_part(name,'/',1)=(SELECT auth.uid()::text)
    ELSE false END$p$;
  FOR operation IN SELECT unnest(ARRAY['SELECT','INSERT','UPDATE','DELETE']) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects','myuno intake ceiling '||lower(operation));
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects','myuno intake own '||lower(operation));
    IF operation='INSERT' THEN
      EXECUTE format('CREATE POLICY %I ON storage.objects AS RESTRICTIVE FOR INSERT TO public WITH CHECK (bucket_id IS DISTINCT FROM %L OR (%s))','myuno intake ceiling insert','intake-uploads',predicate);
      EXECUTE format('CREATE POLICY %I ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id=%L AND (%s))','myuno intake own insert','intake-uploads',predicate);
    ELSIF operation='UPDATE' THEN
      -- No direct updates even for admin; new key instead of upsert. Bound both old/new rows.
      EXECUTE 'CREATE POLICY "myuno intake ceiling update" ON storage.objects AS RESTRICTIVE FOR UPDATE TO public USING (bucket_id IS DISTINCT FROM ''intake-uploads'') WITH CHECK (bucket_id IS DISTINCT FROM ''intake-uploads'')';
    ELSE
      EXECUTE format('CREATE POLICY %I ON storage.objects AS RESTRICTIVE FOR %s TO public USING (bucket_id IS DISTINCT FROM %L OR (%s))','myuno intake ceiling '||lower(operation),operation,'intake-uploads',predicate);
      EXECUTE format('CREATE POLICY %I ON storage.objects FOR %s TO authenticated USING (bucket_id=%L AND (%s))','myuno intake own '||lower(operation),operation,'intake-uploads',predicate);
    END IF;
  END LOOP;
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE oid='public.ai_intake_sessions'::regclass AND relrowsecurity) THEN
    RAISE EXCEPTION 'intake session RLS missing';
  END IF;
  DROP POLICY IF EXISTS "myuno intake session ceiling" ON public.ai_intake_sessions;
  CREATE POLICY "myuno intake session ceiling" ON public.ai_intake_sessions AS RESTRICTIVE FOR ALL TO public
    USING (CASE WHEN current_user='authenticated' THEN admin_id=(SELECT auth.uid()) AND public.has_role((SELECT auth.uid()),'admin'::public.app_role) ELSE false END)
    WITH CHECK (CASE WHEN current_user='authenticated' THEN admin_id=(SELECT auth.uid()) AND public.has_role((SELECT auth.uid()),'admin'::public.app_role) ELSE false END);
  DROP POLICY IF EXISTS "myuno intake own session" ON public.ai_intake_sessions;
  CREATE POLICY "myuno intake own session" ON public.ai_intake_sessions FOR ALL TO authenticated
    USING (admin_id=(SELECT auth.uid()) AND public.has_role((SELECT auth.uid()),'admin'::public.app_role))
    WITH CHECK (admin_id=(SELECT auth.uid()) AND public.has_role((SELECT auth.uid()),'admin'::public.app_role));
  -- Keep the cutover hold until the operator verifies this candidate and explicitly removes it.
END
$patch$;
-- SQL alone does not make public URLs private. Do not use UPDATE storage.objects,
-- do not delete real files, do not make the bucket public as a rollback.
