-- Rollback for 0007: restores public read of provider_org_links (re-opens the security finding).
DROP POLICY IF EXISTS "Signed-in users read links of bookable providers" ON public.provider_org_links;
GRANT SELECT ON public.provider_org_links TO anon;
CREATE POLICY "Anyone can read provider org links" ON public.provider_org_links FOR SELECT USING (true);
