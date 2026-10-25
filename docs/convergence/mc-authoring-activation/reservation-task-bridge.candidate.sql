-- SOURCE CANDIDATE. Separate inventory/task review and activation approval.
-- Canonical booking/task rows only; no assignments, notifications or costs.
BEGIN;
CREATE FUNCTION pms_commands.guard_reservation_task_lifecycle()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.properties p WHERE p.id=NEW.property_id
   AND p.checked_task_commands_enforced IS TRUE) THEN RETURN NEW; END IF;
 -- This is a downstream effect of an authorized checked change in this exact
 -- transaction. A client marker or an arbitrary booking external_id is no grant.
 IF NOT EXISTS(SELECT 1 FROM pms_commands.manual_booking_receipts r
   JOIN public.orders o ON o.id=r.order_id
   WHERE r.property_id=NEW.property_id AND r.order_id::text=NEW.external_id
   AND r.command_kind='change' AND r.executing AND r.transaction_id=txid_current()
   AND r.actor_id=auth.uid()) THEN RETURN NEW; END IF;
 IF (NEW.check_in IS DISTINCT FROM OLD.check_in OR NEW.check_out IS DISTINCT FROM OLD.check_out)
 AND EXISTS(SELECT 1 FROM public.property_operational_tasks t WHERE t.booking_id=NEW.id
   AND t.property_id=NEW.property_id) THEN
  RAISE EXCEPTION 'reservation task schedule reconciliation required' USING ERRCODE='55000';
 END IF;
 IF NEW.status IS DISTINCT FROM 'cancelled' OR OLD.status IS NOT DISTINCT FROM NEW.status
 THEN RETURN NEW; END IF;
 -- Lock in a fixed order against simultaneous completion. Completed work is
 -- retained; nonzero expenses require a separately governed reconciliation.
 PERFORM t.id FROM public.property_operational_tasks t WHERE t.booking_id=NEW.id
   AND t.property_id=NEW.property_id AND t.status IN ('pending','in_progress')
   ORDER BY t.id FOR UPDATE;
 IF EXISTS(SELECT 1 FROM public.property_operational_tasks t WHERE t.booking_id=NEW.id
   AND t.property_id=NEW.property_id AND t.status IN ('pending','in_progress')
   AND (coalesce(t.actual_cost,0)<>0 OR t.expense_created IS TRUE)) THEN
  RAISE EXCEPTION 'reservation task expense reconciliation required' USING ERRCODE='55000';
 END IF;
 UPDATE public.property_operational_tasks SET status='cancelled'
 WHERE booking_id=NEW.id AND property_id=NEW.property_id AND status IN ('pending','in_progress');
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION pms_commands.guard_reservation_task_lifecycle() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER zz_reservation_task_lifecycle AFTER UPDATE OF status,check_in,check_out ON public.property_bookings
 FOR EACH ROW EXECUTE FUNCTION pms_commands.guard_reservation_task_lifecycle();
COMMIT;
