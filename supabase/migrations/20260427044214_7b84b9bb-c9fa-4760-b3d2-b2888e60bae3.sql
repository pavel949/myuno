-- Bucket for complex media (photos imported from Google Drive by AI intake)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'complex-media',
  'complex-media',
  true,
  20971520, -- 20 MB
  ARRAY['image/jpeg','image/png','image/webp','image/gif','image/heic','image/heif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Public read
DROP POLICY IF EXISTS "complex_media_public_read" ON storage.objects;
CREATE POLICY "complex_media_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'complex-media');

-- Authenticated users can upload
DROP POLICY IF EXISTS "complex_media_auth_insert" ON storage.objects;
CREATE POLICY "complex_media_auth_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'complex-media');

-- Authenticated users can update their uploads
DROP POLICY IF EXISTS "complex_media_auth_update" ON storage.objects;
CREATE POLICY "complex_media_auth_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'complex-media');

-- Authenticated users can delete
DROP POLICY IF EXISTS "complex_media_auth_delete" ON storage.objects;
CREATE POLICY "complex_media_auth_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'complex-media');