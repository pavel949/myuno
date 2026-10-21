
-- Step 2: scope buyers RLS — brokers only see buyers they created themselves; admins see all
DROP POLICY IF EXISTS "devmod: broker admin only buyers" ON public.buyers;
DROP POLICY IF EXISTS "devmod: broker admin full access buyers" ON public.buyers;

-- Admins: full access
CREATE POLICY "Admins manage all buyers"
  ON public.buyers
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Brokers: only buyers they created themselves OR linked to leads they created
CREATE POLICY "Brokers manage own buyers"
  ON public.buyers
  FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'broker'::app_role)
    AND (
      created_by_user_id = auth.uid()
      OR lead_id IN (SELECT id FROM public.nb_leads WHERE user_id = auth.uid())
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'broker'::app_role)
    AND (
      created_by_user_id = auth.uid()
      OR lead_id IN (SELECT id FROM public.nb_leads WHERE user_id = auth.uid())
    )
  );

-- existing "devmod: buyer self access" policy stays — buyer sees own record
