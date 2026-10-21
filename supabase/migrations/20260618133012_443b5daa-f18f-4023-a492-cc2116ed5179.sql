GRANT SELECT ON public.system_config TO anon;
GRANT SELECT ON public.system_config TO authenticated;
GRANT ALL ON public.system_config TO service_role;

DROP POLICY IF EXISTS "Public can read Google Maps browser key" ON public.system_config;

CREATE POLICY "Public can read Google Maps browser key"
ON public.system_config
FOR SELECT
TO anon, authenticated
USING (key = 'GOOGLE_MAPS_API_KEY');