-- Apply in an isolated PostgreSQL/Supabase database and confirm the task policies first.
BEGIN;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('myuno-pms-task-photos', 'myuno-pms-task-photos', false, 8388608, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Fail closed if an installation has registered this name with different access or file limits.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets
    WHERE id = 'myuno-pms-task-photos' AND NOT public AND file_size_limit = 8388608
      AND allowed_mime_types @> ARRAY['image/jpeg','image/png','image/webp']
      AND allowed_mime_types <@ ARRAY['image/jpeg','image/png','image/webp']
  ) THEN
    RAISE EXCEPTION 'Unexpected PMS photo bucket settings';
  END IF;
END $$;

DROP POLICY IF EXISTS pms_task_photo_read ON storage.objects;
CREATE POLICY pms_task_photo_read ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'myuno-pms-task-photos'
  AND cardinality(storage.foldername(name)) = 2
  AND EXISTS (
    SELECT 1 FROM public.property_operational_tasks AS task
    WHERE task.id::text = (storage.foldername(storage.objects.name))[1]
      AND (
        (storage.foldername(storage.objects.name))[2] = auth.uid()::text
        OR storage.objects.name = ANY(task.photo_proof)
      )
  )
);

DROP POLICY IF EXISTS pms_task_photo_insert ON storage.objects;
CREATE POLICY pms_task_photo_insert ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'myuno-pms-task-photos'
  AND cardinality(storage.foldername(name)) = 2
  AND (storage.foldername(name))[2] = auth.uid()::text
  AND storage.filename(name) ~ '^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}[.](jpg|png|webp)$'
  AND EXISTS (
    SELECT 1 FROM public.property_operational_tasks AS task
    WHERE task.id::text = (storage.foldername(storage.objects.name))[1]
      AND task.assigned_to = auth.uid()
      AND task.status IN ('pending','in_progress')
  )
);

-- Keep older permissive Storage policies from granting access to this bucket.
DROP POLICY IF EXISTS pms_task_photo_rollback_ceiling ON storage.objects;
DROP POLICY IF EXISTS pms_task_photo_anon_ceiling ON storage.objects;
CREATE POLICY pms_task_photo_anon_ceiling ON storage.objects AS RESTRICTIVE FOR ALL TO anon
USING (bucket_id IS DISTINCT FROM 'myuno-pms-task-photos')
WITH CHECK (bucket_id IS DISTINCT FROM 'myuno-pms-task-photos');

DROP POLICY IF EXISTS pms_task_photo_read_ceiling ON storage.objects;
CREATE POLICY pms_task_photo_read_ceiling ON storage.objects AS RESTRICTIVE FOR SELECT TO authenticated
USING (bucket_id IS DISTINCT FROM 'myuno-pms-task-photos' OR (
  auth.uid() IS NOT NULL AND cardinality(storage.foldername(name)) = 2
  AND EXISTS (
    SELECT 1 FROM public.property_operational_tasks AS task
    WHERE task.id::text = (storage.foldername(storage.objects.name))[1]
      AND (
        (storage.foldername(storage.objects.name))[2] = auth.uid()::text
        OR storage.objects.name = ANY(task.photo_proof)
      )
  )
));

DROP POLICY IF EXISTS pms_task_photo_insert_ceiling ON storage.objects;
CREATE POLICY pms_task_photo_insert_ceiling ON storage.objects AS RESTRICTIVE FOR INSERT TO authenticated
WITH CHECK (bucket_id IS DISTINCT FROM 'myuno-pms-task-photos' OR (
  auth.uid() IS NOT NULL AND cardinality(storage.foldername(name)) = 2
  AND (storage.foldername(name))[2] = auth.uid()::text
  AND storage.filename(name) ~ '^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}[.](jpg|png|webp)$'
  AND EXISTS (
    SELECT 1 FROM public.property_operational_tasks AS task
    WHERE task.id::text = (storage.foldername(storage.objects.name))[1]
      AND task.assigned_to = auth.uid()
      AND task.status IN ('pending','in_progress')
  )
));

DROP POLICY IF EXISTS pms_task_photo_update_ceiling ON storage.objects;
CREATE POLICY pms_task_photo_update_ceiling ON storage.objects AS RESTRICTIVE FOR UPDATE TO authenticated
USING (bucket_id IS DISTINCT FROM 'myuno-pms-task-photos')
WITH CHECK (bucket_id IS DISTINCT FROM 'myuno-pms-task-photos');

DROP POLICY IF EXISTS pms_task_photo_delete_ceiling ON storage.objects;
CREATE POLICY pms_task_photo_delete_ceiling ON storage.objects AS RESTRICTIVE FOR DELETE TO authenticated
USING (bucket_id IS DISTINCT FROM 'myuno-pms-task-photos');

COMMIT;
