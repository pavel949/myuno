
REVOKE EXECUTE ON FUNCTION public.can_manage_property(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_manage_property(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.property_is_public(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.property_is_public(uuid) TO anon, authenticated, service_role;
