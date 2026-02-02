-- Add admin policy for user_documents verification (admins need to verify documents)
CREATE POLICY "Admins can view all documents for verification" 
  ON public.user_documents 
  FOR SELECT 
  USING (is_admin_or_uno_team());

CREATE POLICY "Admins can update documents for verification" 
  ON public.user_documents 
  FOR UPDATE 
  USING (is_admin_or_uno_team());