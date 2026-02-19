-- Remove duplicate RLS policies on property_bookings that conflict with each other
DROP POLICY IF EXISTS "Owners can delete own property bookings" ON public.property_bookings;
DROP POLICY IF EXISTS "Owners can insert own property bookings" ON public.property_bookings;
DROP POLICY IF EXISTS "Owners can update own property bookings" ON public.property_bookings;
DROP POLICY IF EXISTS "Owners can view own property bookings" ON public.property_bookings;
DROP POLICY IF EXISTS "Property owners can view their bookings" ON public.property_bookings;