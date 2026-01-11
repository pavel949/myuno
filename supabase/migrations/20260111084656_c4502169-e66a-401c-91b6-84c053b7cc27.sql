-- Fix profiles table - restrict to own data only
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can read profiles" ON public.profiles;

CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Fix bookings - ensure users only see their own bookings
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
CREATE POLICY "Users can view only own bookings" 
ON public.bookings 
FOR SELECT 
USING (auth.uid() = user_id);

-- Fix booking_payments - strict owner access
DROP POLICY IF EXISTS "Users can view payments for their bookings" ON public.booking_payments;
CREATE POLICY "Users can view own booking payments" 
ON public.booking_payments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE bookings.id = booking_payments.booking_id 
    AND bookings.user_id = auth.uid()
  )
);

-- Fix booking_participants - only booking owner can view
DROP POLICY IF EXISTS "Users can view participants for their bookings" ON public.booking_participants;
CREATE POLICY "Users can view own booking participants" 
ON public.booking_participants 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE bookings.id = booking_participants.booking_id 
    AND bookings.user_id = auth.uid()
  )
);

-- Fix booking_messages - strict conversation access
DROP POLICY IF EXISTS "Users can view messages for their bookings" ON public.booking_messages;
CREATE POLICY "Users can view own booking messages" 
ON public.booking_messages 
FOR SELECT 
USING (
  auth.uid() = sender_id OR
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE bookings.id = booking_messages.booking_id 
    AND bookings.user_id = auth.uid()
  )
);

-- Fix booking_addresses - only booking owner can view
DROP POLICY IF EXISTS "Users can view addresses for their bookings" ON public.booking_addresses;
CREATE POLICY "Users can view own booking addresses" 
ON public.booking_addresses 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE bookings.id = booking_addresses.booking_id 
    AND bookings.user_id = auth.uid()
  )
);

-- Fix wallet_transactions - ensure users only see their own
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Users can view own wallet transactions" ON public.wallet_transactions;
CREATE POLICY "Users can view strictly own wallet transactions" 
ON public.wallet_transactions 
FOR SELECT 
USING (auth.uid() = user_id);

-- Fix property_financials - owner only access
DROP POLICY IF EXISTS "Owners can view their own financials" ON public.property_financials;
CREATE POLICY "Property owners can view own financials" 
ON public.property_financials 
FOR SELECT 
USING (auth.uid() = owner_id);