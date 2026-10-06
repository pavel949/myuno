-- 1. Staff helper
CREATE OR REPLACE FUNCTION public.is_finance_staff(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _uid
    AND role IN ('admin'::app_role,'staff'::app_role,'uno_team'::app_role,'finance'::app_role));
$$;
REVOKE ALL ON FUNCTION public.is_finance_staff(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_finance_staff(uuid) TO authenticated, service_role;

-- 2. Money functions: server/service role only
REVOKE EXECUTE ON FUNCTION public.record_ledger_entries(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.credit_cashback(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.process_payout(uuid, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_booking_with_wallet_payment(uuid, text, timestamptz, numeric, text, uuid, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_order_atomic(text, uuid, uuid, timestamptz, timestamptz, numeric, text, text, jsonb, jsonb, jsonb, jsonb, text, numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_ledger_entries(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.credit_cashback(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.process_payout(uuid, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_booking_with_wallet_payment(uuid, text, timestamptz, numeric, text, uuid, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_order_atomic(text, uuid, uuid, timestamptz, timestamptz, numeric, text, text, jsonb, jsonb, jsonb, jsonb, text, numeric) TO service_role;

-- 3. Staff-only payout wrapper
CREATE OR REPLACE FUNCTION public.admin_process_payout(p_payout_id uuid, p_new_status text, p_payment_reference text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r jsonb;
BEGIN
  IF NOT public.is_finance_staff(auth.uid()) THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  SELECT to_jsonb(x) INTO r FROM public.process_payout(p_payout_id, p_new_status, p_payment_reference) x;
  RETURN r;
END $$;
REVOKE ALL ON FUNCTION public.admin_process_payout(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_process_payout(uuid, text, text) TO authenticated, service_role;

-- 4. Customer order creation through checks (actor from auth.uid, no wallet debit, sane amounts)
CREATE OR REPLACE FUNCTION public.create_order_checked(
  p_order_type text, p_provider_org_id uuid, p_start_at timestamptz, p_end_at timestamptz,
  p_total_amount numeric, p_currency text, p_notes text, p_metadata jsonb, p_items jsonb,
  p_participants jsonb, p_addresses jsonb, p_payment_method text, p_payment_amount numeric,
  p_customer_user_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_customer uuid; v_staff boolean;
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'not_authenticated'); END IF;
  v_staff := public.is_finance_staff(v_uid);
  v_customer := CASE WHEN v_staff AND p_customer_user_id IS NOT NULL THEN p_customer_user_id ELSE v_uid END;
  IF p_total_amount IS NULL OR p_total_amount <= 0 OR p_total_amount > 100000000 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_amount'); END IF;
  IF p_payment_amount IS NOT NULL AND (p_payment_amount < 0 OR p_payment_amount > p_total_amount) THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_amount'); END IF;
  IF NOT v_staff AND p_payment_method = 'wallet' THEN
    RETURN jsonb_build_object('success', false, 'error', 'wallet_payment_not_allowed'); END IF;
  IF p_provider_org_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.orgs WHERE id = p_provider_org_id AND coalesce(is_active, true)) THEN
    RETURN jsonb_build_object('success', false, 'error', 'org_not_found'); END IF;
  RETURN public.create_order_atomic(p_order_type, v_customer, p_provider_org_id, p_start_at, p_end_at,
    p_total_amount, p_currency, p_notes, p_metadata, p_items, p_participants, p_addresses,
    p_payment_method, p_payment_amount);
END $$;
REVOKE ALL ON FUNCTION public.create_order_checked(text, uuid, timestamptz, timestamptz, numeric, text, text, jsonb, jsonb, jsonb, jsonb, text, numeric, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_order_checked(text, uuid, timestamptz, timestamptz, numeric, text, text, jsonb, jsonb, jsonb, jsonb, text, numeric, uuid) TO authenticated, service_role;

-- 5. Customers may only cancel their orders, not edit them
CREATE OR REPLACE FUNCTION public.guard_customer_order_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL OR public.is_finance_staff(v_uid) THEN RETURN NEW; END IF;
  IF EXISTS (SELECT 1 FROM public.org_members WHERE org_id = OLD.provider_org_id AND user_id = v_uid) THEN RETURN NEW; END IF;
  IF OLD.customer_user_id = v_uid THEN
    IF (to_jsonb(NEW) - 'status' - 'updated_at') IS DISTINCT FROM (to_jsonb(OLD) - 'status' - 'updated_at')
       OR (NEW.status IS DISTINCT FROM OLD.status AND NEW.status::text <> 'cancelled') THEN
      RAISE EXCEPTION 'customers can only cancel orders' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_guard_customer_order_update ON public.orders;
CREATE TRIGGER trg_guard_customer_order_update BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.guard_customer_order_update();

-- 6. Trusted provider -> org mapping
CREATE TABLE IF NOT EXISTS public.provider_org_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL UNIQUE REFERENCES public.providers(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.provider_org_links TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.provider_org_links TO authenticated;
GRANT ALL ON public.provider_org_links TO service_role;
ALTER TABLE public.provider_org_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read provider org links" ON public.provider_org_links FOR SELECT USING (true);
CREATE POLICY "Staff manage provider org links" ON public.provider_org_links FOR ALL TO authenticated
  USING (public.is_finance_staff(auth.uid())) WITH CHECK (public.is_finance_staff(auth.uid()));