-- Disable setup RPCs without deleting configured spaces, assignments or grants.
-- Existing RLS/enforcement and prior checked operations are preserved.
REVOKE ALL ON FUNCTION public.get_operating_space_setup(uuid),public.save_operating_space_checked(uuid,uuid,text,text,text,boolean),
 public.delete_operating_space_checked(uuid,uuid),public.set_operating_space_member_checked(uuid,uuid,uuid,boolean),
 public.assign_operating_space_properties_checked(uuid,uuid,uuid[],text) FROM authenticated,service_role,PUBLIC,anon;
REVOKE ALL ON FUNCTION private.require_operating_space_setup_overseer(uuid,boolean) FROM authenticated,service_role,PUBLIC,anon;
-- Do not restore the old single-property family-splitting implementation.
-- Disable the adapter until a compatible checked version is restored.
REVOKE ALL ON FUNCTION public.reassign_property_operating_space(uuid,uuid,text) FROM authenticated,service_role,PUBLIC,anon;
