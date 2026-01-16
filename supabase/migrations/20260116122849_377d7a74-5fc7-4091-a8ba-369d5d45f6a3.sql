-- Fix the permissive INSERT policy for booking_notifications_log
DROP POLICY IF EXISTS "System can insert notifications" ON public.booking_notifications_log;

-- Only allow insert when the booking belongs to an owner's property or the user has a check-in for that booking
CREATE POLICY "Authenticated users can insert notifications for their bookings"
ON public.booking_notifications_log
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.property_bookings pb
    JOIN public.owner_properties op ON pb.property_id = op.id
    WHERE pb.id = booking_notifications_log.booking_id
    AND op.owner_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.guest_check_in_data gc
    WHERE gc.booking_id = booking_notifications_log.booking_id
    AND gc.user_id = auth.uid()
  )
);