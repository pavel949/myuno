-- 0043 (DRAFT, not applied): stop anonymous listing of public storage buckets.
--
-- Migration 20260418162702 tried to block listing with "name IS NOT NULL", but every
-- real object has a name, so the condition is always true and listing stayed open.
-- Files in a PUBLIC bucket are served by their public URL without any SELECT policy on
-- storage.objects; the policy only enables listing and API reads. So for buckets that
-- are public in the live database the broad policy is replaced by one that lets a
-- signed-in user read their own objects (needed for upsert and delete) and
-- administrators read all. Anonymous users keep working public URLs but can no longer
-- list or enumerate files.
--
-- Buckets that are missing or not public in the live database are skipped, so a private
-- bucket can never lose the only policy that lets its reader in.

DO $$
DECLARE
  item record;
  replacement text;
BEGIN
  FOR item IN
    SELECT * FROM (VALUES
      ('bouquet-images', 'Public read bouquet-images (no list)'),
      ('company-assets', 'Public read company-assets (no list)'),
      ('company-logos', 'Public read company-logos (no list)'),
      ('complex-media', 'complex_media_public_read'),
      ('experience-images', 'Public read experience-images (no list)'),
      ('intake-uploads', 'Public read intake-uploads (no list)'),
      ('magnet-landings', 'Public read magnet-landings'),
      ('project-images', 'Public read project-images (no list)'),
      ('property-care', 'Public read property-care (no list)'),
      ('property-images', 'Public read property-images (no list)'),
      ('property-videos', 'property-videos public read'),
      ('tour-media', 'Public read tour-media (no list)'),
      ('vendor-uploads', 'Public read vendor-uploads (no list)'),
      ('yacht-images', 'Public read yacht-images (no list)')
    ) AS t(bucket_id, policy_name)
  LOOP
    IF EXISTS (SELECT 1 FROM storage.buckets b WHERE b.id = item.bucket_id AND b.public IS TRUE)
       AND EXISTS (SELECT 1 FROM pg_policies p WHERE p.schemaname = 'storage' AND p.tablename = 'objects'
                   AND p.policyname = item.policy_name) THEN
      replacement := 'Owner or admin read ' || item.bucket_id;
      EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', replacement);
      EXECUTE format(
        'CREATE POLICY %I ON storage.objects FOR SELECT TO authenticated USING (bucket_id = %L AND (owner_id = (SELECT auth.uid()::text) OR public.has_role((SELECT auth.uid()), %L::public.app_role)))',
        replacement, item.bucket_id, 'admin');
      EXECUTE format('DROP POLICY %I ON storage.objects', item.policy_name);
    ELSE
      RAISE NOTICE 'skipped %: bucket is missing or not public, or the policy is absent', item.bucket_id;
    END IF;
  END LOOP;
END $$;
