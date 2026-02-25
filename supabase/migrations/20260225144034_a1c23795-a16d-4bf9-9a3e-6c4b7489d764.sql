
-- Fix search_path for security
ALTER FUNCTION normalize_district() SET search_path = public;
ALTER FUNCTION validate_order_fee() SET search_path = public;
