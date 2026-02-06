
-- Add sevenrooms to reservation_provider check constraint
ALTER TABLE public.restaurants DROP CONSTRAINT IF EXISTS restaurants_reservation_provider_check;
ALTER TABLE public.restaurants ADD CONSTRAINT restaurants_reservation_provider_check 
  CHECK (reservation_provider IN ('chope', 'tablecheck', 'sevenrooms', 'website', 'phone'));
