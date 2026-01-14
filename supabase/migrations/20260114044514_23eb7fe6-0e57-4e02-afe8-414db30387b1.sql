-- Fix function search_path for security
CREATE OR REPLACE FUNCTION public.validate_featured_listing()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stripe_payment_id IS NULL OR NEW.stripe_payment_id = '' THEN
    RAISE EXCEPTION 'Featured listing requires valid payment ID';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.validate_vendor_payout()
RETURNS TRIGGER AS $$
DECLARE
  available_balance NUMERIC;
BEGIN
  SELECT COALESCE(pending_payout, 0) INTO available_balance
  FROM public.providers
  WHERE id = NEW.provider_id;
  
  IF NEW.amount > available_balance THEN
    RAISE EXCEPTION 'Payout amount exceeds available balance';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;