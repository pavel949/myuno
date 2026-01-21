-- Create function to auto-generate financial transactions from confirmed bookings
CREATE OR REPLACE FUNCTION public.create_financial_from_booking()
RETURNS TRIGGER AS $$
DECLARE
  v_property_owner_id UUID;
  v_property_id UUID;
  v_nights INTEGER;
  v_total_rent NUMERIC;
  v_cleaning_fee NUMERIC;
BEGIN
  -- Only process when booking is confirmed
  IF NEW.status = 'confirmed' AND (OLD IS NULL OR OLD.status != 'confirmed') THEN
    -- Get property details
    SELECT owner_id, id INTO v_property_owner_id, v_property_id
    FROM owner_properties
    WHERE id = NEW.property_id;
    
    IF v_property_owner_id IS NULL THEN
      RETURN NEW;
    END IF;
    
    -- Calculate nights
    v_nights := GREATEST(1, NEW.check_out_date::date - NEW.check_in_date::date);
    
    -- Calculate rent (use total_amount if available, otherwise calculate from price per night)
    v_total_rent := COALESCE(NEW.total_amount, NEW.price_per_night * v_nights);
    v_cleaning_fee := COALESCE(NEW.cleaning_fee, 0);
    
    -- Insert rental income transaction
    IF v_total_rent > 0 THEN
      INSERT INTO property_financials (
        property_id,
        owner_id,
        transaction_type,
        category,
        amount,
        currency,
        description,
        description_ru,
        reference_type,
        reference_id,
        transaction_date,
        status,
        payment_method
      ) VALUES (
        v_property_id,
        v_property_owner_id,
        'income',
        'rent',
        v_total_rent,
        COALESCE(NEW.currency, 'THB'),
        'Rental income: ' || NEW.guest_name || ' (' || v_nights || ' nights)',
        'Доход от аренды: ' || NEW.guest_name || ' (' || v_nights || ' ночей)',
        'booking',
        NEW.id::text,
        NEW.check_in_date,
        'paid',
        COALESCE(NEW.payment_method, 'platform')
      );
    END IF;
    
    -- Insert cleaning fee as separate income if exists
    IF v_cleaning_fee > 0 THEN
      INSERT INTO property_financials (
        property_id,
        owner_id,
        transaction_type,
        category,
        amount,
        currency,
        description,
        description_ru,
        reference_type,
        reference_id,
        transaction_date,
        status
      ) VALUES (
        v_property_id,
        v_property_owner_id,
        'income',
        'cleaning_fee',
        v_cleaning_fee,
        COALESCE(NEW.currency, 'THB'),
        'Cleaning fee: ' || NEW.guest_name,
        'Плата за уборку: ' || NEW.guest_name,
        'booking',
        NEW.id::text,
        NEW.check_in_date,
        'paid'
      );
    END IF;
    
    -- Log the activity
    INSERT INTO property_activity_log (
      property_id,
      actor_id,
      actor_role,
      action,
      details
    ) VALUES (
      v_property_id,
      v_property_owner_id,
      'system',
      'booking_confirmed',
      jsonb_build_object(
        'booking_id', NEW.id,
        'guest_name', NEW.guest_name,
        'check_in', NEW.check_in_date,
        'check_out', NEW.check_out_date,
        'total_amount', v_total_rent,
        'cleaning_fee', v_cleaning_fee
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on property_bookings
DROP TRIGGER IF EXISTS trg_create_financial_from_booking ON property_bookings;
CREATE TRIGGER trg_create_financial_from_booking
  AFTER INSERT OR UPDATE ON property_bookings
  FOR EACH ROW
  EXECUTE FUNCTION create_financial_from_booking();

-- Add comment for documentation
COMMENT ON FUNCTION create_financial_from_booking() IS 'Automatically creates financial transactions when a booking is confirmed. Creates rent income and cleaning fee income entries.';