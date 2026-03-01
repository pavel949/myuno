
-- ============================================================
-- PHASE 3: mc_can_access() + module-level RLS for CRM tables
-- ============================================================

-- 3.1 Create mc_can_access helper function
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
    -- Directors and company admins have full access
    SELECT 1 FROM management_company_members
    WHERE user_id = _user_id
      AND company_id = _company_id
      AND role IN ('director', 'admin')
      AND is_active = true
  )
  OR EXISTS (
    -- Other members: check team_member_permissions
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
  OR (
    -- Platform admins always pass
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = _user_id AND role IN ('admin', 'uno_team')
    )
  );
$$;

-- 3.2 Update CRM contacts policies with module access
DROP POLICY IF EXISTS "Company members can view contacts" ON crm_contacts;
CREATE POLICY "Company members can view contacts" ON crm_contacts
  FOR SELECT TO authenticated
  USING (
    mc_can_access(auth.uid(), company_id, 'crm', 'view')
  );

DROP POLICY IF EXISTS "Company members can insert contacts" ON crm_contacts;
CREATE POLICY "Company members can insert contacts" ON crm_contacts
  FOR INSERT TO authenticated
  WITH CHECK (
    mc_can_access(auth.uid(), company_id, 'crm', 'edit')
  );

DROP POLICY IF EXISTS "Company members can update contacts" ON crm_contacts;
CREATE POLICY "Company members can update contacts" ON crm_contacts
  FOR UPDATE TO authenticated
  USING (
    mc_can_access(auth.uid(), company_id, 'crm', 'edit')
  );

DROP POLICY IF EXISTS "Company admins can delete contacts" ON crm_contacts;
CREATE POLICY "Company admins can delete contacts" ON crm_contacts
  FOR DELETE TO authenticated
  USING (
    is_admin_or_uno_team()
    OR EXISTS (
      SELECT 1 FROM management_company_members
      WHERE company_id = crm_contacts.company_id
        AND user_id = auth.uid()
        AND role IN ('director', 'admin', 'manager')
        AND is_active = true
    )
  );

-- 3.3 CRM companies
DROP POLICY IF EXISTS "crm_companies_select" ON crm_companies;
CREATE POLICY "crm_companies_select" ON crm_companies
  FOR SELECT TO authenticated
  USING (mc_can_access(auth.uid(), company_id, 'crm', 'view'));

DROP POLICY IF EXISTS "crm_companies_insert" ON crm_companies;
CREATE POLICY "crm_companies_insert" ON crm_companies
  FOR INSERT TO authenticated
  WITH CHECK (mc_can_access(auth.uid(), company_id, 'crm', 'edit'));

DROP POLICY IF EXISTS "crm_companies_update" ON crm_companies;
CREATE POLICY "crm_companies_update" ON crm_companies
  FOR UPDATE TO authenticated
  USING (mc_can_access(auth.uid(), company_id, 'crm', 'edit'));

DROP POLICY IF EXISTS "crm_companies_delete" ON crm_companies;
CREATE POLICY "crm_companies_delete" ON crm_companies
  FOR DELETE TO authenticated
  USING (
    is_admin_or_uno_team()
    OR EXISTS (
      SELECT 1 FROM management_company_members
      WHERE company_id = crm_companies.company_id
        AND user_id = auth.uid()
        AND role IN ('director', 'manager')
        AND is_active = true
    )
  );

-- 3.4 CRM contact notes — module access via contact's company
DROP POLICY IF EXISTS "Company members can view contact notes" ON crm_contact_notes;
CREATE POLICY "Company members can view contact notes" ON crm_contact_notes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM crm_contacts c
      WHERE c.id = crm_contact_notes.contact_id
        AND mc_can_access(auth.uid(), c.company_id, 'crm', 'view')
    )
  );

DROP POLICY IF EXISTS "Company members can insert contact notes" ON crm_contact_notes;
CREATE POLICY "Company members can insert contact notes" ON crm_contact_notes
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM crm_contacts c
      WHERE c.id = crm_contact_notes.contact_id
        AND mc_can_access(auth.uid(), c.company_id, 'crm', 'edit')
    )
  );

-- 3.5 Agent deals — module access via company
DROP POLICY IF EXISTS "Company members can view deals" ON agent_deals;
CREATE POLICY "Company members can view deals" ON agent_deals
  FOR SELECT TO authenticated
  USING (mc_can_access(auth.uid(), company_id, 'crm', 'view'));

DROP POLICY IF EXISTS "Company members can insert deals" ON agent_deals;
CREATE POLICY "Company members can insert deals" ON agent_deals
  FOR INSERT TO authenticated
  WITH CHECK (mc_can_access(auth.uid(), company_id, 'crm', 'edit'));

DROP POLICY IF EXISTS "Company members can update deals" ON agent_deals;
CREATE POLICY "Company members can update deals" ON agent_deals
  FOR UPDATE TO authenticated
  USING (mc_can_access(auth.uid(), company_id, 'crm', 'edit'));

-- Keep delete restricted to owners/admins
DROP POLICY IF EXISTS "Company owner/admin can delete deals" ON agent_deals;
CREATE POLICY "Company owner/admin can delete deals" ON agent_deals
  FOR DELETE TO authenticated
  USING (
    is_admin_or_uno_team()
    OR EXISTS (
      SELECT 1 FROM management_company_members
      WHERE company_id = agent_deals.company_id
        AND user_id = auth.uid()
        AND role IN ('director', 'admin')
        AND is_active = true
    )
  );
