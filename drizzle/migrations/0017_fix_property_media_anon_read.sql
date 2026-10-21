DROP POLICY IF EXISTS property_media_public_read ON public.property_media;
CREATE POLICY property_media_public_read ON public.property_media FOR SELECT TO anon, authenticated
USING (is_active = true AND public.property_is_public(property_id));