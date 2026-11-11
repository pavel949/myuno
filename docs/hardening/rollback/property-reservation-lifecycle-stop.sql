-- Restrictive stop, NOT restoration of unsafe predecessor writers.
-- Keep receipts, orders, audit and inventory; no data deletion or paid activation.
BEGIN;
REVOKE ALL ON FUNCTION public.create_property_reservation_checked(uuid,uuid,jsonb) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.create_manual_property_booking(uuid,uuid,jsonb) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.change_property_booking(uuid,uuid,timestamptz,jsonb) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION pms_commands.create_manual_property_booking(uuid,uuid,jsonb,boolean) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION pms_commands.change_property_booking(uuid,uuid,timestamptz,jsonb) FROM PUBLIC,anon,authenticated,service_role;
-- Checked read/list remain usable. Strict bridge, protected-cohort guards,
-- payment refusal and block serialization MUST remain in force.
COMMIT;
