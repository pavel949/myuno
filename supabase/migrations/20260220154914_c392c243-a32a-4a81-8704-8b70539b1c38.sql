
-- =====================================================
-- FIX: Tighten storage policies for project-images and bouquet-images
-- =====================================================

-- 1. project-images: Replace permissive INSERT with admin-only
DROP POLICY IF EXISTS "Authenticated users can upload project images" ON storage.objects;

CREATE POLICY "Admins can upload project images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'project-images'
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'uno_team')
  )
);

-- 2. bouquet-images: Fix the mislabeled "admin" policy that allows any user
DROP POLICY IF EXISTS "Admins can upload bouquet images" ON storage.objects;

CREATE POLICY "Admins can upload bouquet images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'bouquet-images'
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'uno_team')
  )
);

-- 3. bouquet-images: Fix service upload policy that has no auth check
DROP POLICY IF EXISTS "Service upload bouquet images" ON storage.objects;
-- Service role uploads are handled by edge functions using service_role key,
-- which bypasses RLS entirely — no policy needed.
