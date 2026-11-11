-- Stop new manual commands; retain deduplication evidence and existing stays.
BEGIN;
REVOKE ALL ON FUNCTION public.create_manual_property_booking(uuid,uuid,jsonb) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION pms_commands.create_manual_property_booking(uuid,uuid,jsonb) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON SCHEMA pms_commands FROM PUBLIC,anon,authenticated,service_role;
COMMIT;
