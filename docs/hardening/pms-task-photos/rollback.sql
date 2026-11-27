-- Leave task evidence and private files in place for preservation and controlled recovery.
BEGIN;
DROP POLICY IF EXISTS pms_task_photo_insert ON storage.objects;
DROP POLICY IF EXISTS pms_task_photo_read ON storage.objects;
DROP POLICY IF EXISTS pms_task_photo_rollback_ceiling ON storage.objects;
CREATE POLICY pms_task_photo_rollback_ceiling ON storage.objects AS RESTRICTIVE FOR ALL TO authenticated, anon
USING (bucket_id IS DISTINCT FROM 'myuno-pms-task-photos')
WITH CHECK (bucket_id IS DISTINCT FROM 'myuno-pms-task-photos');
COMMIT;
