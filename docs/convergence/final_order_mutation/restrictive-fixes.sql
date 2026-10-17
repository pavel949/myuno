-- Restrictive containment only. No data changes; no Operating Spaces activation.
DO $$ BEGIN
 IF md5(pg_get_functiondef('public.guard_customer_order_update()'::regprocedure)) <> '124a15c2f1df3a63cf56e0655b857773'
 OR md5(pg_get_functiondef('public.pay_from_wallet_atomic(uuid,numeric,text,text,text,text)'::regprocedure)) <> 'f164348167d6ae87350299ae5f75fa03'
 OR md5(pg_get_functiondef('public.topup_wallet_atomic(uuid,numeric,text,text)'::regprocedure)) <> 'de3fa2e4070c1ea477d12d2b41c14a7e'
 THEN RAISE EXCEPTION 'FINAL order mutation definition drift'; END IF;
END $$;

-- Arbitrary identity/amount wallet primitives are not customer refund/payment APIs.
REVOKE EXECUTE ON FUNCTION public.pay_from_wallet_atomic(uuid,numeric,text,text,text,text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.topup_wallet_atomic(uuid,numeric,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.pay_from_wallet_atomic(uuid,numeric,text,text,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.topup_wallet_atomic(uuid,numeric,text,text) TO service_role;

-- Preserve function signatures and internal callers; reject nonfinite money before writes.
DO $$ DECLARE d text; BEGIN
 d:=pg_get_functiondef('public.pay_from_wallet_atomic(uuid,numeric,text,text,text,text)'::regprocedure);
 d:=replace(d, E'BEGIN\n', E'BEGIN\n  IF p_amount IS NULL OR p_amount <= 0 OR p_amount::text IN (''NaN'',''Infinity'',''-Infinity'') THEN RAISE EXCEPTION ''invalid_wallet_amount'' USING ERRCODE=''22023''; END IF;\n');
 EXECUTE d;
 d:=pg_get_functiondef('public.topup_wallet_atomic(uuid,numeric,text,text)'::regprocedure);
 d:=replace(d, E'BEGIN\n', E'BEGIN\n  IF p_amount IS NULL OR p_amount <= 0 OR p_amount::text IN (''NaN'',''Infinity'',''-Infinity'') THEN RAISE EXCEPTION ''invalid_wallet_amount'' USING ERRCODE=''22023''; END IF;\n');
 EXECUTE d;
END $$;

CREATE OR REPLACE FUNCTION public.guard_customer_order_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE actor uuid:=auth.uid(); claimed_role text; item record;
BEGIN
 claimed_role:=coalesce(nullif(current_setting('request.jwt.claim.role',true),''),
   nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'role','');
 -- session_user, never current_user: SECURITY DEFINER executes as the owner.
 IF claimed_role='service_role' OR (session_user IN ('postgres','supabase_admin') AND actor IS NULL AND claimed_role='') THEN RETURN NEW; END IF;
 IF actor IS NULL THEN RAISE EXCEPTION 'order_actor_required' USING ERRCODE='42501'; END IF;
 IF (to_jsonb(NEW)-'status'-'updated_at') IS DISTINCT FROM (to_jsonb(OLD)-'status'-'updated_at') THEN
   RAISE EXCEPTION 'order_fields_immutable_use_checked_action' USING ERRCODE='42501';
 END IF;
 NEW.updated_at:=now();
 IF NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;
 IF OLD.deleted_at IS NOT NULL THEN RAISE EXCEPTION 'deleted_order_immutable' USING ERRCODE='42501'; END IF;
 -- Customer cancellation is not a refund or cancellation of a live checkout.
 IF OLD.customer_user_id=actor THEN
   IF OLD.status::text NOT IN ('draft','pending') OR NEW.status::text<>'cancelled'
     OR OLD.paid_at IS NOT NULL OR EXISTS(SELECT 1 FROM public.payment_intents p WHERE p.order_id=OLD.id
       AND (p.status::text IN ('processing','succeeded','refunded') OR p.provider_ref IS NOT NULL OR p.provider_session_id IS NOT NULL))
     OR EXISTS(SELECT 1 FROM public.ledger_entries l WHERE l.order_id=OLD.id) THEN
     RAISE EXCEPTION 'customer_cancel_requires_unpaid_waiting_order' USING ERRCODE='42501';
   END IF;
   RETURN NEW;
 END IF;
 IF NOT EXISTS(SELECT 1 FROM public.org_members m WHERE m.org_id=OLD.provider_org_id AND m.user_id=actor AND m.is_active IS TRUE)
   AND NOT public.actor_has_platform_admin() THEN
   RAISE EXCEPTION 'order_fulfillment_actor_required' USING ERRCODE='42501';
 END IF;
 -- Membership cannot bypass property/space booking duty through the definer bridge.
 FOR item IN SELECT oi.resource_id, p.management_company_id FROM public.order_items oi
   LEFT JOIN public.properties p ON p.id=oi.resource_id WHERE oi.order_id=OLD.id AND oi.item_type='property' LOOP
   IF NOT public.actor_has_platform_admin() AND (item.resource_id IS NULL OR item.management_company_id IS NULL
     OR NOT public.actor_can_operate_property(item.resource_id,item.management_company_id,'bookings','edit')) THEN
     RAISE EXCEPTION 'order_property_duty_required' USING ERRCODE='42501';
   END IF;
 END LOOP;
 IF NOT ((OLD.status::text='confirmed' AND NEW.status::text='in_progress')
   OR (OLD.status::text='in_progress' AND NEW.status::text='completed'
     AND EXISTS(SELECT 1 FROM public.payment_intents p WHERE p.order_id=OLD.id AND p.status::text='succeeded'))) THEN
   RAISE EXCEPTION 'order_fulfillment_transition_denied' USING ERRCODE='42501';
 END IF;
 RETURN NEW;
END $$;

-- Payment and accounting truth must not be inserted/edited through the browser,
-- even by a platform admin. Existing checked/internal RPCs execute as owner.
REVOKE INSERT, UPDATE, DELETE ON public.payment_intents, public.ledger_entries FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.payment_intents, public.ledger_entries TO service_role;

CREATE OR REPLACE FUNCTION public.guard_final_order_child_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o public.orders; claimed_role text;
BEGIN
 claimed_role:=coalesce(nullif(current_setting('request.jwt.claim.role',true),''),nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'role','');
 IF claimed_role='service_role' OR (session_user IN ('postgres','supabase_admin') AND auth.uid() IS NULL AND claimed_role='') THEN RETURN NEW; END IF;
 SELECT * INTO o FROM public.orders WHERE id=NEW.order_id FOR UPDATE;
 IF o.id IS NULL OR o.customer_user_id IS DISTINCT FROM auth.uid() OR o.status::text NOT IN ('draft','pending')
   OR o.deleted_at IS NOT NULL OR o.paid_at IS NOT NULL OR EXISTS(SELECT 1 FROM public.payment_intents p WHERE p.order_id=o.id
     AND (p.status::text IN ('processing','succeeded','refunded') OR p.provider_ref IS NOT NULL OR p.provider_session_id IS NOT NULL)) THEN
   RAISE EXCEPTION 'order_children_frozen' USING ERRCODE='42501';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER final_order_items_insert BEFORE INSERT ON public.order_items FOR EACH ROW EXECUTE FUNCTION public.guard_final_order_child_insert();
CREATE TRIGGER final_order_participants_insert BEFORE INSERT ON public.order_participants FOR EACH ROW EXECUTE FUNCTION public.guard_final_order_child_insert();
CREATE TRIGGER final_order_addresses_insert BEFORE INSERT ON public.order_addresses FOR EACH ROW EXECUTE FUNCTION public.guard_final_order_child_insert();

CREATE OR REPLACE FUNCTION public.guard_final_property_booking_mutation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE claimed_role text; persisted_owner uuid;
BEGIN
 claimed_role:=coalesce(nullif(current_setting('request.jwt.claim.role',true),''),nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'role','');
 IF claimed_role='service_role' OR (session_user IN ('postgres','supabase_admin') AND auth.uid() IS NULL AND claimed_role='') THEN
   IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
 END IF;
 -- Nested canonical projections run under their existing checked parent boundary.
 IF pg_trigger_depth()>1 THEN IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW; END IF;
 IF TG_OP='DELETE' THEN
   IF OLD.order_id IS NOT NULL OR OLD.external_id IS NOT NULL OR OLD.deposit_paid_at IS NOT NULL OR OLD.status NOT IN ('cancelled','rejected','expired') THEN
     RAISE EXCEPTION 'linked_or_live_booking_delete_denied' USING ERRCODE='42501';
   END IF;
   RETURN OLD;
 END IF;
 SELECT owner_id INTO persisted_owner FROM public.properties WHERE id=NEW.property_id;
 IF auth.uid() IS NULL OR persisted_owner IS DISTINCT FROM auth.uid() OR NEW.owner_id IS DISTINCT FROM persisted_owner THEN
   RAISE EXCEPTION 'booking_persisted_owner_required' USING ERRCODE='42501';
 END IF;
 IF TG_OP='INSERT' THEN
   IF NEW.order_id IS NOT NULL OR NEW.external_id IS NOT NULL OR NEW.deposit_paid_at IS NOT NULL OR NEW.refund_processed_at IS NOT NULL
     OR coalesce(NEW.refund_amount,0)<>0 OR NEW.deposit_stripe_session_id IS NOT NULL OR NEW.refund_status IS NOT NULL THEN
     RAISE EXCEPTION 'booking_financial_claim_denied' USING ERRCODE='42501';
   END IF;
 ELSE
   IF (to_jsonb(NEW)-'notes'-'guest_name'-'guest_phone'-'guest_email'-'updated_at') IS DISTINCT FROM
      (to_jsonb(OLD)-'notes'-'guest_name'-'guest_phone'-'guest_email'-'updated_at') THEN
     RAISE EXCEPTION 'booking_mutation_requires_checked_action' USING ERRCODE='42501';
   END IF;
 END IF;
 NEW.updated_at:=now(); RETURN NEW;
END $$;
CREATE TRIGGER final_property_booking_mutation BEFORE INSERT OR UPDATE OR DELETE ON public.property_bookings
 FOR EACH ROW EXECUTE FUNCTION public.guard_final_property_booking_mutation();
REVOKE ALL ON FUNCTION public.guard_final_order_child_insert(), public.guard_final_property_booking_mutation() FROM PUBLIC,anon,authenticated;