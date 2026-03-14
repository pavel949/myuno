
-- Atomic function to reserve event spots (prevent overselling)
CREATE OR REPLACE FUNCTION public.reserve_event_spots(p_event_id UUID, p_count INT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated INT;
BEGIN
  UPDATE events
  SET spots_left = spots_left - p_count
  WHERE id = p_event_id
    AND is_active = true
    AND spots_left >= p_count;
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;

-- Function to release spots on rollback/cancellation
CREATE OR REPLACE FUNCTION public.release_event_spots(p_event_id UUID, p_count INT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE events
  SET spots_left = LEAST(spots_left + p_count, max_spots)
  WHERE id = p_event_id;
END;
$$;
