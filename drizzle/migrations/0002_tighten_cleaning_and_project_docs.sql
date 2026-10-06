DROP POLICY IF EXISTS "Cleaning services are viewable by everyone" ON public.cleaning_services;
DROP POLICY IF EXISTS "Authenticated can read kyc project files" ON storage.objects;
CREATE POLICY "Signed-in can read public files of approved projects" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'project-documents' AND EXISTS (
    SELECT 1 FROM public.project_documents pd
    JOIN public.property_projects pp ON pp.id = pd.project_id
    WHERE (pd.project_id)::text = (storage.foldername(objects.name))[1]
      AND pd.is_current = true AND pd.visibility = 'public'
      AND COALESCE(pp.is_approved, false) = true
      AND pd.file_url LIKE ('%' || objects.name)
      AND auth.uid() IS NOT NULL
  )
);