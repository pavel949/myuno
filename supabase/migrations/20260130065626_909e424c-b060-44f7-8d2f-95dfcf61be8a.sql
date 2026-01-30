-- Allow admins to update restaurants for content moderation
CREATE POLICY "Admins can update restaurants"
ON public.restaurants
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role));