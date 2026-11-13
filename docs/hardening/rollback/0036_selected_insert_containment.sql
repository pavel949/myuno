-- Emergency containment only, not applied. Never restore signed-in-only INSERT.
-- Service-role and trusted definer writers remain unaffected.
ALTER POLICY "Authenticated users can create orgs" ON public.orgs
  TO authenticated WITH CHECK (false);
ALTER POLICY "Authenticated users can log activity" ON public.property_activity_log
  TO authenticated WITH CHECK (false);