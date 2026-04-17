-- Storage policies for the developer-documents bucket (private, scoped per developer).
-- Path convention: <developer_id>/<project_id>/<filename>

CREATE POLICY "Developer team can read own documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'developer-documents'
  AND EXISTS (
    SELECT 1 FROM public.developers d
    WHERE d.id::text = (storage.foldername(name))[1]
      AND d.user_id = auth.uid()
  )
);

CREATE POLICY "Developer team can upload own documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'developer-documents'
  AND EXISTS (
    SELECT 1 FROM public.developers d
    WHERE d.id::text = (storage.foldername(name))[1]
      AND d.user_id = auth.uid()
  )
);

CREATE POLICY "Developer team can update own documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'developer-documents'
  AND EXISTS (
    SELECT 1 FROM public.developers d
    WHERE d.id::text = (storage.foldername(name))[1]
      AND d.user_id = auth.uid()
  )
);

CREATE POLICY "Developer team can delete own documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'developer-documents'
  AND EXISTS (
    SELECT 1 FROM public.developers d
    WHERE d.id::text = (storage.foldername(name))[1]
      AND d.user_id = auth.uid()
  )
);

-- Admins/brokers see everything
CREATE POLICY "Admins can read all developer documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'developer-documents'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);
