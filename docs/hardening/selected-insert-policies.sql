-- Forward-only repair of the two selected INSERT policies.
-- Existing organization rows retain NULL authorship; do not invent ownership.
ALTER TABLE public.orgs ADD COLUMN IF NOT EXISTS created_by uuid DEFAULT auth.uid();
COMMENT ON COLUMN public.orgs.created_by IS 'Creator identity for new organizations, bound by INSERT RLS. Legacy rows remain NULL; membership remains the organization authority.';

ALTER POLICY "Authenticated users can create orgs" ON public.orgs
  TO authenticated
  WITH CHECK (created_by = auth.uid());

ALTER POLICY "Authenticated users can log activity" ON public.property_activity_log
  TO authenticated
  WITH CHECK (
    actor_id = auth.uid()
    AND public.can_manage_property_e28_private(property_id)
    AND public.actor_private_property_ceiling(property_id)
  );