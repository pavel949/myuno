DROP POLICY IF EXISTS "Anyone can read provider org links" ON public.provider_org_links;
REVOKE SELECT ON public.provider_org_links FROM anon;
GRANT SELECT ON public.provider_org_links TO authenticated;
CREATE POLICY "Signed-in users read links of bookable providers"
ON public.provider_org_links FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.providers p
  WHERE p.id = provider_org_links.provider_id
    AND p.is_active = true
    AND p.approval_status = 'approved'
    AND COALESCE(p.is_demo, false) = false
));