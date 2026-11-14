-- Developer/off-plan publication blockers: ownership-only writes.
-- project_units previously had authenticated-user UPDATE/DELETE policies.
DROP POLICY IF EXISTS "Creators can update project_units" ON public.project_units;
DROP POLICY IF EXISTS "Creators can delete project_units" ON public.project_units;
DROP POLICY IF EXISTS "Creators or admins update project_units" ON public.project_units;
DROP POLICY IF EXISTS "Creators or admins delete project_units" ON public.project_units;

CREATE POLICY "Developer team can update project_units"
  ON public.project_units FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.property_projects pp
      WHERE pp.id = project_units.project_id
        AND pp.developer_id = public.devmod_my_developer_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.property_projects pp
      WHERE pp.id = project_units.project_id
        AND pp.developer_id = public.devmod_my_developer_id()
    )
  );

CREATE POLICY "Developer team can delete project_units"
  ON public.project_units FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.property_projects pp
      WHERE pp.id = project_units.project_id
        AND pp.developer_id = public.devmod_my_developer_id()
    )
  );

-- nb_leads has developer_id, so status changes can be scoped to the owning
-- developer/team. Admin's existing ALL policy remains available.
CREATE POLICY "Developer team can update own nb_lead status"
  ON public.nb_leads FOR UPDATE
  TO authenticated
  USING (developer_id = public.devmod_my_developer_id())
  WITH CHECK (developer_id = public.devmod_my_developer_id());
