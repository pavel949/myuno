-- Security-preserving rollback for E2.6: disables new user-callable RPCs and public projection grants.
-- Restrictive ceilings stay in place (removing them would restore known bypasses). They are transparent
-- while operating_spaces_enforced=false. To fully remove, drop policies only after enforcement is confirmed off everywhere.
REVOKE EXECUTE ON FUNCTION public.create_managed_property_checked(uuid,uuid,text,text,text,text),
 public.reassign_property_operating_space(uuid,uuid,text) FROM authenticated, PUBLIC;
REVOKE SELECT ON public.public_property_catalog FROM anon, authenticated;
