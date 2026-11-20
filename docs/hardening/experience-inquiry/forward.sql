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
COMMIT;
