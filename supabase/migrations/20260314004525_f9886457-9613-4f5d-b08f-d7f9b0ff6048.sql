
-- Fix: release trigger must also handle 'expired' and 'refunded' statuses, not just 'cancelled'
CREATE OR REPLACE FUNCTION public.trg_release_availability_on_order_cancel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item record;
  v_start_date date;
  v_end_date date;
  v_current date;
BEGIN
  IF OLD.vertical != 'property' THEN
    RETURN NEW;
  END IF;

  -- Release on cancelled, expired, or refunded
  IF NEW.deleted_at IS NULL AND NEW.status NOT IN ('cancelled', 'expired', 'refunded') THEN
    RETURN NEW;
  END IF;

  FOR v_item IN
    SELECT COALESCE(oi.resource_id::uuid, (oi.metadata->>'property_id')::uuid) AS resource_id, oi.start_at, oi.end_at
    FROM order_items oi
    WHERE oi.order_id = OLD.id AND oi.item_type = 'property'
      AND (oi.resource_id IS NOT NULL OR (oi.metadata->>'property_id') IS NOT NULL)
  LOOP
    v_start_date := (COALESCE(v_item.start_at, OLD.start_at)::timestamptz)::date;
    v_end_date := (COALESCE(v_item.end_at, OLD.end_at)::timestamptz)::date;
    v_current := v_start_date;

    WHILE v_current <= v_end_date LOOP
      UPDATE property_availability
      SET status = 'available', note = NULL, updated_at = now()
      WHERE property_id = v_item.resource_id
        AND date = v_current
        AND status = 'booked'
        AND (note IS NULL OR note LIKE '%' || OLD.id::text || '%');
      v_current := v_current + 1;
    END LOOP;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Re-create trigger with updated conditions
DROP TRIGGER IF EXISTS trg_release_availability_on_order_cancel ON public.orders;
CREATE TRIGGER trg_release_availability_on_order_cancel
  AFTER UPDATE OF deleted_at, status ON public.orders
  FOR EACH ROW
  WHEN (OLD.vertical = 'property')
  EXECUTE FUNCTION public.trg_release_availability_on_order_cancel();

-- Atomic availability check RPC: returns false if any date in range is booked
CREATE OR REPLACE FUNCTION public.check_property_dates_available(
  p_property_id uuid,
  p_check_in date,
  p_check_out date,
  p_exclude_order_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_blocked_count integer;
BEGIN
  SELECT count(*) INTO v_blocked_count
  FROM property_availability pa
  WHERE pa.property_id = p_property_id
    AND pa.date >= p_check_in
    AND pa.date < p_check_out
    AND pa.status IN ('booked', 'blocked')
    AND (
      p_exclude_order_id IS NULL
      OR pa.note IS NULL
      OR pa.note NOT LIKE '%' || p_exclude_order_id::text || '%'
    );

  RETURN v_blocked_count = 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_property_dates_available(uuid, date, date, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_property_dates_available(uuid, date, date, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.check_property_dates_available(uuid, date, date, uuid) TO service_role;
