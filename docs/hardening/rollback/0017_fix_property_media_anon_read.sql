-- Rollback for 0017: restore previous property_media public read policy
DROP POLICY IF EXISTS property_media_public_read ON public.property_media;
CREATE POLICY property_media_public_read ON public.property_media FOR SELECT TO public
USING ((is_active = true AND public.property_is_public(property_id)) OR public.can_manage_property(property_id));
