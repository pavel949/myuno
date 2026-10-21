
-- 1. company-logos: path-based ownership
DROP POLICY IF EXISTS "Users can update own logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload logos" ON storage.objects;

CREATE POLICY "company_logos_owner_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'company-logos'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

CREATE POLICY "company_logos_owner_update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'company-logos'
  AND (storage.foldername(name))[1] = (auth.uid())::text
)
WITH CHECK (
  bucket_id = 'company-logos'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

CREATE POLICY "company_logos_owner_delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'company-logos'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

-- 2. complex-media: restrict write/delete to admin/staff/uno_team (bucket is managed server-side)
DROP POLICY IF EXISTS "complex_media_auth_insert" ON storage.objects;
DROP POLICY IF EXISTS "complex_media_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "complex_media_auth_delete" ON storage.objects;

CREATE POLICY "complex_media_admin_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'complex-media'
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'staff'::app_role)
    OR public.has_role(auth.uid(), 'uno_team'::app_role)
  )
);

CREATE POLICY "complex_media_admin_update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'complex-media'
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'staff'::app_role)
    OR public.has_role(auth.uid(), 'uno_team'::app_role)
  )
);

CREATE POLICY "complex_media_admin_delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'complex-media'
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'staff'::app_role)
    OR public.has_role(auth.uid(), 'uno_team'::app_role)
  )
);

-- 3. system_config: restrict reads to admins (contains API keys like GOOGLE_MAPS_API_KEY)
DROP POLICY IF EXISTS "Authenticated users can read system_config" ON public.system_config;

CREATE POLICY "Admins can read system_config"
ON public.system_config FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 4. realtime.messages: remove permissive broadcast policies
DROP POLICY IF EXISTS "Authenticated can receive broadcasts" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated can send broadcasts" ON realtime.messages;
