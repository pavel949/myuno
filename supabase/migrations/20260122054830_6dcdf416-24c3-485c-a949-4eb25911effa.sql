-- Add guest_id column to property_bookings table for linking guests to their bookings
ALTER TABLE public.property_bookings
ADD COLUMN guest_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for faster guest queries
CREATE INDEX idx_property_bookings_guest_id ON public.property_bookings(guest_id);

-- Add RLS policy for guests to view their own bookings
CREATE POLICY "Guests can view their own bookings" 
ON public.property_bookings 
FOR SELECT 
USING (auth.uid() = guest_id);

-- Update RLS to allow both owners and guests
DROP POLICY IF EXISTS "Owners can manage their property bookings" ON public.property_bookings;

CREATE POLICY "Owners and guests can view bookings" 
ON public.property_bookings 
FOR SELECT 
USING (auth.uid() = owner_id OR auth.uid() = guest_id);

CREATE POLICY "Owners can insert their property bookings" 
ON public.property_bookings 
FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their property bookings" 
ON public.property_bookings 
FOR UPDATE 
USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their property bookings" 
ON public.property_bookings 
FOR DELETE 
USING (auth.uid() = owner_id);