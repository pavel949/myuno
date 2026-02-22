-- Allow assigned property managers to SELECT properties they manage
CREATE POLICY "manager_select_assigned"
ON public.properties FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.property_manager_assignments pma
    WHERE pma.property_id = properties.id
      AND pma.manager_user_id = auth.uid()
      AND pma.is_active = true
  )
);

-- Allow assigned property managers to UPDATE properties they manage
CREATE POLICY "manager_update_assigned"
ON public.properties FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.property_manager_assignments pma
    WHERE pma.property_id = properties.id
      AND pma.manager_user_id = auth.uid()
      AND pma.is_active = true
  )
);
