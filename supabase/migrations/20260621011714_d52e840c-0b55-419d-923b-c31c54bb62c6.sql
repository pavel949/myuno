-- Allow management-company members to view & manage rate seasons for properties they manage.
-- Previously only the property owner could touch these, breaking MC dashboards.

CREATE POLICY "MC members view rate seasons"
  ON public.property_rate_seasons
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.properties p
      JOIN public.management_company_members m
        ON m.company_id = p.management_company_id
      WHERE p.id = property_rate_seasons.property_id
        AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "MC members manage rate seasons"
  ON public.property_rate_seasons
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.properties p
      JOIN public.management_company_members m
        ON m.company_id = p.management_company_id
      WHERE p.id = property_rate_seasons.property_id
        AND m.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.properties p
      JOIN public.management_company_members m
        ON m.company_id = p.management_company_id
      WHERE p.id = property_rate_seasons.property_id
        AND m.user_id = auth.uid()
    )
  );