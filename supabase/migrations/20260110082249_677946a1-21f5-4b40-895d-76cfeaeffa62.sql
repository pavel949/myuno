-- Create storage bucket for vendor uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vendor-uploads',
  'vendor-uploads',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Vendors can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vendor-uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own files
CREATE POLICY "Vendors can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'vendor-uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Vendors can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'vendor-uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to all vendor uploads
CREATE POLICY "Public read access for vendor uploads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'vendor-uploads');