-- SOURCE CANDIDATE. Separate schema/trigger/EXECUTE and activation approval.
-- Depends on finance-capability + the reviewed checked reservation receipt
-- contract. No company/property/actor is activated, no business row is changed.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
DO $$ BEGIN
 IF to_regprocedure('mc_finance_private.governed(uuid)') IS NULL
 OR to_regprocedure('mc_finance_private.employee_context()') IS NULL
 OR to_regclass('pms_commands.manual_booking_receipts') IS NULL THEN
  RAISE EXCEPTION 'reviewed finance and reservation receipt prerequisites required'; END IF;
END $$;

-- The resource flag governs every signed-in actor on that resource. The actor
-- flag additionally contains an activated employee's foreign/unassigned paths.
-- Booking.owner_id/guest_id are not proof of physical property ownership.
CREATE FUNCTION mc_finance_private.booking_requires_receipt(p_property uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE company uuid; owner uuid; provider uuid; actor uuid:=auth.uid();
BEGIN
 IF actor IS NULL THEN RETURN false; END IF;
 SELECT p.management_company_id,p.owner_id,p.provider_id INTO company,owner,provider
 FROM public.properties p WHERE p.id=p_property;
 IF NOT FOUND THEN RETURN true; END IF;
 IF public.actor_has_platform_admin() OR owner=actor OR EXISTS(
  SELECT 1 FROM public.providers pr WHERE pr.id=provider AND pr.user_id=actor
 ) THEN RETURN false; END IF;
 RETURN EXISTS(SELECT 1 FROM public.management_companies c
  WHERE c.id=company AND c.finance_capabilities_enforced IS TRUE)
  OR (mc_finance_private.employee_context() AND mc_finance_private.governed(company));
END $$;
REVOKE ALL ON FUNCTION mc_finance_private.booking_requires_receipt(uuid) FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION mc_finance_private.booking_receipt_executing(p_property uuid,p_order uuid,p_external text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE external_order uuid; linked uuid;
BEGIN
 IF auth.uid() IS NULL THEN RETURN false; END IF;
 IF p_external ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
  external_order:=p_external::uuid;
 END IF;
 IF p_order IS NOT NULL AND external_order IS NOT NULL AND p_order<>external_order THEN RETURN false; END IF;
 linked:=coalesce(p_order,external_order);
 IF linked IS NULL THEN RETURN false; END IF;
 RETURN EXISTS(SELECT 1 FROM pms_commands.manual_booking_receipts r
  WHERE r.property_id=p_property AND r.order_id=linked
  AND r.command_kind IN ('create','change') AND r.executing IS TRUE
  AND r.actor_id=auth.uid() AND r.transaction_id=txid_current());
END $$;
REVOKE ALL ON FUNCTION mc_finance_private.booking_receipt_executing(uuid,uuid,text) FROM PUBLIC,anon,authenticated,service_role;

-- Do not trust current_user: the legacy order bridge and income producers are
-- SECURITY DEFINER. The authenticated initiating actor survives that role change.
CREATE FUNCTION mc_finance_private.guard_booking_initiator() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL THEN
  IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
 END IF;
 IF TG_OP<>'INSERT' AND mc_finance_private.booking_requires_receipt(OLD.property_id)
 AND NOT mc_finance_private.booking_receipt_executing(OLD.property_id,OLD.order_id,OLD.external_id) THEN
  RAISE EXCEPTION 'governed booking mutations require an executing checked reservation command' USING ERRCODE='42501'; END IF;
 IF TG_OP<>'DELETE' AND mc_finance_private.booking_requires_receipt(NEW.property_id)
 AND NOT mc_finance_private.booking_receipt_executing(NEW.property_id,NEW.order_id,NEW.external_id) THEN
  RAISE EXCEPTION 'governed booking mutations require an executing checked reservation command' USING ERRCODE='42501'; END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END $$;
REVOKE ALL ON FUNCTION mc_finance_private.guard_booking_initiator() FROM PUBLIC,anon,authenticated,service_role;
-- Runs before legacy BEFORE/AFTER booking side effects. OLD and NEW checks also
-- prevent detaching/reparenting a governed row to escape its command boundary.
CREATE TRIGGER aa_guard_governed_booking_initiator BEFORE INSERT OR UPDATE OR DELETE ON public.property_bookings
 FOR EACH ROW EXECUTE FUNCTION mc_finance_private.guard_booking_initiator();
COMMIT;
