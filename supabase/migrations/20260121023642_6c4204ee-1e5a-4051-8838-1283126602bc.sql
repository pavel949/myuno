-- Fix function search path for calculate_sla_deadline
CREATE OR REPLACE FUNCTION public.calculate_sla_deadline(request_type text, created_at timestamptz)
RETURNS timestamptz
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  RETURN CASE request_type
    WHEN 'vacation_rental' THEN created_at + interval '2 hours'
    WHEN 'property_tour' THEN created_at + interval '4 hours'
    WHEN 'property_consultation' THEN created_at + interval '24 hours'
    WHEN 'investment_advice' THEN created_at + interval '48 hours'
    WHEN 'full_management' THEN created_at + interval '24 hours'
    ELSE created_at + interval '24 hours'
  END;
END;
$$;