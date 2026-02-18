
-- Fix check_yacht_availability: replace o.entity_id (does not exist) with correct
-- lookup via order_items metadata or orders metadata
CREATE OR REPLACE FUNCTION public.check_yacht_availability(
  p_yacht_id uuid,
  p_start_date date,
  p_end_date date,
  p_exclude_order_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_conflict_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_conflict_count
  FROM orders o
  WHERE o.vertical = 'yacht'
    AND (o.metadata->>'yacht_id')::uuid = p_yacht_id
    AND o.status NOT IN ('cancelled', 'refunded')
    AND (p_exclude_order_id IS NULL OR o.id != p_exclude_order_id)
    AND o.start_at IS NOT NULL
    AND (
      (o.start_at::date, COALESCE(o.end_at::date, o.start_at::date + interval '1 day'))
      OVERLAPS
      (p_start_date, p_end_date + interval '1 day')
    );

  RETURN v_conflict_count = 0;
END;
$$;
