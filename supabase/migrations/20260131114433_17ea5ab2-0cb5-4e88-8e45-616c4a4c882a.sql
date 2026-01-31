-- Create storage bucket for intake file uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'intake-uploads',
  'intake-uploads',
  true,
  20971520, -- 20MB
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
    'application/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated admins to upload files
CREATE POLICY "Admins can upload intake files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'intake-uploads'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_type::text IN ('admin', 'super_admin')
  )
);

-- Allow public read access for processing
CREATE POLICY "Intake files are publicly readable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'intake-uploads');

-- Allow admins to delete intake files
CREATE POLICY "Admins can delete intake files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'intake-uploads'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_type::text IN ('admin', 'super_admin')
  )
);