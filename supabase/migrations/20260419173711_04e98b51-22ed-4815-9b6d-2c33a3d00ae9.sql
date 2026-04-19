-- P0-1: Unify availability checks to read from orders table (SSOT) + property_availability blocks

-- Updated atomic check: orders + manual blocks
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
  v_blocked_count integer := 0;
  v_order_overlap integer := 0;
BEGIN
  -- 1) Manual blocks in property_availability (status='blocked')
  SELECT count(*) INTO v_blocked_count
  FROM property_availability pa
  WHERE pa.property_id = p_property_id
    AND pa.date >= p_check_in
    AND pa.date < p_check_out
    AND pa.status = 'blocked';

  IF v_blocked_count > 0 THEN
    RETURN FALSE;
  END IF;

  -- 2) Overlapping confirmed/pending orders (SSOT)
  SELECT count(*) INTO v_order_overlap
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  WHERE o.vertical = 'property'
    AND o.deleted_at IS NULL
    AND o.status NOT IN ('cancelled', 'refunded', 'expired')
    AND oi.item_type = 'property'
    AND (oi.resource_id = p_property_id OR (oi.metadata->>'property_id')::uuid = p_property_id)
    AND (p_exclude_order_id IS NULL OR o.id <> p_exclude_order_id)
    -- Half-open interval overlap on dates
    AND (o.start_at::date) < p_check_out
    AND (o.end_at::date)   > p_check_in;

  RETURN v_order_overlap = 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_property_dates_available(uuid, date, date, uuid) TO authenticated, anon, service_role;

-- Refresh public-facing wrapper
CREATE OR REPLACE FUNCTION public.check_property_availability(
  p_marketplace_property_id UUID,
  p_check_in DATE,
  p_check_out DATE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- In unified model, marketplace_property_id IS the property id
  RETURN public.check_property_dates_available(p_marketplace_property_id, p_check_in, p_check_out, NULL);
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_property_availability(UUID, DATE, DATE) TO authenticated, anon, service_role;

-- Helper: list all unavailable dates for a property in a window (orders + manual blocks)
CREATE OR REPLACE FUNCTION public.get_property_unavailable_dates(
  p_property_id uuid,
  p_from date,
  p_to date
)
RETURNS TABLE (
  date date,
  reason text,
  order_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Manual blocks
  SELECT pa.date, 'blocked'::text AS reason, NULL::uuid AS order_id
  FROM property_availability pa
  WHERE pa.property_id = p_property_id
    AND pa.status = 'blocked'
    AND pa.date >= p_from AND pa.date <= p_to
  UNION ALL
  -- Orders SSOT (expanded into nights)
  SELECT gs.d::date AS date, 'booked'::text AS reason, o.id AS order_id
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  CROSS JOIN LATERAL generate_series(
    GREATEST((o.start_at::date), p_from),
    LEAST(((o.end_at::date) - INTERVAL '1 day')::date, p_to),
    INTERVAL '1 day'
  ) AS gs(d)
  WHERE o.vertical = 'property'
    AND o.deleted_at IS NULL
    AND o.status NOT IN ('cancelled', 'refunded', 'expired')
    AND oi.item_type = 'property'
    AND (oi.resource_id = p_property_id OR (oi.metadata->>'property_id')::uuid = p_property_id);
$$;

GRANT EXECUTE ON FUNCTION public.get_property_unavailable_dates(uuid, date, date) TO authenticated, anon, service_role;