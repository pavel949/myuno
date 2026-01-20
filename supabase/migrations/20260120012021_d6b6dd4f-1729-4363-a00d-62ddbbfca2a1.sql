-- Phase 3: Automatic Cashback via Ledger System

-- 3.1 Function to calculate and credit cashback
CREATE OR REPLACE FUNCTION public.credit_cashback(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_cashback_settings RECORD;
  v_cashback_amount NUMERIC;
  v_wallet_account_id UUID;
  v_platform_cashback_account_id UUID;
  v_entry_id UUID;
BEGIN
  -- Get order details
  SELECT o.*, u.id as user_id
  INTO v_order
  FROM orders o
  JOIN auth.users u ON o.customer_id = u.id
  WHERE o.id = p_order_id;
  
  IF v_order IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found');
  END IF;
  
  -- Check if cashback already credited for this order
  IF EXISTS (
    SELECT 1 FROM ledger_entries 
    WHERE reference_id = p_order_id 
    AND entry_type = 'cashback'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cashback already credited');
  END IF;
  
  -- Get cashback settings for this vertical
  SELECT * INTO v_cashback_settings
  FROM cashback_settings
  WHERE category = v_order.vertical AND is_active = true;
  
  -- Fallback to default settings
  IF v_cashback_settings IS NULL THEN
    SELECT * INTO v_cashback_settings
    FROM cashback_settings
    WHERE category = 'default' AND is_active = true;
  END IF;
  
  IF v_cashback_settings IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No cashback settings found');
  END IF;
  
  -- Check minimum order amount
  IF v_order.total_amount < COALESCE(v_cashback_settings.min_order_amount, 0) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order below minimum for cashback');
  END IF;
  
  -- Calculate cashback
  v_cashback_amount := v_order.total_amount * (v_cashback_settings.percentage / 100.0);
  
  -- Apply maximum cap if set
  IF v_cashback_settings.max_cashback_amount IS NOT NULL AND 
     v_cashback_amount > v_cashback_settings.max_cashback_amount THEN
    v_cashback_amount := v_cashback_settings.max_cashback_amount;
  END IF;
  
  -- Round to 2 decimal places
  v_cashback_amount := ROUND(v_cashback_amount, 2);
  
  IF v_cashback_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cashback amount is zero');
  END IF;
  
  -- Get or create user's wallet ledger account
  SELECT id INTO v_wallet_account_id
  FROM ledger_accounts
  WHERE user_id = v_order.customer_id AND account_type = 'wallet';
  
  IF v_wallet_account_id IS NULL THEN
    INSERT INTO ledger_accounts (user_id, account_type, currency, balance)
    VALUES (v_order.customer_id, 'wallet', COALESCE(v_order.currency, 'THB'), 0)
    RETURNING id INTO v_wallet_account_id;
  END IF;
  
  -- Get platform cashback expense account
  SELECT id INTO v_platform_cashback_account_id
  FROM ledger_accounts
  WHERE account_type = 'platform_cashback' AND user_id IS NULL;
  
  IF v_platform_cashback_account_id IS NULL THEN
    INSERT INTO ledger_accounts (account_type, currency, balance)
    VALUES ('platform_cashback', 'THB', 0)
    RETURNING id INTO v_platform_cashback_account_id;
  END IF;
  
  -- Create double-entry ledger entries
  -- Debit: Platform cashback expense
  INSERT INTO ledger_entries (
    account_id, entry_type, amount, currency, 
    reference_type, reference_id, description
  ) VALUES (
    v_platform_cashback_account_id, 'cashback', -v_cashback_amount, 
    COALESCE(v_order.currency, 'THB'), 'order', p_order_id,
    'Cashback expense for order ' || v_order.order_number
  );
  
  -- Credit: User wallet
  INSERT INTO ledger_entries (
    account_id, entry_type, amount, currency,
    reference_type, reference_id, description
  ) VALUES (
    v_wallet_account_id, 'cashback', v_cashback_amount,
    COALESCE(v_order.currency, 'THB'), 'order', p_order_id,
    'Cashback earned for order ' || v_order.order_number
  ) RETURNING id INTO v_entry_id;
  
  -- Update wallet balance
  UPDATE ledger_accounts
  SET balance = balance + v_cashback_amount,
      updated_at = now()
  WHERE id = v_wallet_account_id;
  
  -- Also update wallets table for backwards compatibility
  UPDATE wallets
  SET balance = balance + v_cashback_amount,
      updated_at = now()
  WHERE user_id = v_order.customer_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'cashback_amount', v_cashback_amount,
    'order_id', p_order_id,
    'entry_id', v_entry_id
  );
END;
$$;

-- 3.2 Trigger function for automatic cashback on order completion
CREATE OR REPLACE FUNCTION public.trigger_order_cashback()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Only process when status changes to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Credit cashback
    v_result := credit_cashback(NEW.id);
    
    -- Log the result (non-blocking)
    IF NOT (v_result->>'success')::boolean THEN
      RAISE NOTICE 'Cashback not credited for order %: %', NEW.id, v_result->>'error';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3.3 Create trigger on orders table
DROP TRIGGER IF EXISTS orders_cashback_trigger ON orders;
CREATE TRIGGER orders_cashback_trigger
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION trigger_order_cashback();

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.credit_cashback TO authenticated;