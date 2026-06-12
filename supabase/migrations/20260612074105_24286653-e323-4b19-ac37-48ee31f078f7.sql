-- C1: Allow admins to manage partner_applications (review, update notes, change status manually)
DROP POLICY IF EXISTS "Admins can view all partner applications" ON public.partner_applications;
DROP POLICY IF EXISTS "Admins can update partner applications" ON public.partner_applications;

CREATE POLICY "Admins can view all partner applications"
ON public.partner_applications FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update partner applications"
ON public.partner_applications FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));