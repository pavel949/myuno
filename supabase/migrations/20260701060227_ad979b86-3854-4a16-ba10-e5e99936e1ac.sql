
-- Revoke EXECUTE from anon and PUBLIC on all SECURITY DEFINER functions in public schema.
-- Keeps EXECUTE for authenticated and service_role. Triggers still fire (they don't need EXECUTE grants).
-- Fixes SUPA_anon_security_definer_function_executable findings across the DB.
DO $$
DECLARE
  r record;
  sig text;
BEGIN
  FOR r IN
    SELECT p.oid,
           n.nspname,
           p.proname,
           pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
      AND (has_function_privilege('anon', p.oid, 'EXECUTE')
        OR has_function_privilege('public', p.oid, 'EXECUTE'))
  LOOP
    sig := format('%I.%I(%s)', r.nspname, r.proname, r.args);
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC', sig);
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon', sig);
    -- Ensure authenticated & service_role retain access for RLS helpers / RPCs
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', sig);
  END LOOP;
END
$$;
