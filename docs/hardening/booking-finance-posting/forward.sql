-- Review-only Class C candidate. Do not add to automated migrations or apply
-- before isolated acceptance and explicit release approval. Issue #347.
BEGIN;
LOCK TABLE public.property_bookings IN SHARE ROW EXCLUSIVE MODE;
DO $preflight$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_proc p
    WHERE p.oid = 'public.create_financial_from_booking()'::regprocedure
      AND pg_catalog.md5(p.prosrc) = 'ae00d05a916624fc9707b9679118b4a5'
      AND p.prosecdef
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_trigger t
    WHERE t.tgrelid = 'public.property_bookings'::regclass
      AND t.tgname = 'trg_create_financial_from_booking'
      AND t.tgfoid = 'public.create_financial_from_booking()'::regprocedure
      AND t.tgenabled = 'O' AND NOT t.tgisinternal
  ) THEN
    RAISE EXCEPTION 'Booking finance predecessor or trigger has changed; re-review';
  END IF;
END
$preflight$;

-- Confirmation is an operational event, not settlement. The existing
-- property_financials INSERT trigger immediately mirrors income to the ledger,
-- even if a new financial row were merely marked pending/unverified.
-- Stop the unsupported financial INSERT at its origin. Preserve the existing
-- audit event, ID, actor and recorded booking amounts. No change to any
-- canonical verified-payment writer, inventory writer or historical row.
CREATE OR REPLACE FUNCTION public.create_financial_from_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $booking_finance$
DECLARE
  v_property_owner_id uuid;
  v_property_id uuid;
BEGIN
  -- booking_financial_posting_contained_v1
  IF NEW.status = 'confirmed' AND
     (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'confirmed') THEN
    SELECT p.owner_id, p.id INTO v_property_owner_id, v_property_id
    FROM public.owner_properties p WHERE p.id = NEW.property_id;
    IF v_property_owner_id IS NULL THEN RETURN NEW; END IF;

    INSERT INTO public.property_activity_log (property_id, actor_id, actor_role, action, details)
    VALUES (
      v_property_id, v_property_owner_id, 'system', 'booking_confirmed',
      pg_catalog.jsonb_build_object(
        'booking_id', NEW.id, 'guest_name', NEW.guest_name,
        'check_in', NEW.check_in, 'check_out', NEW.check_out,
        'total_amount', COALESCE(NEW.total_amount, 0),
        'cleaning_fee', COALESCE(NEW.cleaning_fee, 0),
        'financial_posting', 'not_posted_by_confirmation'
      )
    );
  END IF;
  RETURN NEW;
END
$booking_finance$;
COMMIT;
