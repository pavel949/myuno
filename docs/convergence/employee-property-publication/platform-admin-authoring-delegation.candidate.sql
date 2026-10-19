-- SEPARATE SOURCE ACTIVATION ITEM. Not a migration and not approved for activation.
-- Minimal protected platform-admin access for the existing explicit delegation UI.
-- Existing company-admin rules and restrictive Operating Space policies remain.
-- No generic uno_team, DELETE, export, sub-permission or automatic permission grant.
-- This new policy path requires verified Space cutover; existing company-admin
-- policies remain independent. Revocation after cutover rollback is an explicit
-- governed administrator procedure, not a bypass through this new policy.
BEGIN;

CREATE FUNCTION public.actor_can_delegate_property_authoring(p_company_id uuid,p_user_id uuid,p_module text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT public.actor_has_platform_admin()
 AND EXISTS(SELECT 1 FROM public.management_companies c WHERE c.id=p_company_id AND c.operating_spaces_enforced IS TRUE)
 AND p_module IN ('properties','pricing','bookings')
 AND EXISTS(SELECT 1 FROM public.management_company_members m WHERE m.company_id=p_company_id
  AND m.user_id=p_user_id AND m.is_active IS TRUE)
$$;
REVOKE ALL ON FUNCTION public.actor_can_delegate_property_authoring(uuid,uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.actor_can_delegate_property_authoring(uuid,uuid,text) TO authenticated;

CREATE POLICY platform_admin_read_authoring_permissions ON public.team_member_permissions
 FOR SELECT TO authenticated USING(public.actor_can_delegate_property_authoring(company_id,user_id,module));
CREATE POLICY platform_admin_insert_authoring_permissions ON public.team_member_permissions
 FOR INSERT TO authenticated WITH CHECK(
  public.actor_can_delegate_property_authoring(company_id,user_id,module)
  AND granted_by=auth.uid() AND can_export IS FALSE AND coalesce(sub_permissions,'{}'::jsonb)='{}'::jsonb);
CREATE POLICY platform_admin_update_authoring_permissions ON public.team_member_permissions
 FOR UPDATE TO authenticated USING(
  public.actor_can_delegate_property_authoring(company_id,user_id,module)
  AND can_export IS FALSE AND coalesce(sub_permissions,'{}'::jsonb)='{}'::jsonb)
 WITH CHECK(
  public.actor_can_delegate_property_authoring(company_id,user_id,module)
  AND granted_by=auth.uid() AND can_export IS FALSE AND coalesce(sub_permissions,'{}'::jsonb)='{}'::jsonb);
-- Rows carrying export/advanced sub-permissions intentionally cannot be changed
-- through this new platform-admin path. The panel leaves them intact and reports
-- failure; a separately reviewed existing administrator path must resolve them.

COMMIT;
