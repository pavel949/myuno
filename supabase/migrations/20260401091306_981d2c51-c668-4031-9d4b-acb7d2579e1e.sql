
-- Drop permissive policies
DROP POLICY IF EXISTS "Authenticated users can manage development units" ON public.development_units;
DROP POLICY IF EXISTS "Authenticated users can manage resale properties" ON public.resale_properties;

-- Tighter policies using has_role function if it exists, otherwise use auth check
CREATE POLICY "Admin can manage development units" ON public.development_units
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin can manage resale properties" ON public.resale_properties
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );
