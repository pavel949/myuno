
-- Fix last function with missing search_path
CREATE OR REPLACE FUNCTION public.get_order_vertical(p_order_type text, p_metadata jsonb)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, pg_temp
AS $function$
BEGIN
  RETURN CASE p_order_type
    WHEN 'food' THEN 'restaurant'
    WHEN 'vehicle' THEN COALESCE(p_metadata->>'vehicle_type', 'vehicle')
    ELSE p_order_type
  END;
END;
$function$;
