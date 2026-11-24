-- Synthetic disposable PostgreSQL fixture only. No business data or network.
CREATE TABLE public.owner_properties (id uuid PRIMARY KEY, owner_id uuid NOT NULL);
CREATE TABLE public.property_bookings (
  id uuid PRIMARY KEY, property_id uuid NOT NULL REFERENCES owner_properties(id),
  status text, check_in date NOT NULL, check_out date NOT NULL,
  total_amount numeric, cleaning_fee numeric, guest_name text, currency text,
  deposit_payment_method text, source text
);
CREATE TABLE public.property_financials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), property_id uuid, owner_id uuid,
  transaction_type text, category text, amount numeric, currency text,
  description text, description_ru text, reference_type text, reference_id uuid,
  transaction_date date, status text, payment_method text
);
CREATE TABLE public.property_activity_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  property_id uuid, actor_id uuid, actor_role text, action text, details jsonb
);
-- A deliberately simple stand-in for the observed immediate ledger mirror.
CREATE TABLE public.fixture_ledger (financial_id uuid, amount numeric, currency text);
CREATE FUNCTION public.fixture_ledger_mirror() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.fixture_ledger VALUES(NEW.id, NEW.amount, NEW.currency);
  RETURN NEW;
END
$$;
CREATE TRIGGER trg_sync_financial_to_ledger AFTER INSERT ON public.property_financials
FOR EACH ROW EXECUTE FUNCTION public.fixture_ledger_mirror();

-- Independent booking audit triggers: preserve during forward and fallback.
CREATE TABLE public.fixture_booking_audit (booking_id uuid, source text);
CREATE FUNCTION public.fixture_booking_audit_log() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.fixture_booking_audit VALUES(NEW.id,TG_NAME);
  RETURN NEW;
END
$$;
CREATE TRIGGER log_property_bookings_activity AFTER INSERT OR UPDATE ON public.property_bookings
FOR EACH ROW EXECUTE FUNCTION public.fixture_booking_audit_log();
CREATE TRIGGER trg_property_bookings_status_history AFTER UPDATE ON public.property_bookings
FOR EACH ROW EXECUTE FUNCTION public.fixture_booking_audit_log();
