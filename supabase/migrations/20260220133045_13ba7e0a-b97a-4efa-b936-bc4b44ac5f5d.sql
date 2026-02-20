-- Allow customer_user_id to be NULL for OTA/external bookings (iCal sync)
ALTER TABLE public.orders ALTER COLUMN customer_user_id DROP NOT NULL;

-- Add comment explaining the nullable field
COMMENT ON COLUMN public.orders.customer_user_id IS 'NULL for external OTA bookings imported via iCal sync';