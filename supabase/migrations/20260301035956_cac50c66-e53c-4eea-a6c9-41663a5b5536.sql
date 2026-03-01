
-- ============================================================
-- PHASE 2: Missing Policies + CRM fixes + MC member visibility
-- ============================================================

-- 2.1 booking_notifications_log — SELECT for MC members via property booking
CREATE POLICY "MC members can view booking notifications" ON booking_notifications_log
  FOR SELECT TO authenticated
  USING (
    is_admin_or_uno_team()
    OR (
      booking_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM property_bookings pb
        JOIN properties p ON p.id = pb.property_id
        JOIN management_company_members mcm ON mcm.company_id = p.management_company_id
        WHERE pb.id = booking_notifications_log.booking_id
          AND mcm.user_id = auth.uid()
          AND mcm.is_active = true
      )
    )
  );

-- 2.2 inventory_inspections
CREATE POLICY "MC members can view inspections" ON inventory_inspections
  FOR SELECT TO authenticated
  USING (
    is_admin_or_uno_team()
    OR is_mc_member_for_property(property_id, auth.uid())
    OR inspector_id = auth.uid()
  );

CREATE POLICY "MC members can insert inspections" ON inventory_inspections
  FOR INSERT TO authenticated
  WITH CHECK (
    is_admin_or_uno_team()
    OR is_mc_member_for_property(property_id, auth.uid())
  );

CREATE POLICY "MC members can update inspections" ON inventory_inspections
  FOR UPDATE TO authenticated
  USING (
    is_admin_or_uno_team()
    OR is_mc_member_for_property(property_id, auth.uid())
  );

CREATE POLICY "MC admins can delete inspections" ON inventory_inspections
  FOR DELETE TO authenticated
  USING (
    is_admin_or_uno_team()
    OR EXISTS (
      SELECT 1 FROM properties p
      JOIN management_company_members mcm ON mcm.company_id = p.management_company_id
      WHERE p.id = inventory_inspections.property_id
        AND mcm.user_id = auth.uid()
        AND mcm.role IN ('director', 'admin')
        AND mcm.is_active = true
    )
  );

-- 2.3 property_documents
CREATE POLICY "Authorized users can view documents" ON property_documents
  FOR SELECT TO authenticated
  USING (
    is_admin_or_uno_team()
    OR uploaded_by = auth.uid()
    OR is_mc_member_for_property(property_id, auth.uid())
    OR EXISTS (
      SELECT 1 FROM properties p WHERE p.id = property_documents.property_id AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "MC members and owners can insert documents" ON property_documents
  FOR INSERT TO authenticated
  WITH CHECK (
    is_admin_or_uno_team()
    OR is_mc_member_for_property(property_id, auth.uid())
    OR EXISTS (
      SELECT 1 FROM properties p WHERE p.id = property_documents.property_id AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "MC admins and owners can update documents" ON property_documents
  FOR UPDATE TO authenticated
  USING (
    is_admin_or_uno_team()
    OR EXISTS (
      SELECT 1 FROM properties p WHERE p.id = property_documents.property_id AND p.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM properties p
      JOIN management_company_members mcm ON mcm.company_id = p.management_company_id
      WHERE p.id = property_documents.property_id
        AND mcm.user_id = auth.uid()
        AND mcm.role IN ('director', 'admin', 'manager')
        AND mcm.is_active = true
    )
  );

CREATE POLICY "MC admins and owners can delete documents" ON property_documents
  FOR DELETE TO authenticated
  USING (
    is_admin_or_uno_team()
    OR EXISTS (
      SELECT 1 FROM properties p WHERE p.id = property_documents.property_id AND p.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM properties p
      JOIN management_company_members mcm ON mcm.company_id = p.management_company_id
      WHERE p.id = property_documents.property_id
        AND mcm.user_id = auth.uid()
        AND mcm.role IN ('director', 'admin')
        AND mcm.is_active = true
    )
  );

-- 2.4 property_management_terms
CREATE POLICY "Directors and owners can view terms" ON property_management_terms
  FOR SELECT TO authenticated
  USING (
    is_admin_or_uno_team()
    OR manager_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM properties p WHERE p.id = property_management_terms.property_id AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Directors can insert terms" ON property_management_terms
  FOR INSERT TO authenticated
  WITH CHECK (
    is_admin_or_uno_team()
    OR manager_user_id = auth.uid()
  );

CREATE POLICY "Directors can update terms" ON property_management_terms
  FOR UPDATE TO authenticated
  USING (
    is_admin_or_uno_team()
    OR manager_user_id = auth.uid()
  );

CREATE POLICY "Admins can delete terms" ON property_management_terms
  FOR DELETE TO authenticated
  USING (is_admin_or_uno_team());

-- 2.5 property_meters
CREATE POLICY "MC members can view meters" ON property_meters
  FOR SELECT TO authenticated
  USING (
    is_admin_or_uno_team()
    OR is_mc_member_for_property(property_id, auth.uid())
    OR EXISTS (
      SELECT 1 FROM properties p WHERE p.id = property_meters.property_id AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "MC members can insert meters" ON property_meters
  FOR INSERT TO authenticated
  WITH CHECK (
    is_admin_or_uno_team()
    OR is_mc_member_for_property(property_id, auth.uid())
  );

CREATE POLICY "MC members can update meters" ON property_meters
  FOR UPDATE TO authenticated
  USING (
    is_admin_or_uno_team()
    OR is_mc_member_for_property(property_id, auth.uid())
  );

CREATE POLICY "MC admins can delete meters" ON property_meters
  FOR DELETE TO authenticated
  USING (
    is_admin_or_uno_team()
    OR EXISTS (
      SELECT 1 FROM properties p
      JOIN management_company_members mcm ON mcm.company_id = p.management_company_id
      WHERE p.id = property_meters.property_id
        AND mcm.user_id = auth.uid()
        AND mcm.role IN ('director', 'admin')
        AND mcm.is_active = true
    )
  );

-- 2.6 Fix crm_web_form_submissions INSERT (was WITH CHECK (true))
DROP POLICY IF EXISTS "crm_web_form_submissions_insert" ON crm_web_form_submissions;
CREATE POLICY "crm_web_form_submissions_insert" ON crm_web_form_submissions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM crm_web_forms wf
      JOIN management_company_members mcm ON mcm.company_id = wf.company_id
      WHERE wf.id = crm_web_form_submissions.form_id
        AND mcm.user_id = auth.uid()
        AND mcm.is_active = true
    )
    OR is_admin_or_uno_team()
  );

-- Allow anonymous form submissions from public (anon role)
CREATE POLICY "Public can submit web forms" ON crm_web_form_submissions
  FOR INSERT TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM crm_web_forms wf
      WHERE wf.id = crm_web_form_submissions.form_id
        AND wf.is_active = true
    )
  );

-- 2.7 Restrict MC member visibility to colleagues only
DROP POLICY IF EXISTS "Anyone can view company memberships" ON management_company_members;
CREATE POLICY "Members can view their company colleagues" ON management_company_members
  FOR SELECT TO authenticated
  USING (
    is_active = true
    AND (
      user_id = auth.uid()
      OR is_admin_or_uno_team()
      OR company_id IN (
        SELECT mcm2.company_id FROM management_company_members mcm2
        WHERE mcm2.user_id = auth.uid() AND mcm2.is_active = true
      )
    )
  );
