
-- Fix: the generate_booking_operational_tasks trigger references a non-existent table
-- Disable it until property_tasks table is created in a future migration
DROP TRIGGER IF EXISTS auto_generate_booking_tasks ON public.property_bookings;
