-- Fix security warning: remove overly permissive INSERT policy for vendor_bookings
DROP POLICY IF EXISTS "System can insert vendor bookings" ON public.vendor_bookings;

-- Create proper INSERT policy that requires the booking to exist and belong to the provider
CREATE POLICY "Bookings can be linked to vendors" ON public.vendor_bookings
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.providers WHERE id = vendor_bookings.provider_id AND user_id = auth.uid())
    OR has_role(auth.uid(), 'admin')
  );

-- Also allow admins to manage vendor_bookings
CREATE POLICY "Admins can manage vendor bookings" ON public.vendor_bookings
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Allow admins to manage vendor analytics
CREATE POLICY "Admins can manage vendor analytics" ON public.vendor_analytics
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Allow admins to manage vendor payouts  
CREATE POLICY "Admins can manage vendor payouts" ON public.vendor_payouts
  FOR ALL USING (has_role(auth.uid(), 'admin'));