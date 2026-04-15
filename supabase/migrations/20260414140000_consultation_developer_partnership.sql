-- Allow B2B developer partnership leads from /property/consultation
ALTER TABLE public.consultation_requests
DROP CONSTRAINT IF EXISTS consultation_requests_request_type_check;

ALTER TABLE public.consultation_requests
ADD CONSTRAINT consultation_requests_request_type_check
CHECK (request_type IN (
  'vacation_rental',
  'property_consultation',
  'property_tour',
  'full_management',
  'investment_advice',
  'channel_management',
  'developer_partnership'
));

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
    WHEN 'developer_partnership' THEN created_at + interval '48 hours'
    ELSE created_at + interval '24 hours'
  END;
END;
$$;
