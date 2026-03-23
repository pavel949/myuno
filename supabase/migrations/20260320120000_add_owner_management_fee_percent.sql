-- owner_management_settings
-- Per-owner management fee % (individual % per owner in CRM, configurable without code changes).
-- Used when property_management_terms.commission_rate is null — fallback chain:
-- pmt.commission_rate -> owner_management_settings.management_fee_percent -> mc.default_commission_rate

CREATE TABLE public.owner_management_settings (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id              UUID        NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  company_id              UUID        NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  management_fee_percent  NUMERIC(5,2) NOT NULL DEFAULT 15.00
    CHECK (management_fee_percent >= 0 AND management_fee_percent <= 100),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(contact_id, company_id)
);

COMMENT ON COLUMN public.owner_management_settings.management_fee_percent IS
  'Individual management fee % per owner. Default 15%. Used when no property-level terms exist.';

CREATE INDEX idx_owner_management_settings_contact ON public.owner_management_settings(contact_id);
CREATE INDEX idx_owner_management_settings_company ON public.owner_management_settings(company_id);

ALTER TABLE public.owner_management_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "oms_select" ON public.owner_management_settings
  FOR SELECT TO authenticated
  USING (company_id IN (
    SELECT company_id FROM public.management_company_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "oms_insert" ON public.owner_management_settings
  FOR INSERT TO authenticated
  WITH CHECK (company_id IN (
    SELECT company_id FROM public.management_company_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "oms_update" ON public.owner_management_settings
  FOR UPDATE TO authenticated
  USING (company_id IN (
    SELECT company_id FROM public.management_company_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "oms_delete" ON public.owner_management_settings
  FOR DELETE TO authenticated
  USING (company_id IN (
    SELECT company_id FROM public.management_company_members WHERE user_id = auth.uid()
  ));

CREATE TRIGGER set_owner_management_settings_updated_at
  BEFORE UPDATE ON public.owner_management_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

-- Update record_ledger_entries: fallback to owner_management_settings when pmt.commission_rate is null
CREATE OR REPLACE FUNCTION public.record_ledger_entries(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_platform_account_id uuid;
  v_customer_account_id uuid;
  v_vendor_account_id uuid;
  v_mc_account_id uuid;
  v_platform_fee numeric;
  v_vendor_amount numeric;
  v_mc_commission numeric := 0;
  v_owner_amount numeric;
  v_property_id uuid;
  v_mc_id uuid;
  v_owner_contact_id uuid;
  v_commission_rate numeric;
  v_commission_type text;
  v_commission_base text;
BEGIN
  SELECT id, total_amount, platform_fee_amount, customer_user_id, provider_org_id, currency
  INTO v_order
  FROM orders WHERE id = p_order_id;

  IF v_order IS NULL THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id;
  END IF;

  IF EXISTS (SELECT 1 FROM ledger_entries WHERE order_id = p_order_id LIMIT 1) THEN
    RETURN;
  END IF;

  v_platform_fee := COALESCE(v_order.platform_fee_amount, ROUND(v_order.total_amount * 0.10, 2));
  v_vendor_amount := v_order.total_amount - v_platform_fee;

  SELECT (oi.metadata->>'property_id')::uuid INTO v_property_id
  FROM order_items oi
  WHERE oi.order_id = p_order_id AND oi.item_type = 'property'
  LIMIT 1;

  IF v_property_id IS NOT NULL THEN
    SELECT p.management_company_id, p.owner_contact_id INTO v_mc_id, v_owner_contact_id
    FROM properties p WHERE p.id = v_property_id;

    IF v_mc_id IS NOT NULL THEN
      SELECT pmt.commission_rate, pmt.commission_type, pmt.commission_base
      INTO v_commission_rate, v_commission_type, v_commission_base
      FROM property_management_terms pmt
      WHERE pmt.property_id = v_property_id
        AND pmt.status = 'active'
        AND (pmt.valid_from IS NULL OR pmt.valid_from <= CURRENT_DATE)
        AND (pmt.valid_until IS NULL OR pmt.valid_until >= CURRENT_DATE)
      ORDER BY pmt.created_at DESC
      LIMIT 1;

      -- Fallback: per-owner management_fee_percent, then MC default
      IF v_commission_rate IS NULL THEN
        SELECT oms.management_fee_percent INTO v_commission_rate
        FROM owner_management_settings oms
        WHERE oms.contact_id = v_owner_contact_id AND oms.company_id = v_mc_id
        LIMIT 1;
      END IF;

      IF v_commission_rate IS NULL THEN
        SELECT mc.default_commission_rate INTO v_commission_rate
        FROM management_companies mc WHERE mc.id = v_mc_id;
        v_commission_type := 'percent';
        v_commission_base := 'net';
      ELSE
        v_commission_type := COALESCE(v_commission_type, 'percent');
        v_commission_base := COALESCE(v_commission_base, 'net');
      END IF;

      IF v_commission_rate IS NOT NULL AND v_commission_rate > 0 THEN
        IF v_commission_type = 'fixed' THEN
          v_mc_commission := LEAST(v_commission_rate, v_vendor_amount);
        ELSE
          IF v_commission_base = 'gross' THEN
            v_mc_commission := ROUND(v_order.total_amount * (v_commission_rate / 100), 2);
          ELSE
            v_mc_commission := ROUND(v_vendor_amount * (v_commission_rate / 100), 2);
          END IF;
          v_mc_commission := LEAST(v_mc_commission, v_vendor_amount);
        END IF;
      END IF;
    END IF;
  END IF;

  v_owner_amount := v_vendor_amount - v_mc_commission;

  SELECT id INTO v_platform_account_id FROM ledger_accounts WHERE account_type = 'platform_revenue' LIMIT 1;
  IF v_platform_account_id IS NULL THEN
    INSERT INTO ledger_accounts (account_type, currency) VALUES ('platform_revenue', COALESCE(v_order.currency, 'THB'))
    RETURNING id INTO v_platform_account_id;
  END IF;

  SELECT id INTO v_customer_account_id FROM ledger_accounts 
  WHERE owner_user_id = v_order.customer_user_id AND account_type = 'customer' LIMIT 1;
  IF v_customer_account_id IS NULL AND v_order.customer_user_id IS NOT NULL THEN
    INSERT INTO ledger_accounts (owner_user_id, account_type, currency) 
    VALUES (v_order.customer_user_id, 'customer', COALESCE(v_order.currency, 'THB'))
    RETURNING id INTO v_customer_account_id;
  END IF;

  IF v_order.provider_org_id IS NOT NULL THEN
    SELECT id INTO v_vendor_account_id FROM ledger_accounts
    WHERE owner_org_id = v_order.provider_org_id AND account_type = 'vendor_balance' LIMIT 1;
    IF v_vendor_account_id IS NULL THEN
      INSERT INTO ledger_accounts (owner_org_id, account_type, currency)
      VALUES (v_order.provider_org_id, 'vendor_balance', COALESCE(v_order.currency, 'THB'))
      RETURNING id INTO v_vendor_account_id;
    END IF;
  END IF;

  IF v_vendor_account_id IS NULL THEN
    v_vendor_account_id := v_platform_account_id;
  END IF;

  IF v_mc_commission > 0 AND v_mc_id IS NOT NULL THEN
    SELECT id INTO v_mc_account_id FROM ledger_accounts
    WHERE management_company_id = v_mc_id AND account_type = 'mc_balance' LIMIT 1;
    IF v_mc_account_id IS NULL THEN
      INSERT INTO ledger_accounts (management_company_id, account_type, currency)
      VALUES (v_mc_id, 'mc_balance', COALESCE(v_order.currency, 'THB'))
      RETURNING id INTO v_mc_account_id;
    END IF;
  END IF;

  IF v_customer_account_id IS NOT NULL AND v_platform_fee > 0 THEN
    INSERT INTO ledger_entries (debit_account_id, credit_account_id, amount, currency, order_id, entry_type, description)
    VALUES (v_customer_account_id, v_platform_account_id, v_platform_fee, 
            COALESCE(v_order.currency, 'THB'), p_order_id, 'platform_fee',
            'Platform fee for order ' || p_order_id::text);
  END IF;

  IF v_customer_account_id IS NOT NULL AND v_owner_amount > 0 THEN
    INSERT INTO ledger_entries (debit_account_id, credit_account_id, amount, currency, order_id, entry_type, description)
    VALUES (v_customer_account_id, v_vendor_account_id, v_owner_amount,
            COALESCE(v_order.currency, 'THB'), p_order_id, 'vendor_payment',
            'Owner payment for order ' || p_order_id::text);
  END IF;

  IF v_customer_account_id IS NOT NULL AND v_mc_commission > 0 AND v_mc_account_id IS NOT NULL THEN
    INSERT INTO ledger_entries (debit_account_id, credit_account_id, amount, currency, order_id, entry_type, description)
    VALUES (v_customer_account_id, v_mc_account_id, v_mc_commission,
            COALESCE(v_order.currency, 'THB'), p_order_id, 'mc_commission',
            'MC commission for order ' || p_order_id::text);
  END IF;
END;
$$;
