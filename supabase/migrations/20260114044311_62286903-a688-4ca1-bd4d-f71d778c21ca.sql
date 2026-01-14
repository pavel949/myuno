-- =============================================
-- FIX REMAINING RLS POLICIES (Part 2 - Corrected)
-- =============================================

-- PROPERTY_BOOKINGS - uses owner_id instead of user_id
-- Guest can view their booking, owner can view bookings for their properties
DROP POLICY IF EXISTS "Users and owners can view property bookings" ON public.property_bookings;
DROP POLICY IF EXISTS "Users can view their property bookings" ON public.property_bookings;
DROP POLICY IF EXISTS "Owners can view their property bookings" ON public.property_bookings;

CREATE POLICY "Property owners can view their bookings"
ON public.property_bookings FOR SELECT
USING (
  auth.uid() = owner_id
  OR EXISTS (
    SELECT 1 FROM public.properties p
    JOIN public.providers pr ON p.provider_id = pr.id
    WHERE p.id = property_bookings.property_id 
    AND pr.user_id = auth.uid()
  )
);

-- VENDOR_BOOKINGS - no user_id, has customer info
-- Only provider can view their vendor bookings
DROP POLICY IF EXISTS "Users and vendors can view vendor bookings" ON public.vendor_bookings;
DROP POLICY IF EXISTS "Providers can view their bookings" ON public.vendor_bookings;

CREATE POLICY "Providers can view their vendor bookings"
ON public.vendor_bookings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.providers pr
    WHERE pr.id = vendor_bookings.provider_id 
    AND pr.user_id = auth.uid()
  )
);

-- Also allow users who made the booking (via bookings table reference)
CREATE POLICY "Users can view their vendor bookings via bookings"
ON public.vendor_bookings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = vendor_bookings.booking_id 
    AND b.user_id = auth.uid()
  )
);