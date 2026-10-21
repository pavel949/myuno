CREATE OR REPLACE FUNCTION public.trg_sync_order_to_property_booking()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_property_id uuid; v_owner_id uuid; v_guest_name text; v_guest_phone text; v_guest_email text;
  v_guests_count int; v_check_in date; v_check_out date; v_status text; v_source text;
BEGIN
  IF COALESCE(NEW.vertical, OLD.vertical) <> 'property' THEN RETURN NEW; END IF;

  SELECT COALESCE(oi.resource_id::uuid, (oi.metadata->>'property_id')::uuid) INTO v_property_id
  FROM order_items oi WHERE oi.order_id = NEW.id AND oi.item_type = 'property' LIMIT 1;
  IF v_property_id IS NULL THEN RETURN NEW; END IF;

  SELECT owner_id INTO v_owner_id FROM properties WHERE id = v_property_id;
  SELECT name, phone, email INTO v_guest_name, v_guest_phone, v_guest_email
  FROM order_participants WHERE order_id = NEW.id AND role = 'guest' LIMIT 1;

  v_check_in  := (NEW.start_at::timestamptz)::date;
  v_check_out := (NEW.end_at::timestamptz)::date;
  v_guests_count := COALESCE(NULLIF(NEW.metadata->>'guests_count', '')::int, 1);
  v_source := COALESCE(NULLIF(NEW.metadata->>'source', ''), 'manual');
  v_status := CASE
    WHEN NEW.deleted_at IS NOT NULL THEN 'cancelled'
    WHEN NEW.status IN ('cancelled','refunded','expired') THEN 'cancelled'
    WHEN NEW.status = 'confirmed' THEN 'confirmed'
    WHEN NEW.status = 'completed' THEN 'completed'
    ELSE 'pending' END;

  -- Adopt an unlinked booking for the same stay instead of creating a duplicate.
  UPDATE property_bookings SET external_id = NEW.id::text
  WHERE external_id IS NULL AND property_id = v_property_id
    AND check_in = v_check_in AND check_out = v_check_out
    AND NOT EXISTS (SELECT 1 FROM property_bookings pb2 WHERE pb2.external_id = NEW.id::text);

  BEGIN
    INSERT INTO property_bookings (property_id, owner_id, guest_name, guest_phone, guest_email,
      guests_count, check_in, check_out, total_amount, currency, source, external_id, status, notes, created_at, updated_at)
    VALUES (v_property_id, v_owner_id, COALESCE(v_guest_name,'Guest'), v_guest_phone, v_guest_email,
      v_guests_count, v_check_in, v_check_out, NEW.total_amount, NEW.currency, v_source, NEW.id::text, v_status, NEW.notes,
      NEW.created_at, NEW.updated_at)
    ON CONFLICT (external_id) DO UPDATE SET
      property_id = EXCLUDED.property_id, owner_id = EXCLUDED.owner_id, guest_name = EXCLUDED.guest_name,
      guest_phone = EXCLUDED.guest_phone, guest_email = EXCLUDED.guest_email, guests_count = EXCLUDED.guests_count,
      check_in = EXCLUDED.check_in, check_out = EXCLUDED.check_out, total_amount = EXCLUDED.total_amount,
      currency = EXCLUDED.currency, status = EXCLUDED.status, notes = EXCLUDED.notes, updated_at = now();
  EXCEPTION WHEN exclusion_violation THEN
    -- Overlapping stay: never block the order, but surface the conflict for review.
    INSERT INTO reconciliation_alerts (alert_type, severity, order_id, expected_amount, currency, description, details)
    SELECT 'booking_overlap', 'high', NEW.id, NEW.total_amount, NEW.currency,
      'Order dates overlap an existing booking for this property',
      jsonb_build_object('property_id', v_property_id, 'check_in', v_check_in, 'check_out', v_check_out)
    WHERE NOT EXISTS (SELECT 1 FROM reconciliation_alerts ra WHERE ra.order_id = NEW.id AND ra.alert_type = 'booking_overlap' AND ra.resolved_at IS NULL);
  END;
  RETURN NEW;
END;
$function$;