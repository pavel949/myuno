BEGIN;
REVOKE ALL ON FUNCTION public.create_manual_property_request_atomic(uuid,uuid,text,uuid,timestamptz,timestamptz,numeric,text,text,text) FROM PUBLIC,anon,authenticated,service_role;
COMMIT;
