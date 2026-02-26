
DROP POLICY "Team members can view own activity" ON team_activity_log;

CREATE POLICY "View team activity"
ON team_activity_log FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY(ARRAY['admin'::app_role, 'staff'::app_role])
  )
  OR EXISTS (
    SELECT 1 FROM management_company_members AS mgr
    JOIN management_company_members AS mem
      ON mgr.company_id = mem.company_id
    WHERE mgr.user_id = auth.uid()
      AND mgr.role IN ('director', 'admin')
      AND mem.user_id = team_activity_log.user_id
  )
);
