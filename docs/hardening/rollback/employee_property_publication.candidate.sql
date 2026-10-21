-- SOURCE CANDIDATE ONLY. Execute only after explicit governed rollout/rollback approval.
-- Freeze the new checked workflow; retain restrictive row guards and all audit data.
BEGIN;
REVOKE EXECUTE ON FUNCTION public.read_managed_property_draft_checked(uuid),
 public.list_managed_property_drafts_checked(uuid,integer,integer),
 public.list_managed_property_authoring_spaces_checked(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.save_managed_property_draft_checked(uuid,timestamptz,jsonb,boolean) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.review_property_submission_checked(uuid,timestamptz,text,text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.create_managed_property_checked(uuid,uuid,text,text,text,text) FROM authenticated;
-- Narrow notification authority back to the previous owner/admin-only contract.
CREATE OR REPLACE FUNCTION public.actor_can_notify_property_submission(p_property_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS(SELECT 1 FROM public.properties p
 WHERE p.id=p_property_id AND p.approval_status='pending' AND p.deleted_at IS NULL
 AND (p.owner_id=auth.uid() OR public.actor_has_platform_admin()))
$$;
REVOKE ALL ON FUNCTION public.actor_can_notify_property_submission(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.actor_can_notify_property_submission(uuid) TO authenticated,service_role;
-- Roll back only the separately approved platform-admin policy addition, if applied.
DROP POLICY IF EXISTS platform_admin_read_authoring_permissions ON public.team_member_permissions;
DROP POLICY IF EXISTS platform_admin_insert_authoring_permissions ON public.team_member_permissions;
DROP POLICY IF EXISTS platform_admin_update_authoring_permissions ON public.team_member_permissions;
-- Keep content_author_user_id, all draft rows, logs and pre-existing permissions.
-- Retain restrictive task and operational membership ceilings on the four surviving
-- tables: property_documents, inventory_inspections, owner_portal_settings, portal_messages.
-- property_meters was dropped by 20260419023055_eaf755ab-bdb3-4aea-a340-19543b31a835;
-- neither forward activation nor rollback recreates or targets that obsolete table.
-- No manager assignments were created. Do not restore legacy publisher EXECUTE,
-- drop restrictive guards, or infer authority to delete/alter user data.
COMMIT;
