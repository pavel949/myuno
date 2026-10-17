-- E2.7b: signed-in users read approved listings through public_property_catalog only.
-- Base-table reads remain for object-authorized PMS policies (owner, provider, assigned manager, company staff, admin)
-- under the operating-space ceiling. Anon keeps its column-limited approved-row access.
ALTER POLICY public_view_active ON public.properties TO anon;
ALTER POLICY "Anyone can view approved properties or own content" ON public.properties TO authenticated
  USING (EXISTS (SELECT 1 FROM public.providers WHERE providers.id=properties.provider_id AND providers.user_id=auth.uid()));
