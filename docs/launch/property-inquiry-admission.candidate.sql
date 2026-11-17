-- REVIEW/ISOLATED-TEST CANDIDATE ONLY. Not a migration, trigger or deployed endpoint.
-- Pilot: authenticated creator admits their persisted pending property inquiry.
-- Private delivery event is not another request/order/booking source of truth.
BEGIN;
CREATE SCHEMA IF NOT EXISTS private;
CREATE TABLE private.admin_intake_dispatch (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL CHECK (source = 'property_inquiries'),
  request_id uuid NOT NULL REFERENCES public.property_inquiries(id),
  notification_kind text NOT NULL CHECK (notification_kind = 'new_request'),
  channel text NOT NULL CHECK (channel = 'email'),
  destination text NOT NULL,
  state text NOT NULL DEFAULT 'pending' CHECK (state IN ('pending','accepted','delivered','failed','suppressed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source, request_id, notification_kind, channel, destination)
);
ALTER TABLE private.admin_intake_dispatch ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.admin_intake_dispatch FROM PUBLIC, anon, authenticated, service_role;
-- No worker/read/write grant: production activation requires separate review.

CREATE FUNCTION public.admit_property_inquiry_admin_notification(p_request_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  actor uuid := auth.uid();
  request_owner uuid;
  request_status text;
  destinations jsonb;
  destination text;
  inserted_count integer := 0;
  inserted_row integer;
BEGIN
  IF actor IS NULL THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501'; END IF;
  -- Lock persisted identity/state, not caller-supplied names/phones/titles/recipients.
  SELECT user_id, status INTO request_owner, request_status
    FROM public.property_inquiries WHERE id = p_request_id FOR SHARE;
  IF NOT FOUND OR request_owner IS DISTINCT FROM actor OR request_status IS DISTINCT FROM 'pending' THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;
  SELECT value INTO destinations FROM public.system_settings WHERE key = 'admin_emails' FOR SHARE;
  -- Source settings support either native jsonb arrays or encoded JSON strings.
  IF jsonb_typeof(destinations) = 'string' THEN
    BEGIN destinations := (destinations #>> '{}')::jsonb;
    EXCEPTION WHEN OTHERS THEN RAISE EXCEPTION 'Admin recipients unavailable' USING ERRCODE = '22023'; END;
  END IF;
  IF destinations IS NULL OR jsonb_typeof(destinations) <> 'array' THEN
    RAISE EXCEPTION 'Admin recipients unavailable' USING ERRCODE = '22023';
  END IF;
  IF jsonb_array_length(destinations) < 1 OR jsonb_array_length(destinations) > 10
    OR EXISTS (SELECT 1 FROM jsonb_array_elements(destinations) item
      WHERE jsonb_typeof(item) <> 'string' OR length(item #>> '{}') > 254
        OR btrim(item #>> '{}') !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') THEN
    RAISE EXCEPTION 'Admin recipients unavailable' USING ERRCODE = '22023';
  END IF;
  FOR destination IN SELECT DISTINCT lower(btrim(value)) FROM jsonb_array_elements_text(destinations) LOOP
    INSERT INTO private.admin_intake_dispatch(source,request_id,notification_kind,channel,destination)
      VALUES('property_inquiries',p_request_id,'new_request','email',destination)
      ON CONFLICT (source,request_id,notification_kind,channel,destination) DO NOTHING;
    GET DIAGNOSTICS inserted_row = ROW_COUNT;
    inserted_count := inserted_count + inserted_row;
  END LOOP;
  RETURN jsonb_build_object('request_id',p_request_id,'outbox_queued',true,'new_events',inserted_count);
END;
$$;
REVOKE ALL ON FUNCTION public.admit_property_inquiry_admin_notification(uuid) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.admit_property_inquiry_admin_notification(uuid) TO authenticated;
COMMIT;
