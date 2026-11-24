-- Emergency containment rollback, not restoration of known false posting.
-- Only after approval if the extra legacy activity event causes a regression.
-- Other already-enabled booking audit/status triggers must remain present.
BEGIN;
LOCK TABLE public.property_bookings IN SHARE ROW EXCLUSIVE MODE;
DO $preflight$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_proc p
    WHERE p.oid = 'public.create_financial_from_booking()'::regprocedure
      AND p.prosrc LIKE '%booking_financial_posting_contained_v1%'
  ) OR (
    SELECT count(*) FROM pg_catalog.pg_trigger
    WHERE tgrelid = 'public.property_bookings'::regclass
      AND tgname IN ('log_property_bookings_activity','trg_property_bookings_status_history')
      AND tgenabled IN ('O','A') AND NOT tgisinternal
  ) <> 2 THEN
    RAISE EXCEPTION 'Rollback preflight failed; inspect booking audit and current writer';
  END IF;
END;
$preflight$;
CREATE OR REPLACE FUNCTION public.create_financial_from_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $safe_rollback$
BEGIN
  -- Keep false posting disabled. Other booking audit triggers remain enabled.
  RETURN NEW;
END;
$safe_rollback$;
COMMIT;
