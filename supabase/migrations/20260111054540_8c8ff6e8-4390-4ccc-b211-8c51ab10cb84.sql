-- ====== RENTAL TERMS FOR OWNER PROPERTIES ======
-- Add rental conditions to owner_properties
ALTER TABLE public.owner_properties
ADD COLUMN IF NOT EXISTS price_per_night NUMERIC,
ADD COLUMN IF NOT EXISTS min_stay_nights INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_guests INTEGER,
ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC,
ADD COLUMN IF NOT EXISTS deposit_currency TEXT DEFAULT 'THB',
ADD COLUMN IF NOT EXISTS check_in_time TEXT DEFAULT '14:00',
ADD COLUMN IF NOT EXISTS check_out_time TEXT DEFAULT '12:00',
ADD COLUMN IF NOT EXISTS house_rules TEXT,
ADD COLUMN IF NOT EXISTS house_rules_ru TEXT,
ADD COLUMN IF NOT EXISTS cancellation_policy TEXT DEFAULT 'flexible',
ADD COLUMN IF NOT EXISTS instant_booking BOOLEAN DEFAULT false;

-- Add marketplace_booking_id to property_bookings for sync
ALTER TABLE public.property_bookings
ADD COLUMN IF NOT EXISTS marketplace_booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL;

-- Create index for faster lookup
CREATE INDEX IF NOT EXISTS idx_property_bookings_marketplace ON public.property_bookings(marketplace_booking_id) WHERE marketplace_booking_id IS NOT NULL;

-- ====== FUNCTION TO SYNC MARKETPLACE BOOKING TO OWNER CALENDAR ======
CREATE OR REPLACE FUNCTION public.sync_booking_to_owner_calendar()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_owner_property RECORD;
  v_check_in DATE;
  v_check_out DATE;
  v_guest_name TEXT;
  v_guest_email TEXT;
  v_guest_phone TEXT;
BEGIN
  -- Only process property bookings
  IF NEW.booking_type != 'property' THEN
    RETURN NEW;
  END IF;

  -- Only process on insert or status change to confirmed/completed
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.status IN ('confirmed', 'completed') AND OLD.status != NEW.status) THEN
    
    -- Find owner_property linked to this marketplace property
    SELECT op.* INTO v_owner_property
    FROM public.owner_properties op
    WHERE op.marketplace_property_id = NEW.provider_id::uuid;
    
    -- Skip if no linked owner property
    IF v_owner_property IS NULL THEN
      RETURN NEW;
    END IF;
    
    -- Parse dates from scheduled_at (check_in) and notes or calculate based on booking
    v_check_in := NEW.scheduled_at::date;
    v_check_out := COALESCE(
      (NEW.notes::jsonb->>'check_out')::date,
      v_check_in + INTERVAL '1 day'
    );
    
    -- Get guest info from profiles
    SELECT full_name, email, phone INTO v_guest_name, v_guest_email, v_guest_phone
    FROM public.profiles
    WHERE id = NEW.user_id;
    
    -- Check if this booking already synced
    IF EXISTS (SELECT 1 FROM public.property_bookings WHERE marketplace_booking_id = NEW.id) THEN
      -- Update existing
      UPDATE public.property_bookings
      SET 
        status = NEW.status,
        check_in = v_check_in,
        check_out = v_check_out,
        total_amount = NEW.total_amount,
        updated_at = now()
      WHERE marketplace_booking_id = NEW.id;
    ELSE
      -- Insert new booking to owner calendar
      INSERT INTO public.property_bookings (
        property_id,
        owner_id,
        guest_name,
        guest_email,
        guest_phone,
        check_in,
        check_out,
        guests_count,
        total_amount,
        currency,
        source,
        marketplace_booking_id,
        status,
        notes
      ) VALUES (
        v_owner_property.id,
        v_owner_property.owner_id,
        COALESCE(v_guest_name, 'Guest via UNO'),
        v_guest_email,
        v_guest_phone,
        v_check_in,
        v_check_out,
        COALESCE((NEW.notes::jsonb->>'guests_count')::int, 1),
        NEW.total_amount,
        NEW.currency,
        'uno_marketplace',
        NEW.id,
        NEW.status,
        'Booked via UNO platform'
      );
      
      -- Create notification for owner
      INSERT INTO public.notifications (
        user_id,
        title,
        body,
        type,
        data,
        is_read
      ) VALUES (
        v_owner_property.owner_id,
        '🏠 Новое бронирование!',
        'Гость ' || COALESCE(v_guest_name, 'Guest') || ' забронировал ' || v_owner_property.title || ' на ' || v_check_in::text,
        'booking',
        jsonb_build_object(
          'booking_id', NEW.id,
          'property_id', v_owner_property.id,
          'check_in', v_check_in,
          'check_out', v_check_out
        ),
        false
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on bookings table
DROP TRIGGER IF EXISTS sync_property_booking_trigger ON public.bookings;
CREATE TRIGGER sync_property_booking_trigger
  AFTER INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_booking_to_owner_calendar();

-- ====== FUNCTION TO CHECK AVAILABILITY ======
CREATE OR REPLACE FUNCTION public.check_property_availability(
  p_marketplace_property_id UUID,
  p_check_in DATE,
  p_check_out DATE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_owner_property_id UUID;
  v_is_available BOOLEAN;
BEGIN
  -- Find owner property
  SELECT id INTO v_owner_property_id
  FROM public.owner_properties
  WHERE marketplace_property_id = p_marketplace_property_id;
  
  IF v_owner_property_id IS NULL THEN
    RETURN TRUE; -- No owner property linked, assume available
  END IF;
  
  -- Check for overlapping bookings
  SELECT NOT EXISTS (
    SELECT 1 FROM public.property_bookings
    WHERE property_id = v_owner_property_id
    AND status NOT IN ('cancelled', 'rejected')
    AND p_check_in < check_out
    AND p_check_out > check_in
  ) INTO v_is_available;
  
  RETURN v_is_available;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.check_property_availability(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_property_availability(UUID, DATE, DATE) TO anon;