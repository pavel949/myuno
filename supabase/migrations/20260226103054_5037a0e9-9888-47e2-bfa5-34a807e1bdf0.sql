
-- Phase 3: MC Commission Integration into Ledger

-- 1. Add management_company_id to ledger_accounts
ALTER TABLE public.ledger_accounts 
  ADD COLUMN IF NOT EXISTS management_company_id UUID REFERENCES public.management_companies(id);

-- 2. Update CHECK constraint to allow mc_balance account_type
ALTER TABLE public.ledger_accounts DROP CONSTRAINT IF EXISTS ledger_accounts_account_type_check;
ALTER TABLE public.ledger_accounts ADD CONSTRAINT ledger_accounts_account_type_check
  CHECK (account_type IN ('user_wallet', 'vendor_balance', 'platform_revenue', 'escrow', 'refund_reserve', 'customer', 'platform_cashback', 'mc_balance'));

-- 3. Update owner_check to allow management_company_id as owner dimension
ALTER TABLE public.ledger_accounts DROP CONSTRAINT IF EXISTS owner_check;
ALTER TABLE public.ledger_accounts ADD CONSTRAINT owner_check CHECK (
  (owner_user_id IS NOT NULL AND owner_org_id IS NULL AND management_company_id IS NULL) OR
  (owner_user_id IS NULL AND owner_org_id IS NOT NULL AND management_company_id IS NULL) OR
  (owner_user_id IS NULL AND owner_org_id IS NULL AND management_company_id IS NOT NULL) OR
  (owner_user_id IS NULL AND owner_org_id IS NULL AND management_company_id IS NULL 
   AND account_type IN ('platform_revenue', 'escrow', 'refund_reserve', 'platform_cashback'))
);

-- 4. Add mc_commission to ledger_entries entry_type
ALTER TABLE public.ledger_entries DROP CONSTRAINT IF EXISTS ledger_entries_entry_type_check;
ALTER TABLE public.ledger_entries ADD CONSTRAINT ledger_entries_entry_type_check
  CHECK (entry_type IN ('payment', 'refund', 'payout', 'fee', 'adjustment', 'topup', 'platform_fee', 'vendor_payment', 'mc_commission', 'cashback'));

-- 5. Index for MC lookups
CREATE INDEX IF NOT EXISTS idx_ledger_accounts_mc ON public.ledger_accounts(management_company_id) WHERE management_company_id IS NOT NULL;

-- 6. Updated record_ledger_entries with MC commission split
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
  v_commission_rate numeric;
  v_commission_type text;
  v_commission_base text;
BEGIN
  -- Get order details
  SELECT id, total_amount, platform_fee_amount, customer_user_id, provider_org_id, currency
  INTO v_order
  FROM orders WHERE id = p_order_id;

  IF v_order IS NULL THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id;
  END IF;

  -- Skip if ledger entries already exist (idempotent)
  IF EXISTS (SELECT 1 FROM ledger_entries WHERE order_id = p_order_id LIMIT 1) THEN
    RETURN;
  END IF;

  v_platform_fee := COALESCE(v_order.platform_fee_amount, ROUND(v_order.total_amount * 0.10, 2));
  v_vendor_amount := v_order.total_amount - v_platform_fee;

  -- Try to find property_id from order_items (for property orders)
  SELECT (oi.metadata->>'property_id')::uuid INTO v_property_id
  FROM order_items oi
  WHERE oi.order_id = p_order_id AND oi.item_type = 'property'
  LIMIT 1;

  -- If property found, look up MC and commission terms
  IF v_property_id IS NOT NULL THEN
    SELECT p.management_company_id INTO v_mc_id
    FROM properties p WHERE p.id = v_property_id;

    IF v_mc_id IS NOT NULL THEN
      -- Look up active management terms for this property
      SELECT pmt.commission_rate, pmt.commission_type, pmt.commission_base
      INTO v_commission_rate, v_commission_type, v_commission_base
      FROM property_management_terms pmt
      WHERE pmt.property_id = v_property_id
        AND pmt.status = 'active'
        AND (pmt.valid_from IS NULL OR pmt.valid_from <= CURRENT_DATE)
        AND (pmt.valid_until IS NULL OR pmt.valid_until >= CURRENT_DATE)
      ORDER BY pmt.created_at DESC
      LIMIT 1;

      -- Fallback to MC default commission if no property-level terms
      IF v_commission_rate IS NULL THEN
        SELECT mc.default_commission_rate INTO v_commission_rate
        FROM management_companies mc WHERE mc.id = v_mc_id;
        v_commission_type := 'percent';
        v_commission_base := 'net'; -- default: % of net (after platform fee)
      END IF;

      -- Calculate MC commission
      IF v_commission_rate IS NOT NULL AND v_commission_rate > 0 THEN
        IF v_commission_type = 'fixed' THEN
          v_mc_commission := LEAST(v_commission_rate, v_vendor_amount);
        ELSE
          -- percent type
          IF v_commission_base = 'gross' THEN
            v_mc_commission := ROUND(v_order.total_amount * (v_commission_rate / 100), 2);
          ELSE
            -- net (after platform fee)
            v_mc_commission := ROUND(v_vendor_amount * (v_commission_rate / 100), 2);
          END IF;
          v_mc_commission := LEAST(v_mc_commission, v_vendor_amount);
        END IF;
      END IF;
    END IF;
  END IF;

  v_owner_amount := v_vendor_amount - v_mc_commission;

  -- Get or create platform revenue account
  SELECT id INTO v_platform_account_id FROM ledger_accounts WHERE account_type = 'platform_revenue' LIMIT 1;
  IF v_platform_account_id IS NULL THEN
    INSERT INTO ledger_accounts (account_type, currency) VALUES ('platform_revenue', COALESCE(v_order.currency, 'THB'))
    RETURNING id INTO v_platform_account_id;
  END IF;

  -- Get or create customer account
  SELECT id INTO v_customer_account_id FROM ledger_accounts 
  WHERE owner_user_id = v_order.customer_user_id AND account_type = 'customer' LIMIT 1;
  IF v_customer_account_id IS NULL AND v_order.customer_user_id IS NOT NULL THEN
    INSERT INTO ledger_accounts (owner_user_id, account_type, currency) 
    VALUES (v_order.customer_user_id, 'customer', COALESCE(v_order.currency, 'THB'))
    RETURNING id INTO v_customer_account_id;
  END IF;

  -- Get or create vendor (owner) account
  IF v_order.provider_org_id IS NOT NULL THEN
    SELECT id INTO v_vendor_account_id FROM ledger_accounts
    WHERE owner_org_id = v_order.provider_org_id AND account_type = 'vendor_balance' LIMIT 1;
    IF v_vendor_account_id IS NULL THEN
      INSERT INTO ledger_accounts (owner_org_id, account_type, currency)
      VALUES (v_order.provider_org_id, 'vendor_balance', COALESCE(v_order.currency, 'THB'))
      RETURNING id INTO v_vendor_account_id;
    END IF;
  END IF;

  -- Use platform account as fallback for vendor if no provider
  IF v_vendor_account_id IS NULL THEN
    v_vendor_account_id := v_platform_account_id;
  END IF;

  -- Get or create MC balance account (if MC commission applies)
  IF v_mc_commission > 0 AND v_mc_id IS NOT NULL THEN
    SELECT id INTO v_mc_account_id FROM ledger_accounts
    WHERE management_company_id = v_mc_id AND account_type = 'mc_balance' LIMIT 1;
    IF v_mc_account_id IS NULL THEN
      INSERT INTO ledger_accounts (management_company_id, account_type, currency)
      VALUES (v_mc_id, 'mc_balance', COALESCE(v_order.currency, 'THB'))
      RETURNING id INTO v_mc_account_id;
    END IF;
  END IF;

  -- Entry 1: Platform fee (debit customer → credit platform)
  IF v_customer_account_id IS NOT NULL AND v_platform_fee > 0 THEN
    INSERT INTO ledger_entries (debit_account_id, credit_account_id, amount, currency, order_id, entry_type, description)
    VALUES (v_customer_account_id, v_platform_account_id, v_platform_fee, 
            COALESCE(v_order.currency, 'THB'), p_order_id, 'platform_fee',
            'Platform fee for order ' || p_order_id::text);
  END IF;

  -- Entry 2: Owner payment (debit customer → credit vendor/owner)
  IF v_customer_account_id IS NOT NULL AND v_owner_amount > 0 THEN
    INSERT INTO ledger_entries (debit_account_id, credit_account_id, amount, currency, order_id, entry_type, description)
    VALUES (v_customer_account_id, v_vendor_account_id, v_owner_amount,
            COALESCE(v_order.currency, 'THB'), p_order_id, 'vendor_payment',
            'Owner payment for order ' || p_order_id::text);
  END IF;

  -- Entry 3: MC commission (debit customer → credit MC) — only if MC has terms
  IF v_customer_account_id IS NOT NULL AND v_mc_commission > 0 AND v_mc_account_id IS NOT NULL THEN
    INSERT INTO ledger_entries (debit_account_id, credit_account_id, amount, currency, order_id, entry_type, description)
    VALUES (v_customer_account_id, v_mc_account_id, v_mc_commission,
            COALESCE(v_order.currency, 'THB'), p_order_id, 'mc_commission',
            'MC commission for order ' || p_order_id::text);
  END IF;
END;
$$;

-- 7. RLS: MC members can see their MC's ledger accounts
DROP POLICY IF EXISTS "MC members can view MC ledger accounts" ON public.ledger_accounts;
CREATE POLICY "MC members can view MC ledger accounts"
  ON public.ledger_accounts FOR SELECT
  TO authenticated
  USING (
    management_company_id IS NOT NULL
    AND management_company_id IN (
      SELECT mcm.company_id FROM management_company_members mcm
      WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
    )
  );

-- 8. RLS: MC members can view ledger entries for their MC accounts
DROP POLICY IF EXISTS "MC members can view MC ledger entries" ON public.ledger_entries;
CREATE POLICY "MC members can view MC ledger entries"
  ON public.ledger_entries FOR SELECT
  TO authenticated
  USING (
    credit_account_id IN (
      SELECT la.id FROM ledger_accounts la
      WHERE la.management_company_id IN (
        SELECT mcm.company_id FROM management_company_members mcm
        WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
      )
    )
    OR debit_account_id IN (
      SELECT la.id FROM ledger_accounts la
      WHERE la.management_company_id IN (
        SELECT mcm.company_id FROM management_company_members mcm
        WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
      )
    )
  );
