-- Extend get_property_unavailable_dates to return kind ('booked'|'blocked'|'checkout_only')
DROP FUNCTION IF EXISTS public.get_property_unavailable_dates(uuid, date, date);

CREATE OR REPLACE FUNCTION public.get_property_unavailable_dates(
  p_property_id uuid,
  p_from date,
  p_to date
)
RETURNS TABLE(date date, kind text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH order_ranges AS (
    SELECT
      (o.start_at::timestamptz)::date AS check_in,
      (o.end_at::timestamptz)::date   AS check_out
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    WHERE o.vertical = 'property'
      AND oi.item_type = 'property'
      AND oi.resource_id::uuid = p_property_id
      AND o.deleted_at IS NULL
      AND o.status NOT IN ('cancelled','refunded','expired')
      AND (o.start_at::timestamptz)::date < p_to
      AND (o.end_at::timestamptz)::date   > p_from
  ),
  ical_ranges AS (
    SELECT pb.check_in, pb.check_out
    FROM property_bookings pb
    WHERE pb.property_id = p_property_id
      AND pb.source_calendar_id IS NOT NULL
      AND COALESCE(LOWER(pb.status),'pending') NOT IN ('cancelled','canceled','refunded','expired')
      AND pb.check_in < p_to
      AND pb.check_out > p_from
  ),
  all_ranges AS (
    SELECT * FROM order_ranges
    UNION ALL
    SELECT * FROM ical_ranges
  ),
  booked_nights AS (
    -- nights physically occupied: [check_in, check_out)
    SELECT DISTINCT gs::date AS d
    FROM all_ranges r,
         LATERAL generate_series(
           GREATEST(r.check_in, p_from),
           LEAST(r.check_out - INTERVAL '1 day', p_to - INTERVAL '1 day')::date,
           INTERVAL '1 day'
         ) gs
  ),
  checkout_days AS (
    -- check_out day = guest leaves in morning, free for new check_in
    SELECT DISTINCT r.check_out AS d
    FROM all_ranges r
    WHERE r.check_out >= p_from AND r.check_out < p_to
  ),
  manual_blocks AS (
    SELECT pa.date AS d
    FROM property_availability pa
    WHERE pa.property_id = p_property_id
      AND pa.status = 'blocked'
      AND pa.date >= p_from AND pa.date < p_to
  )
  SELECT d, 'booked'::text FROM booked_nights
  UNION ALL
  SELECT d, 'blocked'::text FROM manual_blocks
  WHERE d NOT IN (SELECT d FROM booked_nights)
  UNION ALL
  SELECT d, 'checkout_only'::text FROM checkout_days
  WHERE d NOT IN (SELECT d FROM booked_nights)
    AND d NOT IN (SELECT d FROM manual_blocks);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_property_unavailable_dates(uuid, date, date) TO anon, authenticated;