
-- Fix: reference_id is uuid, not text. Cast properly.
CREATE OR REPLACE FUNCTION public.create_financial_from_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_property_owner_id UUID;
  v_property_id UUID;
  v_nights INTEGER;
  v_total_rent NUMERIC;
  v_cleaning_fee NUMERIC;
BEGIN
  IF NEW.status = 'confirmed' AND (OLD IS NULL OR OLD.status != 'confirmed') THEN
    SELECT owner_id, id INTO v_property_owner_id, v_property_id
    FROM owner_properties WHERE id = NEW.property_id;
    IF v_property_owner_id IS NULL THEN RETURN NEW; END IF;
    
    v_nights := GREATEST(1, NEW.check_out::date - NEW.check_in::date);
    v_total_rent := COALESCE(NEW.total_amount, 0);
    v_cleaning_fee := COALESCE(NEW.cleaning_fee, 0);
    
    IF v_total_rent > 0 THEN
      INSERT INTO property_financials (
        property_id, owner_id, transaction_type, category, amount, currency,
        description, description_ru, reference_type, reference_id, transaction_date, status, payment_method
      ) VALUES (
        v_property_id, v_property_owner_id, 'income', 'rent', v_total_rent,
        COALESCE(NEW.currency, 'THB'),
        'Rental income: ' || COALESCE(NEW.guest_name, 'Guest') || ' (' || v_nights || ' nights)',
        'Доход от аренды: ' || COALESCE(NEW.guest_name, 'Гость') || ' (' || v_nights || ' ночей)',
        'booking', NEW.id, NEW.check_in, 'paid',
        COALESCE(NEW.deposit_payment_method, 'platform')
      );
    END IF;
    
    IF v_cleaning_fee > 0 THEN
      INSERT INTO property_financials (
        property_id, owner_id, transaction_type, category, amount, currency,
        description, description_ru, reference_type, reference_id, transaction_date, status
      ) VALUES (
        v_property_id, v_property_owner_id, 'income', 'cleaning_fee', v_cleaning_fee,
        COALESCE(NEW.currency, 'THB'),
        'Cleaning fee: ' || COALESCE(NEW.guest_name, 'Guest'),
        'Плата за уборку: ' || COALESCE(NEW.guest_name, 'Гость'),
        'booking', NEW.id, NEW.check_in, 'paid'
      );
    END IF;
    
    INSERT INTO property_activity_log (property_id, actor_id, actor_role, action, details)
    VALUES (
      v_property_id, v_property_owner_id, 'system', 'booking_confirmed',
      jsonb_build_object('booking_id', NEW.id, 'guest_name', NEW.guest_name,
        'check_in', NEW.check_in, 'check_out', NEW.check_out,
        'total_amount', v_total_rent, 'cleaning_fee', v_cleaning_fee)
    );
  END IF;
  RETURN NEW;
END;
$$;
