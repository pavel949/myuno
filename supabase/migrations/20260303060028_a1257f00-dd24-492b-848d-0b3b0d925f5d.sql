
-- Allow property owners to view their own property activity logs
CREATE POLICY "Owners can view own property activity"
ON public.property_activity_log FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = property_activity_log.property_id
      AND p.owner_id = auth.uid()
  )
);

-- Allow MC directors/admins to view activity logs for all company properties
CREATE POLICY "MC directors can view company property activity"
ON public.property_activity_log FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.management_company_members mcm
    JOIN public.properties p ON p.management_company_id = mcm.company_id
    WHERE p.id = property_activity_log.property_id
      AND mcm.user_id = auth.uid()
      AND mcm.role IN ('director', 'admin')
      AND mcm.is_active = true
  )
);
