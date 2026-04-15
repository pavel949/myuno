DROP POLICY IF EXISTS "Service role can manage referrals" ON public.guest_referral_codes;

CREATE POLICY "Admins can manage referrals"
ON public.guest_referral_codes
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));