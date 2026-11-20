-- Review candidate. Run against an isolated PostgreSQL copy before production.
BEGIN;
SET LOCAL lock_timeout = '3s';
LOCK TABLE public.consultation_requests IN ACCESS EXCLUSIVE MODE;
DO $$
DECLARE
  prior_rule text;
BEGIN
  SELECT pg_get_expr(conbin, conrelid) INTO STRICT prior_rule
  FROM pg_constraint
  WHERE conrelid = 'public.consultation_requests'::regclass
    AND conname = 'consultation_requests_request_type_check'
    AND contype = 'c';

  IF position(quote_literal('tour_booking') IN prior_rule) > 0 THEN
    RAISE EXCEPTION 'Experience admission already exists. Inspect its exact rule.';
  END IF;

  ALTER TABLE public.consultation_requests
    DROP CONSTRAINT consultation_requests_request_type_check;
  EXECUTE format(
    'ALTER TABLE public.consultation_requests ADD CONSTRAINT consultation_requests_request_type_check CHECK ((%s) OR (request_type = %L AND vertical_id IS NOT DISTINCT FROM %L)) NOT VALID',
    prior_rule, 'tour_booking', 'tours'
  );
END;
$$;

CREATE SCHEMA IF NOT EXISTS private;
CREATE TABLE private.experience_inquiry_receipts (
  actor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_key uuid NOT NULL,
  request_id uuid NOT NULL UNIQUE REFERENCES public.consultation_requests(id)
    ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
  fingerprint bytea NOT NULL,
  PRIMARY KEY (actor_id, request_key)
);
REVOKE ALL ON private.experience_inquiry_receipts FROM PUBLIC, anon, authenticated;

CREATE FUNCTION private.require_experience_receipt()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.request_type = 'tour_booking' AND NEW.request_type = OLD.request_type
       AND NEW.id = OLD.id AND NEW.user_id IS NOT DISTINCT FROM OLD.user_id
       AND NEW.vertical_id IS NOT DISTINCT FROM OLD.vertical_id THEN
      RETURN NEW;
    END IF;
    -- Identity removal by the auth foreign key retains the operational record.
    IF OLD.request_type = 'tour_booking' AND NEW.request_type = OLD.request_type
       AND NEW.id = OLD.id AND NEW.user_id IS NULL AND OLD.user_id IS NOT NULL
       AND NEW.vertical_id IS NOT DISTINCT FROM OLD.vertical_id
       AND NOT EXISTS (SELECT 1 FROM auth.users WHERE id = OLD.user_id) THEN
      RETURN NEW;
    END IF;
    IF OLD.request_type = 'tour_booking' OR NEW.request_type = 'tour_booking' THEN
      RAISE EXCEPTION 'experience_request_identity_immutable' USING ERRCODE = '42501';
    END IF;
  ELSIF NEW.request_type = 'tour_booking' AND NOT EXISTS (
    SELECT 1 FROM private.experience_inquiry_receipts
    WHERE request_id = NEW.id AND actor_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'experience_request_writer_required' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.require_experience_receipt() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER require_experience_receipt
BEFORE INSERT OR UPDATE OF id, user_id, request_type, vertical_id ON public.consultation_requests
FOR EACH ROW EXECUTE FUNCTION private.require_experience_receipt();

CREATE FUNCTION public.submit_experience_inquiry(payload jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  actor uuid := auth.uid();
  offer uuid;
  nonce uuid;
  preference date;
  party integer;
  guest_name text := pg_catalog.btrim(payload->>'name');
  guest_phone text := pg_catalog.btrim(payload->>'phone');
  locale text := payload->>'preferred_language';
  offer_title text;
  route text;
  digest bytea;
  receipt uuid;
  prior_digest bytea;
BEGIN
  IF actor IS NULL OR payload->>'intake_actor_hint' IS DISTINCT FROM actor::text THEN
    RAISE EXCEPTION 'experience_auth_required' USING ERRCODE = '42501';
  END IF;
  offer := (payload#>>'{vertical_metadata,listing_id}')::uuid;
  nonce := (payload->>'intake_request_key')::uuid;
  preference := (payload#>>'{preferred_dates,0,date}')::date;
  party := (payload->>'guests_count')::integer;
  IF offer IS NULL OR nonce IS NULL OR preference IS NULL OR NOT pg_catalog.isfinite(preference)
     OR party IS NULL OR party NOT BETWEEN 1 AND 50
     OR guest_name IS NULL OR pg_catalog.char_length(guest_name) NOT BETWEEN 1 AND 120
     OR guest_phone IS NULL OR pg_catalog.char_length(guest_phone) > 40
     OR pg_catalog.char_length(pg_catalog.regexp_replace(guest_phone,'[^0-9]','','g')) NOT BETWEEN 7 AND 20
     OR locale IS NULL OR locale NOT IN ('ru','en','th') THEN
    RAISE EXCEPTION 'experience_request_invalid' USING ERRCODE = '22023';
  END IF;

  digest := pg_catalog.sha256(pg_catalog.convert_to(
    pg_catalog.jsonb_build_array(offer, preference, party, guest_name, guest_phone, locale)::text, 'UTF8'));
  INSERT INTO private.experience_inquiry_receipts(actor_id, request_key, request_id, fingerprint)
  VALUES (actor, nonce, pg_catalog.gen_random_uuid(), digest)
  ON CONFLICT (actor_id, request_key) DO NOTHING RETURNING request_id INTO receipt;

  IF receipt IS NULL THEN
    SELECT request_id, fingerprint INTO STRICT receipt, prior_digest
    FROM private.experience_inquiry_receipts WHERE actor_id = actor AND request_key = nonce;
    IF prior_digest IS DISTINCT FROM digest THEN
      RAISE EXCEPTION 'experience_request_key_conflict' USING ERRCODE = '23505';
    END IF;
    RETURN receipt;
  END IF;

  IF preference < (pg_catalog.now() AT TIME ZONE 'Asia/Bangkok')::date THEN
    RAISE EXCEPTION 'experience_date_invalid' USING ERRCODE = '22023';
  END IF;
  SELECT coalesce(CASE WHEN locale = 'ru' THEN l.name_ru END, l.name_en, l.name_ru)
  INTO offer_title
  FROM public.listings AS l
  WHERE l.id = offer AND l.vertical = 'experience' AND l.is_active IS TRUE
    AND l.approval_status = 'approved' AND l.attributes->>'status' = 'published'
    AND coalesce(pg_catalog.lower(pg_catalog.btrim(l.attributes->>'operating_status')), '')
      NOT IN ('temporarily_closed', 'permanently_closed', 'closed')
  FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'experience_not_public' USING ERRCODE = '22023';
  END IF;
  route := '/experiences/' || offer::text;
  INSERT INTO public.consultation_requests
    (id,user_id,request_type,vertical_id,entry_point,lead_source,name,phone,preferred_language,
     preferred_dates,guests_count,vertical_metadata,status,priority,notes)
  VALUES (receipt,actor,'tour_booking','tours',route,'cta',guest_name,guest_phone,locale,
    pg_catalog.jsonb_build_array(pg_catalog.jsonb_build_object('date',preference,'time','')),party,
    pg_catalog.jsonb_build_object('listing_id',offer,'listing_title',offer_title,'spec_vertical','tour'),
    'pending','normal',pg_catalog.concat_ws(E'\n',offer_title,route,preference::text || ' · ' || party));
  RETURN receipt;
END;
$$;
REVOKE ALL ON FUNCTION public.submit_experience_inquiry(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_experience_inquiry(jsonb) TO authenticated;
COMMIT;
