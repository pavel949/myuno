-- NOT A MIGRATION. Explicit approval and isolated verification required.
-- Freeze direct client mutations before changing a public bucket flag.
CREATE POLICY "myuno intake cutover hold insert" ON storage.objects AS RESTRICTIVE FOR INSERT TO public
  WITH CHECK (bucket_id IS DISTINCT FROM 'intake-uploads');
CREATE POLICY "myuno intake cutover hold update" ON storage.objects AS RESTRICTIVE FOR UPDATE TO public
  USING (bucket_id IS DISTINCT FROM 'intake-uploads') WITH CHECK (bucket_id IS DISTINCT FROM 'intake-uploads');
CREATE POLICY "myuno intake cutover hold delete" ON storage.objects AS RESTRICTIVE FOR DELETE TO public
  USING (bucket_id IS DISTINCT FROM 'intake-uploads');
-- Release ONLY after private flag, new policies, compatible Edge/client, and staged HTTP acceptance:
-- DROP POLICY "myuno intake cutover hold insert" ON storage.objects;
-- DROP POLICY "myuno intake cutover hold update" ON storage.objects;
-- DROP POLICY "myuno intake cutover hold delete" ON storage.objects;
