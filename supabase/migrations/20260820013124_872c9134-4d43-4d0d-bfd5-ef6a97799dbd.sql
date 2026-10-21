CREATE OR REPLACE FUNCTION public.submit_consultation_request(payload jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid := gen_random_uuid();
  clean jsonb;
BEGIN
  IF coalesce(trim(payload->>'name'), '') = '' THEN
    RAISE EXCEPTION 'name_required';
  END IF;
  IF coalesce(trim(payload->>'phone'), '') = '' THEN
    RAISE EXCEPTION 'phone_required';
  END IF;
  IF coalesce(trim(payload->>'request_type'), '') = '' THEN
    RAISE EXCEPTION 'request_type_required';
  END IF;

  -- never let the caller spoof ownership or workflow/admin-only fields
  clean := payload
    - 'id' - 'user_id' - 'assigned_to' - 'assigned_at' - 'created_at' - 'updated_at'
    - 'sla_deadline' - 'first_contact_at' - 'contact_attempts' - 'internal_notes';

  clean := clean || jsonb_build_object(
    'id', new_id,
    'user_id', auth.uid(),
    'created_at', now(),
    'updated_at', now()
  );

  IF coalesce(clean->>'status', '') = '' THEN
    clean := clean || jsonb_build_object('status', 'pending');
  END IF;

  INSERT INTO public.consultation_requests
  SELECT * FROM jsonb_populate_record(null::public.consultation_requests, clean);

  RETURN new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_consultation_request(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_consultation_request(jsonb) TO anon, authenticated, service_role;