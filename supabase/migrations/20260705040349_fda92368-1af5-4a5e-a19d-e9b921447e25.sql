-- 1. Remove the overly permissive read policy
DROP POLICY IF EXISTS "Authenticated can read project document files" ON storage.objects;

-- 2. Public documents of approved projects — visible to everyone (anon + authenticated),
--    but only when a matching current project_documents row exists with visibility='public'
--    and the parent property_project is approved.
CREATE POLICY "Public can read approved public project files"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'project-documents'
  AND EXISTS (
    SELECT 1
    FROM public.project_documents pd
    JOIN public.property_projects pp ON pp.id = pd.project_id
    WHERE (pd.project_id)::text = (storage.foldername(objects.name))[1]
      AND pd.is_current = true
      AND pd.visibility = 'public'
      AND COALESCE(pp.is_approved, false) = true
      AND pd.file_url LIKE '%' || objects.name
  )
);

-- 3. KYC-tier documents — visible only to authenticated users, and only when a matching
--    current project_documents row exists with visibility in ('public','kyc').
--    Private-visibility files remain unreachable except through the admin/developer ALL policies.
CREATE POLICY "Authenticated can read kyc project files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'project-documents'
  AND EXISTS (
    SELECT 1
    FROM public.project_documents pd
    WHERE (pd.project_id)::text = (storage.foldername(objects.name))[1]
      AND pd.is_current = true
      AND pd.visibility IN ('public', 'kyc')
      AND pd.file_url LIKE '%' || objects.name
  )
);