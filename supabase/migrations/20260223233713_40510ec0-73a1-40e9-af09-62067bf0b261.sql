
-- Fix permissive INSERT policies: restrict to owner of the property
DROP POLICY "Service can insert cross-sell offers" ON public.booking_cross_sell_offers;
CREATE POLICY "Owner can insert cross-sell offers"
ON public.booking_cross_sell_offers FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.property_bookings pb
    JOIN public.properties p ON p.id = pb.property_id
    WHERE pb.id = booking_cross_sell_offers.booking_id AND p.owner_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.property_bookings pb
    WHERE pb.id = booking_cross_sell_offers.booking_id AND pb.guest_id = auth.uid()
  )
);

DROP POLICY "Service can insert pricing recommendations" ON public.pricing_recommendations;
CREATE POLICY "Owner can insert pricing recommendations"
ON public.pricing_recommendations FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.properties p WHERE p.id = pricing_recommendations.property_id AND p.owner_id = auth.uid())
);
