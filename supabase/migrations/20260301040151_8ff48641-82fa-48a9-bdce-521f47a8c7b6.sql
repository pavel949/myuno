
-- Phase 4-5: Terms activity — director-only INSERT
-- Since terms_id has no FK, restrict to users who are directors of at least one company
DROP POLICY IF EXISTS "Users can insert own activity" ON management_terms_activity;
CREATE POLICY "Directors can insert terms activity" ON management_terms_activity
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      is_admin_or_uno_team()
      OR EXISTS (
        SELECT 1 FROM management_company_members
        WHERE user_id = auth.uid()
          AND role = 'director'
          AND is_active = true
      )
    )
  );
