-- Pause new submissions without losing receipts or operator access to saved requests.
REVOKE EXECUTE ON FUNCTION public.submit_experience_inquiry(jsonb) FROM authenticated;
