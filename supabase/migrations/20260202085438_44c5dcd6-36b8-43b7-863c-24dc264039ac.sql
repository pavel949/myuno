-- Add RLS policy for partners table (admin-only access)
CREATE POLICY "Admins can view partners" 
  ON public.partners 
  FOR SELECT 
  USING (is_admin_or_uno_team());

CREATE POLICY "Admins can insert partners" 
  ON public.partners 
  FOR INSERT 
  WITH CHECK (is_admin_or_uno_team());

CREATE POLICY "Admins can update partners" 
  ON public.partners 
  FOR UPDATE 
  USING (is_admin_or_uno_team());

CREATE POLICY "Admins can delete partners" 
  ON public.partners 
  FOR DELETE 
  USING (is_admin_or_uno_team());