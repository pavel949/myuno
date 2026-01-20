-- Phase 2: Availability Check Functions

-- 2.1 Check yacht availability (date range overlap)
CREATE OR REPLACE FUNCTION public.check_yacht_availability(
  p_yacht_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_exclude_order_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conflict_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_conflict_count
  FROM orders o
  WHERE o.vertical = 'yacht'
    AND o.entity_id = p_yacht_id
    AND o.status NOT IN ('cancelled', 'refunded')
    AND (p_exclude_order_id IS NULL OR o.id != p_exclude_order_id)
    AND (
      (o.scheduled_start::date, COALESCE(o.scheduled_end::date, o.scheduled_start::date)) 
      OVERLAPS 
      (p_start_date, p_end_date)
    );
  
  RETURN v_conflict_count = 0;
END;
$$;

-- 2.2 Check tour availability (date + max participants)
CREATE OR REPLACE FUNCTION public.check_tour_availability(
  p_tour_id UUID,
  p_date DATE,
  p_participants INTEGER,
  p_exclude_order_id UUID DEFAULT NULL
)
RETURNS TABLE(available BOOLEAN, spots_remaining INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max_spots INTEGER;
  v_booked_spots INTEGER;
  v_remaining INTEGER;
BEGIN
  -- Get max spots from tours table
  SELECT COALESCE(t.max_group_size, 20) INTO v_max_spots
  FROM tours t
  WHERE t.id = p_tour_id;
  
  IF v_max_spots IS NULL THEN
    v_max_spots := 20; -- Default if tour not found
  END IF;
  
  -- Count already booked participants for this date
  SELECT COALESCE(SUM((o.metadata->>'participants')::integer), 0) INTO v_booked_spots
  FROM orders o
  WHERE o.vertical = 'tour'
    AND o.entity_id = p_tour_id
    AND o.scheduled_start::date = p_date
    AND o.status NOT IN ('cancelled', 'refunded')
    AND (p_exclude_order_id IS NULL OR o.id != p_exclude_order_id);
  
  v_remaining := v_max_spots - v_booked_spots;
  
  RETURN QUERY SELECT 
    (v_remaining >= p_participants) AS available,
    v_remaining AS spots_remaining;
END;
$$;

-- 2.3 Check service slot availability (datetime slot)
CREATE OR REPLACE FUNCTION public.check_service_slot_availability(
  p_service_id UUID,
  p_provider_id UUID,
  p_datetime TIMESTAMPTZ,
  p_duration_minutes INTEGER DEFAULT 60,
  p_exclude_order_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conflict_count INTEGER;
  v_end_time TIMESTAMPTZ;
BEGIN
  v_end_time := p_datetime + (p_duration_minutes || ' minutes')::interval;
  
  SELECT COUNT(*) INTO v_conflict_count
  FROM orders o
  WHERE o.vertical IN ('service', 'beauty', 'cleaning', 'medical', 'education', 'legal', 'fitness')
    AND o.provider_id = p_provider_id
    AND o.status NOT IN ('cancelled', 'refunded')
    AND (p_exclude_order_id IS NULL OR o.id != p_exclude_order_id)
    AND (
      (o.scheduled_start, o.scheduled_start + ((COALESCE(o.metadata->>'duration_minutes', '60'))::integer || ' minutes')::interval)
      OVERLAPS
      (p_datetime, v_end_time)
    );
  
  RETURN v_conflict_count = 0;
END;
$$;

-- 2.4 Universal availability check wrapper
CREATE OR REPLACE FUNCTION public.check_availability(
  p_vertical TEXT,
  p_entity_id UUID,
  p_provider_id UUID,
  p_start_datetime TIMESTAMPTZ,
  p_end_datetime TIMESTAMPTZ DEFAULT NULL,
  p_participants INTEGER DEFAULT 1,
  p_exclude_order_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_available BOOLEAN;
  v_spots INTEGER;
BEGIN
  CASE p_vertical
    WHEN 'yacht' THEN
      v_available := check_yacht_availability(
        p_entity_id,
        p_start_datetime::date,
        COALESCE(p_end_datetime, p_start_datetime)::date,
        p_exclude_order_id
      );
      v_result := jsonb_build_object('available', v_available);
      
    WHEN 'tour' THEN
      SELECT available, spots_remaining INTO v_available, v_spots
      FROM check_tour_availability(
        p_entity_id,
        p_start_datetime::date,
        p_participants,
        p_exclude_order_id
      );
      v_result := jsonb_build_object('available', v_available, 'spots_remaining', v_spots);
      
    WHEN 'property' THEN
      v_available := check_property_availability(
        p_entity_id,
        p_start_datetime::date,
        COALESCE(p_end_datetime, p_start_datetime)::date
      );
      v_result := jsonb_build_object('available', v_available);
      
    ELSE
      -- Services with time slots
      v_available := check_service_slot_availability(
        p_entity_id,
        p_provider_id,
        p_start_datetime,
        EXTRACT(EPOCH FROM (COALESCE(p_end_datetime, p_start_datetime + interval '1 hour') - p_start_datetime)) / 60,
        p_exclude_order_id
      );
      v_result := jsonb_build_object('available', v_available);
  END CASE;
  
  RETURN v_result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.check_yacht_availability TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_tour_availability TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_service_slot_availability TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_availability TO authenticated;