GRANT SELECT ON public.property_rate_seasons TO anon, authenticated;
CREATE POLICY "Public read active rate seasons of active properties"
ON public.property_rate_seasons FOR SELECT TO anon, authenticated
USING (is_active = true AND EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_rate_seasons.property_id AND p.is_active = true));