
-- Part 3: Payment pipeline fixes

-- 3.1: Add paid_at column to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paid_at timestamptz;

-- 3.2: Create record_ledger_entries RPC for reuse
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
  v_platform_fee numeric;
  v_vendor_amount numeric;
BEGIN
  -- Get order details
  SELECT id, total_amount, platform_fee_amount, customer_user_id, provider_org_id, currency
  INTO v_order
  FROM orders WHERE id = p_order_id;

  IF v_order IS NULL THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id;
  END IF;

  -- Skip if ledger entries already exist
  IF EXISTS (SELECT 1 FROM ledger_entries WHERE order_id = p_order_id LIMIT 1) THEN
    RETURN;
  END IF;

  v_platform_fee := COALESCE(v_order.platform_fee_amount, ROUND(v_order.total_amount * 0.10, 2));
  v_vendor_amount := v_order.total_amount - v_platform_fee;

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

  -- Get or create vendor account
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

  -- Entry 1: Platform fee (debit customer → credit platform)
  IF v_customer_account_id IS NOT NULL AND v_platform_fee > 0 THEN
    INSERT INTO ledger_entries (debit_account_id, credit_account_id, amount, currency, order_id, entry_type, description)
    VALUES (v_customer_account_id, v_platform_account_id, v_platform_fee, 
            COALESCE(v_order.currency, 'THB'), p_order_id, 'platform_fee',
            'Platform fee for order ' || p_order_id::text);
  END IF;

  -- Entry 2: Vendor payment (debit customer → credit vendor)
  IF v_customer_account_id IS NOT NULL AND v_vendor_amount > 0 THEN
    INSERT INTO ledger_entries (debit_account_id, credit_account_id, amount, currency, order_id, entry_type, description)
    VALUES (v_customer_account_id, v_vendor_account_id, v_vendor_amount,
            COALESCE(v_order.currency, 'THB'), p_order_id, 'vendor_payment',
            'Vendor payment for order ' || p_order_id::text);
  END IF;
END;
$$;
