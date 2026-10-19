-- Security-preserving stop switch, not restoration of orphan-order success.
-- Existing inventory and explicit links remain untouched. Nonproperty creation
-- retains the existing writer. Review before execution on the connected DB.
BEGIN;
DO $rollback$
DECLARE definition text;
BEGIN
  definition := pg_get_functiondef('public.create_order_atomic(text,uuid,uuid,timestamptz,timestamptz,numeric,text,text,jsonb,jsonb,jsonb,jsonb,text,numeric)'::regprocedure);
  IF position('Atomic property inventory contract v1.' IN definition) = 0
    OR position('property_inventory_not_committed' IN definition) = 0 THEN
    RAISE EXCEPTION 'atomic_property_order_rollback_drift';
  END IF;
  definition := replace(definition, '  -- Create order', $stop$  IF p_order_type = 'property' THEN
    RETURN jsonb_build_object('success', false, 'error', 'property_order_writer_disabled');
  END IF;
  -- Create order$stop$);
  EXECUTE definition;
END
$rollback$;
COMMIT;
