CREATE OR REPLACE FUNCTION public.validate_visa_record_status()
RETURNS TRIGGER LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.status NOT IN ('active', 'expired', 'renewal_pending') THEN
    RAISE EXCEPTION 'Invalid visa record status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;