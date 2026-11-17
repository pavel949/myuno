-- REVIEW/ISOLATED-TEST CANDIDATE ONLY. Requires admission candidate; no live apply.
-- Extend the existing RLS-protected INSERT, never replace order/payment writers.
BEGIN;
CREATE FUNCTION private.admit_inserted_property_inquiry()
RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
BEGIN
  -- Trigger receives the actual stored row; it accepts no caller-supplied source/context.
  PERFORM public.admit_property_inquiry_admin_notification(NEW.id);
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.admit_inserted_property_inquiry() FROM PUBLIC, anon, authenticated, service_role;
CREATE TRIGGER admit_inserted_property_inquiry
AFTER INSERT ON public.property_inquiries
FOR EACH ROW
WHEN (NEW.status = 'pending' AND NEW.user_id = auth.uid())
EXECUTE FUNCTION private.admit_inserted_property_inquiry();
COMMIT;
