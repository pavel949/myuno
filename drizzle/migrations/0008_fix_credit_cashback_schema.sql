CREATE UNIQUE INDEX IF NOT EXISTS ledger_entries_cashback_once
  ON public.ledger_entries (order_id) WHERE entry_type = 'cashback';

CREATE OR REPLACE FUNCTION public.credit_cashback(p_order_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE
  v_order RECORD; v_set RECORD; v_amount NUMERIC; v_cur TEXT;
  v_wallet_acc UUID; v_platform_acc UUID; v_entry UUID; v_wallet UUID;
BEGIN
  SELECT * INTO v_order FROM orders WHERE id = p_order_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Order not found'); END IF;
  IF v_order.customer_user_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'No customer'); END IF;
  IF v_order.status <> 'completed' THEN RETURN jsonb_build_object('success', false, 'error', 'Order not completed'); END IF;
  IF EXISTS (SELECT 1 FROM ledger_entries WHERE order_id = p_order_id AND entry_type = 'cashback') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cashback already credited');
  END IF;

  SELECT * INTO v_set FROM cashback_settings WHERE category = v_order.vertical::text AND is_active LIMIT 1;
  IF NOT FOUND THEN SELECT * INTO v_set FROM cashback_settings WHERE category = 'default' AND is_active LIMIT 1; END IF;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'No cashback settings'); END IF;

  IF COALESCE(v_order.total_amount, 0) <= 0 OR v_order.total_amount < COALESCE(v_set.min_order_amount, 0) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order below minimum');
  END IF;
  v_amount := v_order.total_amount * (v_set.percentage / 100.0);
  IF v_set.max_cashback_amount IS NOT NULL AND v_amount > v_set.max_cashback_amount THEN v_amount := v_set.max_cashback_amount; END IF;
  v_amount := ROUND(v_amount, 2);
  IF v_amount <= 0 THEN RETURN jsonb_build_object('success', false, 'error', 'Cashback amount is zero'); END IF;
  v_cur := COALESCE(v_order.currency, 'THB');

  SELECT id INTO v_wallet_acc FROM ledger_accounts
   WHERE owner_user_id = v_order.customer_user_id AND account_type = 'wallet' AND currency = v_cur LIMIT 1;
  IF v_wallet_acc IS NULL THEN
    INSERT INTO ledger_accounts (owner_user_id, account_type, currency, balance)
    VALUES (v_order.customer_user_id, 'wallet', v_cur, 0) RETURNING id INTO v_wallet_acc;
  END IF;
  SELECT id INTO v_platform_acc FROM ledger_accounts
   WHERE account_type = 'platform_cashback' AND owner_user_id IS NULL AND owner_org_id IS NULL AND currency = v_cur LIMIT 1;
  IF v_platform_acc IS NULL THEN
    INSERT INTO ledger_accounts (account_type, currency, balance)
    VALUES ('platform_cashback', v_cur, 0) RETURNING id INTO v_platform_acc;
  END IF;

  INSERT INTO ledger_entries (debit_account_id, credit_account_id, amount, currency, order_id, entry_type, description)
  VALUES (v_platform_acc, v_wallet_acc, v_amount, v_cur, p_order_id, 'cashback',
          'Cashback for order ' || COALESCE(v_order.order_number, p_order_id::text))
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_entry;
  IF v_entry IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Cashback already credited'); END IF;

  UPDATE ledger_accounts SET balance = balance + v_amount, updated_at = now() WHERE id = v_wallet_acc;
  UPDATE ledger_accounts SET balance = balance - v_amount, updated_at = now() WHERE id = v_platform_acc;

  SELECT id INTO v_wallet FROM wallets WHERE user_id = v_order.customer_user_id AND currency = v_cur LIMIT 1;
  IF v_wallet IS NOT NULL THEN
    UPDATE wallets SET balance = balance + v_amount, updated_at = now() WHERE id = v_wallet;
    INSERT INTO wallet_transactions (wallet_id, user_id, type, amount, currency, description, description_ru, reference_type, reference_id, status)
    VALUES (v_wallet, v_order.customer_user_id, 'cashback', v_amount, v_cur,
            'Cashback for order', 'Кэшбэк за заказ', 'order', p_order_id::text, 'completed');
  END IF;

  RETURN jsonb_build_object('success', true, 'cashback_amount', v_amount, 'order_id', p_order_id, 'entry_id', v_entry);
END;
$function$;
REVOKE ALL ON FUNCTION public.credit_cashback(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.credit_cashback(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.trigger_order_cashback()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE v_result JSONB;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status <> 'completed') THEN
    BEGIN
      v_result := credit_cashback(NEW.id);
      IF NOT COALESCE((v_result->>'success')::boolean, false) THEN
        RAISE NOTICE 'Cashback not credited for order %: %', NEW.id, v_result->>'error';
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Cashback failed for order % (completion kept): %', NEW.id, SQLERRM;
    END;
  END IF;
  RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION public.trigger_order_cashback() FROM PUBLIC, anon, authenticated;