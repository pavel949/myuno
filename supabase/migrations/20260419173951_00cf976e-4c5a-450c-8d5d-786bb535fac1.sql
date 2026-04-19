-- P2: Auto-sync orders (vertical='property') to legacy property_bookings table
-- so iCal exporters and legacy UIs see all reservations.

CREATE OR REPLACE FUNCTION public.trg_sync_order_to_property_booking()
RETURNS trigger
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
  v_guests_count int;
  v_check_in date;
  v_check_out date;
  v_status text;
  v_source text;
BEGIN
  -- Only sync property orders
  IF COALESCE(NEW.vertical, OLD.vertical) <> 'property' THEN
    RETURN NEW;
  END IF;

  -- Resolve property_id from order_items (prefer resource_id, fallback to metadata)
  SELECT COALESCE(oi.resource_id::uuid, (oi.metadata->>'property_id')::uuid)
    INTO v_property_id
  FROM order_items oi
  WHERE oi.order_id = NEW.id AND oi.item_type = 'property'
  LIMIT 1;

  IF v_property_id IS NULL THEN
    -- No property item linked yet — skip silently (will sync on item insert)
    RETURN NEW;
  END IF;

  -- Owner
  SELECT owner_id INTO v_owner_id FROM properties WHERE id = v_property_id;

  -- Guest participant
  SELECT name, phone, email
    INTO v_guest_name, v_guest_phone, v_guest_email
  FROM order_participants
  WHERE order_id = NEW.id AND role = 'guest'
  LIMIT 1;

  v_check_in  := (NEW.start_at::timestamptz)::date;
  v_check_out := (NEW.end_at::timestamptz)::date;
  v_guests_count := COALESCE(NULLIF(NEW.metadata->>'guests_count', '')::int, 1);
  v_source := COALESCE(NULLIF(NEW.metadata->>'source', ''), 'manual');

  -- Map order status to booking status
  v_status := CASE
    WHEN NEW.deleted_at IS NOT NULL THEN 'cancelled'
    WHEN NEW.status IN ('cancelled', 'refunded', 'expired') THEN 'cancelled'
    WHEN NEW.status = 'confirmed' THEN 'confirmed'
    WHEN NEW.status = 'completed' THEN 'completed'
    ELSE 'pending'
  END;

  -- Upsert mirror row keyed on external_id = order id
  INSERT INTO property_bookings (
    property_id, owner_id, guest_name, guest_phone, guest_email,
    guests_count, check_in, check_out, total_amount, currency,
    source, external_id, status, notes, created_at, updated_at
  )
  VALUES (
    v_property_id, v_owner_id, COALESCE(v_guest_name, 'Guest'),
    v_guest_phone, v_guest_email,
    v_guests_count, v_check_in, v_check_out,
    NEW.total_amount, NEW.currency,
    v_source, NEW.id::text, v_status, NEW.notes,
    NEW.created_at, NEW.updated_at
  )
  ON CONFLICT (external_id) DO UPDATE
  SET property_id = EXCLUDED.property_id,
      owner_id    = EXCLUDED.owner_id,
      guest_name  = EXCLUDED.guest_name,
      guest_phone = EXCLUDED.guest_phone,
      guest_email = EXCLUDED.guest_email,
      guests_count = EXCLUDED.guests_count,
      check_in    = EXCLUDED.check_in,
      check_out   = EXCLUDED.check_out,
      total_amount = EXCLUDED.total_amount,
      currency    = EXCLUDED.currency,
      status      = EXCLUDED.status,
      notes       = EXCLUDED.notes,
      updated_at  = now();

  RETURN NEW;
END;
$$;

-- Ensure unique key for upsert (external_id is the order id when synced)
CREATE UNIQUE INDEX IF NOT EXISTS idx_property_bookings_external_id_unique
  ON public.property_bookings (external_id)
  WHERE external_id IS NOT NULL;

DROP TRIGGER IF EXISTS sync_order_to_property_booking ON public.orders;
CREATE TRIGGER sync_order_to_property_booking
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_sync_order_to_property_booking();

-- Also re-run sync when an order_item is inserted (in case order was created before item)
CREATE OR REPLACE FUNCTION public.trg_sync_order_item_to_property_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order orders;
BEGIN
  IF NEW.item_type <> 'property' THEN
    RETURN NEW;
  END IF;
  SELECT * INTO v_order FROM orders WHERE id = NEW.order_id;
  IF v_order.id IS NULL OR v_order.vertical <> 'property' THEN
    RETURN NEW;
  END IF;
  -- Reuse the order-level sync by performing a no-op update touch
  UPDATE orders SET updated_at = now() WHERE id = NEW.order_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_order_item_to_property_booking ON public.order_items;
CREATE TRIGGER sync_order_item_to_property_booking
  AFTER INSERT ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_sync_order_item_to_property_booking();