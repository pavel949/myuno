-- Restrictive stop, not restoration of membership-only finance access.
-- Existing owner/customer/provider/admin paths in row/account guards remain.
BEGIN;
SET LOCAL lock_timeout='5s';
CREATE OR REPLACE FUNCTION mc_finance_private.company_capability(p_company uuid,p_action text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL OR p_action IS NULL OR p_action NOT IN ('view','edit') THEN RETURN false; END IF;
 IF public.actor_has_platform_admin() THEN RETURN true; END IF;
 IF NOT mc_finance_private.governed(p_company) THEN RETURN true; END IF;
 RETURN NOT mc_finance_private.employee_context();
END $$;
REVOKE ALL ON FUNCTION mc_finance_private.company_capability(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION mc_finance_private.company_capability(uuid,text) TO authenticated;
COMMIT;
