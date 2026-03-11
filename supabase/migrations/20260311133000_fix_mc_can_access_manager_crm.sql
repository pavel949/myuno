-- Ensure MC managers are not blocked by CRM module RLS.
-- Root cause: mc_can_access() granted full access only to director/admin.
-- Contacts page and deal insert/update failed for manager accounts.

CREATE OR REPLACE FUNCTION public.mc_can_access(
  _user_id uuid,
  _company_id uuid,
  _module text,
  _action text DEFAULT 'view'
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- Managers need the same baseline access as director/admin in MC CRM.
    SELECT 1 FROM management_company_members
    WHERE user_id = _user_id
      AND company_id = _company_id
      AND role IN ('director', 'admin', 'manager')
      AND is_active = true
  )
  OR EXISTS (
    -- Other members: check module permissions matrix.
    SELECT 1 FROM management_company_members mcm
    JOIN team_member_permissions tmp ON tmp.user_id = mcm.user_id AND tmp.company_id = mcm.company_id
    WHERE mcm.user_id = _user_id
      AND mcm.company_id = _company_id
      AND mcm.is_active = true
      AND tmp.module = _module
      AND CASE _action
            WHEN 'view' THEN tmp.can_view
            WHEN 'edit' THEN tmp.can_edit
            WHEN 'export' THEN tmp.can_export
            ELSE false
          END
  )
  OR EXISTS (
    -- Platform admins always pass.
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'uno_team')
  );
$$;
