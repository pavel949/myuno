
-- ============================================
-- PART 2: Booking Pipeline & MC Activation
-- ============================================

-- 2.1a: Add order_id column to property_bookings for linking
ALTER TABLE public.property_bookings 
ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_property_bookings_order_id 
ON public.property_bookings(order_id) WHERE order_id IS NOT NULL;

-- 2.1b: Trigger to auto-create property_booking when a property order is confirmed
CREATE OR REPLACE FUNCTION public.create_property_booking_from_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_property_id uuid;
  v_owner_id uuid;
  v_guest_name text;
  v_guest_phone text;
  v_guest_email text;
  v_check_in date;
  v_check_out date;
  v_source text;
  v_source_calendar_id uuid;
BEGIN
  -- Only for property vertical orders that become confirmed
  IF NEW.vertical != 'property' THEN
    RETURN NEW;
  END IF;
  
  IF NEW.status != 'confirmed' THEN
    RETURN NEW;
  END IF;
  
  -- Skip if already confirmed before (update case)
  IF OLD IS NOT NULL AND OLD.status = 'confirmed' THEN
    RETURN NEW;
  END IF;

  -- Get property_id from order_items metadata
  SELECT (oi.metadata->>'property_id')::uuid
  INTO v_property_id
  FROM order_items oi 
  WHERE oi.order_id = NEW.id AND oi.item_type = 'property'
  LIMIT 1;

  IF v_property_id IS NULL THEN
    RETURN NEW; -- no property linked, skip
  END IF;

  -- Get owner_id from owner_properties
  SELECT op.owner_id INTO v_owner_id
  FROM owner_properties op WHERE op.id = v_property_id;

  IF v_owner_id IS NULL THEN
    RETURN NEW; -- property not found in owner_properties, skip
  END IF;

  -- Get guest info from order_participants
  SELECT p.name, p.phone, p.email
  INTO v_guest_name, v_guest_phone, v_guest_email
  FROM order_participants p
  WHERE p.order_id = NEW.id AND p.role = 'guest'
  LIMIT 1;

  -- Fallback to metadata
  IF v_guest_name IS NULL THEN
    v_guest_name := NEW.metadata->>'guest_name';
  END IF;

  -- Dates from order
  v_check_in := (NEW.start_at AT TIME ZONE 'Asia/Bangkok')::date;
  v_check_out := (NEW.end_at AT TIME ZONE 'Asia/Bangkok')::date;

  IF v_check_in IS NULL OR v_check_out IS NULL THEN
    RETURN NEW;
  END IF;

  -- Source info
  v_source := COALESCE(NEW.metadata->>'source', 'manual');
  v_source_calendar_id := (NEW.metadata->>'source_calendar_id')::uuid;

  -- Insert booking, skip if already exists for this order
  INSERT INTO property_bookings (
    property_id, owner_id, guest_name, guest_phone, guest_email,
    check_in, check_out, total_amount, currency, source,
    source_calendar_id, status, order_id, guest_id
  ) VALUES (
    v_property_id, v_owner_id, v_guest_name, v_guest_phone, v_guest_email,
    v_check_in, v_check_out, NEW.total_amount, COALESCE(NEW.currency, 'THB'), v_source,
    v_source_calendar_id, 'confirmed', NEW.id, NEW.customer_user_id
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_property_booking ON public.orders;
CREATE TRIGGER trg_create_property_booking
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.create_property_booking_from_order();

-- 2.2: Comment on unused products table
COMMENT ON TABLE public.products IS 'LEGACY: Unused table (0 records, 0 code references). marketplace_products is the active table. Safe to drop after verification.';
