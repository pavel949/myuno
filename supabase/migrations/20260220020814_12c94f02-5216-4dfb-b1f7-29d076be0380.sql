
-- Fix: the previous migration dropped the policy but failed on creating the new one
-- Re-create proper policies for property_listing_scores

CREATE POLICY "Anyone can read listing scores"
ON public.property_listing_scores
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage listing scores"
ON public.property_listing_scores
FOR ALL
TO authenticated
USING (public.is_admin_or_uno_team())
WITH CHECK (public.is_admin_or_uno_team());
