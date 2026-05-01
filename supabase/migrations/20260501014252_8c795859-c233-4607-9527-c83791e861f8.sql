-- ============================================================
-- 1. ClearView Due Diligence: remove always-true OR branches
-- ============================================================
DROP POLICY IF EXISTS "Public can read published DD summary" ON public.due_diligence_reports;

CREATE POLICY "Paid users can read published DD reports"
ON public.due_diligence_reports
FOR SELECT
TO authenticated
USING (
  is_published = true
  AND public.user_has_clearview_access(project_id)
);

-- Allow staff/admin full read
CREATE POLICY "Staff can read all DD reports"
ON public.due_diligence_reports
FOR SELECT
TO authenticated
USING (public.is_admin_or_uno_team());

-- ============================================================
-- 2. contact_identities: restrict to owner + staff
-- ============================================================
DROP POLICY IF EXISTS "identities readable by authenticated" ON public.contact_identities;

CREATE POLICY "Users read own identity"
ON public.contact_identities
FOR SELECT
TO authenticated
USING (primary_user_id = auth.uid());

CREATE POLICY "Staff read all identities"
ON public.contact_identities
FOR SELECT
TO authenticated
USING (public.is_admin_or_uno_team());

-- ============================================================
-- 3. contact_identity_links: restrict to owner + staff
-- ============================================================
DROP POLICY IF EXISTS "identity links readable by authenticated" ON public.contact_identity_links;

-- Determine ownership via the parent identity
CREATE POLICY "Users read own identity links"
ON public.contact_identity_links
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.contact_identities ci
    WHERE ci.id = contact_identity_links.identity_id
      AND ci.primary_user_id = auth.uid()
  )
);

CREATE POLICY "Staff read all identity links"
ON public.contact_identity_links
FOR SELECT
TO authenticated
USING (public.is_admin_or_uno_team());

-- ============================================================
-- 4. system_settings: restrict reads to staff/admin
-- ============================================================
DROP POLICY IF EXISTS "system_settings_authenticated_read" ON public.system_settings;

CREATE POLICY "system_settings_admin_read"
ON public.system_settings
FOR SELECT
TO authenticated
USING (public.is_admin_or_uno_team());

-- ============================================================
-- 5. Storage: crm-documents bucket — scope SELECT to company members
-- ============================================================
DROP POLICY IF EXISTS "Company members can view crm docs" ON storage.objects;

CREATE POLICY "Company members can view crm docs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'crm-documents'
  AND (storage.foldername(name))[1] IN (
    SELECT company_id::text
    FROM public.management_company_members
    WHERE user_id = auth.uid()
      AND is_active = true
  )
);

-- ============================================================
-- 6. Storage: mc-backups bucket — scope SELECT to company members
-- ============================================================
DROP POLICY IF EXISTS "MC members can read own backups" ON storage.objects;

CREATE POLICY "MC members can read own backups"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'mc-backups'
  AND (storage.foldername(name))[1] IN (
    SELECT company_id::text
    FROM public.management_company_members
    WHERE user_id = auth.uid()
      AND is_active = true
  )
);

-- ============================================================
-- 7. v_clearview_public view: enforce caller's RLS, not creator's
-- ============================================================
ALTER VIEW public.v_clearview_public SET (security_invoker = on);