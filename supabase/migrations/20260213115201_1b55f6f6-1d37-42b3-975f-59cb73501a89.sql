
-- Fix: Property guidebook access should expire after checkout date
DROP POLICY IF EXISTS "Users with bookings can view guidebook" ON public.property_guidebook;

CREATE POLICY "Users with bookings can view guidebook"
ON public.property_guidebook
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.property_bookings pb
    JOIN public.profiles p ON pb.guest_email = p.email
    WHERE pb.property_id = property_guidebook.property_id
    AND p.id = auth.uid()
    AND pb.status IN ('confirmed', 'checked_in')
    AND pb.check_out >= CURRENT_DATE
  )
  OR
  EXISTS (
    SELECT 1 FROM public.guest_check_in_data gc
    JOIN public.property_bookings pb ON gc.booking_id = pb.id
    WHERE pb.property_id = property_guidebook.property_id
    AND gc.user_id = auth.uid()
    AND pb.check_out >= CURRENT_DATE
  )
);
