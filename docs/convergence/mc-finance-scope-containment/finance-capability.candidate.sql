-- SOURCE CANDIDATE: separate review and action-time RLS/EXECUTE approval.
-- No business rows, memberships, roles, amounts or Space enforcement are changed.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
CREATE SCHEMA mc_finance_private;
REVOKE ALL ON SCHEMA mc_finance_private FROM PUBLIC,anon;
GRANT USAGE ON SCHEMA mc_finance_private TO authenticated;
ALTER TABLE public.management_companies ADD COLUMN finance_capabilities_enforced boolean NOT NULL DEFAULT false;
COMMENT ON COLUMN public.management_companies.finance_capabilities_enforced IS
 'Trusted finance-capability rollout; separate from Space enforcement; no company is activated by the schema candidate';
CREATE FUNCTION mc_finance_private.guard_activation() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF current_user IN ('postgres','service_role','supabase_admin')
 OR EXISTS(SELECT 1 FROM pg_catalog.pg_roles WHERE rolname=current_user AND rolsuper) THEN RETURN NEW; END IF;
 IF (TG_OP='INSERT' AND NEW.finance_capabilities_enforced IS TRUE)
 OR (TG_OP='UPDATE' AND NEW.finance_capabilities_enforced IS DISTINCT FROM OLD.finance_capabilities_enforced) THEN
  RAISE EXCEPTION 'finance capability activation requires separately approved trusted configuration' USING ERRCODE='42501';
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION mc_finance_private.guard_activation() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER zz_guard_finance_capability_activation BEFORE INSERT OR UPDATE ON public.management_companies
 FOR EACH ROW EXECUTE FUNCTION mc_finance_private.guard_activation();

CREATE FUNCTION mc_finance_private.employee_context()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT auth.uid() IS NOT NULL AND (
  EXISTS(SELECT 1 FROM public.management_company_members m WHERE m.user_id=auth.uid())
  OR EXISTS(SELECT 1 FROM public.user_roles r WHERE r.user_id=auth.uid() AND r.role::text='uno_team'))
$$;
REVOKE ALL ON FUNCTION mc_finance_private.employee_context() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION mc_finance_private.employee_context() TO authenticated;

-- Scope rollout to an explicitly activated resource company or an employee of
-- one. The latter prevents newly onboarded staff from forging an owner_id on a
-- foreign/unassigned company's financial row. Other actors/companies stay legacy.
CREATE FUNCTION mc_finance_private.governed(p_company uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.management_companies c WHERE c.id=p_company AND c.finance_capabilities_enforced IS TRUE)
 OR EXISTS(SELECT 1 FROM public.management_company_members m JOIN public.management_companies c ON c.id=m.company_id
  WHERE m.user_id=auth.uid() AND c.finance_capabilities_enforced IS TRUE)
$$;
REVOKE ALL ON FUNCTION mc_finance_private.governed(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION mc_finance_private.governed(uuid) TO authenticated;

-- This intersects existing policies. A true result never creates a permissive
-- grant. Foreign-company staff cannot borrow a capability from their own company.
CREATE FUNCTION mc_finance_private.company_capability(p_company uuid,p_action text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL OR p_action NOT IN ('view','edit') OR p_action IS NULL THEN RETURN false; END IF;
 IF public.actor_has_platform_admin() THEN RETURN true; END IF;
 IF NOT mc_finance_private.governed(p_company) THEN RETURN true; END IF;
 IF NOT mc_finance_private.employee_context() THEN RETURN true; END IF;
 RETURN p_company IS NOT NULL
  AND EXISTS(SELECT 1 FROM public.management_companies c WHERE c.id=p_company AND c.is_active IS TRUE)
  AND public.mc_can_access_e28_private(auth.uid(),p_company,'finance',p_action);
END $$;
REVOKE ALL ON FUNCTION mc_finance_private.company_capability(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION mc_finance_private.company_capability(uuid,text) TO authenticated;

CREATE FUNCTION mc_finance_private.account_read(p_account uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE a public.ledger_accounts; actor uuid:=auth.uid();
BEGIN
 IF actor IS NULL THEN RETURN false; END IF;
 SELECT * INTO a FROM public.ledger_accounts WHERE id=p_account;
 IF NOT FOUND THEN RETURN false; END IF;
 IF public.actor_has_platform_admin() OR a.owner_user_id=actor
 OR EXISTS(SELECT 1 FROM public.org_members m WHERE m.org_id=a.owner_org_id AND m.user_id=actor) THEN RETURN true; END IF;
 RETURN mc_finance_private.company_capability(a.management_company_id,'view');
END $$;
REVOKE ALL ON FUNCTION mc_finance_private.account_read(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION mc_finance_private.account_read(uuid) TO authenticated;

CREATE FUNCTION mc_finance_private.entry_read(p_debit uuid,p_credit uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid();
BEGIN
 IF actor IS NULL THEN RETURN false; END IF;
 IF public.actor_has_platform_admin() THEN RETURN true; END IF;
 -- An owned wallet/org party still reads its own transaction even when the
 -- counterpart is a company for which the actor has no employee finance grant.
 IF EXISTS(SELECT 1 FROM public.ledger_accounts a WHERE a.id=ANY(ARRAY[p_debit,p_credit])
  AND (a.owner_user_id=actor OR EXISTS(SELECT 1 FROM public.org_members m
    WHERE m.org_id=a.owner_org_id AND m.user_id=actor))) THEN RETURN true; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.ledger_accounts a WHERE a.id=ANY(ARRAY[p_debit,p_credit])
  AND mc_finance_private.governed(a.management_company_id)) THEN RETURN true; END IF;
 IF NOT mc_finance_private.employee_context() THEN RETURN true; END IF;
 -- Preserve the existing party-based ledger model: a manager with an authorized
 -- company party may read a cross-company transaction. Never require authority
 -- over the counterparty, or grant access merely because that party is unlinked.
 RETURN EXISTS(SELECT 1 FROM public.ledger_accounts a
  JOIN public.management_company_members m ON m.company_id=a.management_company_id
  WHERE a.id=ANY(ARRAY[p_debit,p_credit]) AND m.user_id=actor AND m.is_active IS TRUE
  AND mc_finance_private.company_capability(a.management_company_id,'view'));
END $$;
REVOKE ALL ON FUNCTION mc_finance_private.entry_read(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION mc_finance_private.entry_read(uuid,uuid) TO authenticated;

CREATE FUNCTION mc_finance_private.property_row(p_id uuid,p_property uuid,p_owner uuid,p_action text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE company uuid; owner uuid; provider uuid; actor uuid:=auth.uid();
BEGIN
 IF actor IS NULL OR p_action IS NULL OR p_action NOT IN ('view','edit') THEN RETURN false; END IF;
 SELECT p.management_company_id,p.owner_id,p.provider_id INTO company,owner,provider
 FROM public.properties p WHERE p.id=p_property;
 IF NOT FOUND THEN RETURN false; END IF;
 IF public.actor_has_platform_admin() OR owner=actor
 OR EXISTS(SELECT 1 FROM public.providers pr WHERE pr.id=provider AND pr.user_id=actor) THEN RETURN true; END IF;
 -- Financial-row owner_id can be caller-assigned under legacy policies. It
 -- cannot establish independent employee ownership, including preactivation rows.
 IF NOT mc_finance_private.governed(company) THEN RETURN true; END IF;
 -- A governed resource also rejects guest/self-owner financial forgery.
 RETURN company IS NOT NULL AND mc_finance_private.company_capability(company,p_action)
  AND public.actor_can_operate_property(p_property,company,'finance',p_action);
END $$;
REVOKE ALL ON FUNCTION mc_finance_private.property_row(uuid,uuid,uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION mc_finance_private.property_row(uuid,uuid,uuid,text) TO authenticated;

-- Legacy booking owner_id is caller-supplied. An unreceipted booking must not
-- let a governed employee invoke trusted income/ledger triggers by claiming it.
-- Managers use the checked booking commands; finance edit is not booking authority.
CREATE FUNCTION mc_finance_private.booking_mutation(p_property uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE company uuid; owner uuid; provider uuid; actor uuid:=auth.uid();
BEGIN
 IF actor IS NULL THEN RETURN false; END IF;
 SELECT p.management_company_id,p.owner_id,p.provider_id INTO company,owner,provider
 FROM public.properties p WHERE p.id=p_property;
 IF NOT FOUND THEN RETURN false; END IF;
 IF public.actor_has_platform_admin() OR owner=actor
 OR EXISTS(SELECT 1 FROM public.providers pr WHERE pr.id=provider AND pr.user_id=actor) THEN RETURN true; END IF;
 IF NOT mc_finance_private.governed(company) THEN RETURN true; END IF;
 RETURN NOT mc_finance_private.employee_context();
END $$;
REVOKE ALL ON FUNCTION mc_finance_private.booking_mutation(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION mc_finance_private.booking_mutation(uuid) TO authenticated;

-- Existing permissive policies and financial writers are retained. Ledger DML
-- remains governed by its existing admin/service-only policies; no grant added.
CREATE POLICY employee_finance_account_read ON public.ledger_accounts AS RESTRICTIVE FOR SELECT TO authenticated
 USING(mc_finance_private.account_read(id));
CREATE POLICY employee_finance_entry_read ON public.ledger_entries AS RESTRICTIVE FOR SELECT TO authenticated
 USING(mc_finance_private.entry_read(debit_account_id,credit_account_id));
CREATE POLICY employee_finance_row_read ON public.property_financials AS RESTRICTIVE FOR SELECT TO authenticated
 USING(mc_finance_private.property_row(id,property_id,owner_id,'view'));
CREATE POLICY employee_finance_row_insert ON public.property_financials AS RESTRICTIVE FOR INSERT TO authenticated
 WITH CHECK(mc_finance_private.property_row(id,property_id,owner_id,'edit'));
CREATE POLICY employee_finance_row_update ON public.property_financials AS RESTRICTIVE FOR UPDATE TO authenticated
 USING(mc_finance_private.property_row(id,property_id,owner_id,'edit'))
 WITH CHECK(mc_finance_private.property_row(id,property_id,owner_id,'edit'));
CREATE POLICY employee_finance_row_delete ON public.property_financials AS RESTRICTIVE FOR DELETE TO authenticated
 USING(mc_finance_private.property_row(id,property_id,owner_id,'edit'));
CREATE POLICY employee_finance_booking_insert ON public.property_bookings AS RESTRICTIVE FOR INSERT TO authenticated
 WITH CHECK(mc_finance_private.booking_mutation(property_id));
CREATE POLICY employee_finance_booking_update ON public.property_bookings AS RESTRICTIVE FOR UPDATE TO authenticated
 USING(mc_finance_private.booking_mutation(property_id))
 WITH CHECK(mc_finance_private.booking_mutation(property_id));
CREATE POLICY employee_finance_booking_delete ON public.property_bookings AS RESTRICTIVE FOR DELETE TO authenticated
 USING(mc_finance_private.booking_mutation(property_id));
COMMIT;
