-- UNEXECUTED disposable PostgreSQL regression. Never run against production.
-- Prerequisites: dedicated database name myuno_cancel_test_*, actual schema/guards,
-- candidate installed as owner, and one owned unpaid pending fixture with no links.
-- psql -v test_order_id=<synthetic UUID> -v test_actor_id=<synthetic UUID> -f thisfile
\set ON_ERROR_STOP on
BEGIN;
DO $$ BEGIN
 IF current_database() NOT LIKE 'myuno_cancel_test_%' THEN
  RAISE EXCEPTION 'disposable_database_required';
 END IF;
END $$;
SELECT set_config('test.order_id', :'test_order_id', true);
SELECT set_config('request.jwt.claim.sub', :'test_actor_id', true);
SELECT set_config('request.jwt.claims', json_build_object('sub', :'test_actor_id', 'role', 'authenticated')::text, true);
-- Exercise dormant transition body only in this transaction; rollback restores the
-- mandatory cutover refusal. This does not establish production eligibility.
DO $$ DECLARE source text; patched text; BEGIN
 source := pg_get_functiondef('private.cancel_customer_unpaid_order(uuid,timestamptz,uuid)'::regprocedure);
 patched := replace(source, 'RAISE EXCEPTION ''checkout_cutover_and_historical_reconciliation_required'';', 'NULL;');
 IF patched=source THEN RAISE EXCEPTION 'cutover_test_fixture_mismatch'; END IF;
 EXECUTE patched;
END $$;
CREATE FUNCTION pg_temp.suppress_cancellation_history() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RETURN NULL; END $$;
CREATE TRIGGER cancellation_history_suppression_test BEFORE INSERT ON public.order_status_history
 FOR EACH ROW EXECUTE FUNCTION pg_temp.suppress_cancellation_history();
DO $$
DECLARE fixture public.orders%ROWTYPE; request_id uuid := '00000000-0000-4000-8000-000000000140';
 caught boolean := false;
BEGIN
 SELECT * INTO STRICT fixture FROM public.orders WHERE id=current_setting('test.order_id')::uuid;
 IF fixture.status::text<>'pending' OR fixture.customer_user_id IS DISTINCT FROM auth.uid() OR fixture.paid_at IS NOT NULL THEN
  RAISE EXCEPTION 'invalid_unpaid_synthetic_fixture';
 END IF;
 BEGIN
  PERFORM private.cancel_customer_unpaid_order(fixture.id,fixture.updated_at,request_id);
 EXCEPTION WHEN OTHERS THEN
  IF SQLERRM <> 'cancellation_history_not_confirmed' THEN RAISE; END IF;
  caught := true;
 END;
 IF NOT caught THEN RAISE EXCEPTION 'suppressed_history_was_falsely_confirmed'; END IF;
 IF EXISTS(SELECT 1 FROM public.order_status_history WHERE id=request_id) OR
    NOT EXISTS(SELECT 1 FROM public.orders WHERE id=fixture.id AND status=fixture.status AND updated_at IS NOT DISTINCT FROM fixture.updated_at) THEN
  RAISE EXCEPTION 'suppressed_history_did_not_roll_back_order';
 END IF;
END $$;
ROLLBACK;
