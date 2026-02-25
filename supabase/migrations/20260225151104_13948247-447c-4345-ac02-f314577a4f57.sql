
-- Remove the blocking trigger so we can backfill and use the auto-create trigger
DROP TRIGGER IF EXISTS block_property_bookings_insert ON public.property_bookings;
DROP FUNCTION IF EXISTS public.block_deprecated_property_bookings();
