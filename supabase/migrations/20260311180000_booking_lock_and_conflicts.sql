-- ============================================================
-- P1: Double-booking risk mitigation
-- 1. Booking lock: write property_availability on order create
-- 2. booking_conflicts table for iCal overlap alerts
-- ============================================================

-- 1. booking_conflicts table
CREATE TABLE IF NOT EXISTS public.booking_conflicts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  conflict_date date NOT NULL,
  channel_a text NOT NULL,
  channel_b text NOT NULL,
  order_id_a uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  order_id_b uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  detected_at timestamptz NOT NULL DEFAULT now(),
  resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  note text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_booking_conflicts_property ON public.booking_conflicts(property_id);
CREATE INDEX IF NOT EXISTS idx_booking_conflicts_resolved ON public.booking_conflicts(resolved) WHERE NOT resolved;

ALTER TABLE public.booking_conflicts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their property conflicts"
ON public.booking_conflicts FOR SELECT
USING (
  property_id IN (
    SELECT p.id FROM public.properties p
    WHERE p.owner_id = auth.uid()
    UNION
    SELECT p.id FROM public.properties p
    JOIN public.management_company_members mcm ON mcm.company_id = p.management_company_id
    WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
  )
);

CREATE POLICY "Owners can update their property conflicts"
ON public.booking_conflicts FOR UPDATE
USING (
  property_id IN (
    SELECT p.id FROM public.properties p
    WHERE p.owner_id = auth.uid()
    UNION
    SELECT p.id FROM public.properties p
    JOIN public.management_company_members mcm ON mcm.company_id = p.management_company_id
    WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
  )
);

CREATE POLICY "System can insert conflicts"
ON public.booking_conflicts FOR INSERT
WITH CHECK (true);

-- 2. Trigger: lock property_availability when property order is created
CREATE OR REPLACE FUNCTION public.trg_lock_availability_on_property_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order orders%ROWTYPE;
  v_start_date date;
  v_end_date date;
  v_current date;
  v_property_id uuid;
BEGIN
  IF NEW.item_type != 'property' THEN
    RETURN NEW;
  END IF;

  -- Support both resource_id and metadata.property_id (ical-scheduled-sync uses metadata)
  v_property_id := COALESCE(
    NEW.resource_id::uuid,
    (NEW.metadata->>'property_id')::uuid
  );
  IF v_property_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_order FROM orders WHERE id = NEW.order_id;
  IF NOT FOUND OR v_order.vertical != 'property' THEN
    RETURN NEW;
  END IF;

  IF v_order.deleted_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  IF v_order.status = 'cancelled' THEN
    RETURN NEW;
  END IF;

  v_start_date := (COALESCE(NEW.start_at, v_order.start_at)::timestamptz)::date;
  v_end_date := (COALESCE(NEW.end_at, v_order.end_at)::timestamptz)::date;

  v_current := v_start_date;
  WHILE v_current <= v_end_date LOOP
    INSERT INTO property_availability (property_id, date, status, note)
    VALUES (v_property_id, v_current, 'booked', 'Locked by order ' || v_order.id::text)
    ON CONFLICT (property_id, date) DO UPDATE SET
      status = 'booked',
      note = COALESCE(property_availability.note, '') || '; order ' || v_order.id::text,
      updated_at = now();
    v_current := v_current + 1;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lock_availability_on_property_order ON public.order_items;
CREATE TRIGGER trg_lock_availability_on_property_order
  AFTER INSERT ON public.order_items
  FOR EACH ROW
  WHEN (NEW.item_type = 'property' AND (NEW.resource_id IS NOT NULL OR (NEW.metadata->>'property_id') IS NOT NULL))
  EXECUTE FUNCTION public.trg_lock_availability_on_property_order();

-- 3. Also release availability when order is deleted/cancelled
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
    RETURN OLD;
  END IF;

  IF NEW.deleted_at IS NULL AND NEW.status != 'cancelled' THEN
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

DROP TRIGGER IF EXISTS trg_release_availability_on_order_cancel ON public.orders;
CREATE TRIGGER trg_release_availability_on_order_cancel
  AFTER UPDATE OF deleted_at, status ON public.orders
  FOR EACH ROW
  WHEN (OLD.vertical = 'property')
  EXECUTE FUNCTION public.trg_release_availability_on_order_cancel();
