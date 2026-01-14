-- SECURITY AUDIT: Restrict profiles table access to own data only
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

-- Only allow users to see their own profile (protects email/phone)
CREATE POLICY "Users can view their own profile only"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Fix booking_participants to only show to booking owner
DROP POLICY IF EXISTS "Users can view participants for their bookings" ON public.booking_participants;
DROP POLICY IF EXISTS "Users can view booking participants" ON public.booking_participants;

CREATE POLICY "Users can only view participants in their own bookings"
ON public.booking_participants FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = booking_participants.booking_id
    AND b.user_id = auth.uid()
  )
);

-- Restrict pharmacy_orders access to owner only
DROP POLICY IF EXISTS "Users can view their own pharmacy orders" ON public.pharmacy_orders;

CREATE POLICY "Users can view only their own pharmacy orders"
ON public.pharmacy_orders FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Fix partner_applications to restrict access
DROP POLICY IF EXISTS "Users can view their own applications" ON public.partner_applications;

CREATE POLICY "Users can view only their own partner applications"
ON public.partner_applications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Restrict vendor_payouts to vendor only
DROP POLICY IF EXISTS "Vendors can view their own payouts" ON public.vendor_payouts;

CREATE POLICY "Vendors can view only their own payouts"
ON public.vendor_payouts FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.providers p
    WHERE p.id = vendor_payouts.provider_id
    AND p.user_id = auth.uid()
  )
);