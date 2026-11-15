BEGIN;
REVOKE ALL ON FUNCTION public.create_managed_property_booking_checked(jsonb) FROM PUBLIC,anon,authenticated;
COMMIT;
