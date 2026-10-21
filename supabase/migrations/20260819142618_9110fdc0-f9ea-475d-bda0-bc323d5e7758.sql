DROP POLICY IF EXISTS "Authenticated users can upload company assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update own company assets" ON storage.objects;

CREATE POLICY "Company assets upload scoped to own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'company-assets'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.management_company_members m
      WHERE m.user_id = auth.uid()
        AND m.company_id::text = (storage.foldername(name))[1]
    )
  )
);

CREATE POLICY "Company assets update scoped to own folder"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'company-assets'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.management_company_members m
      WHERE m.user_id = auth.uid()
        AND m.company_id::text = (storage.foldername(name))[1]
    )
  )
)
WITH CHECK (
  bucket_id = 'company-assets'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.management_company_members m
      WHERE m.user_id = auth.uid()
        AND m.company_id::text = (storage.foldername(name))[1]
    )
  )
);