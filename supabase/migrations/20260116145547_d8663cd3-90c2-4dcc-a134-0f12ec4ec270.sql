-- Create atomic wallet payment function to prevent race conditions
CREATE OR REPLACE FUNCTION public.pay_from_wallet_atomic(
  p_user_id uuid,
  p_amount numeric,
  p_description text,
  p_description_ru text,
  p_reference_type text DEFAULT NULL,
  p_reference_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_wallet_id UUID;
  v_balance NUMERIC;
  v_new_balance NUMERIC;
  v_transaction_id UUID;
  v_currency TEXT;
BEGIN
  -- Get wallet with row-level lock to prevent race conditions
  SELECT id, balance, currency INTO v_wallet_id, v_balance, v_currency
  FROM public.wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_wallet_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'wallet_not_found',
      'message', 'Wallet not found for user'
    );
  END IF;

  IF v_balance < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'insufficient_balance',
      'message', 'Insufficient wallet balance',
      'available_balance', v_balance,
      'requested_amount', p_amount
    );
  END IF;

  -- Calculate new balance
  v_new_balance := v_balance - p_amount;

  -- Update wallet balance atomically
  UPDATE public.wallets
  SET balance = v_new_balance, updated_at = now()
  WHERE id = v_wallet_id;

  -- Create transaction record
  INSERT INTO public.wallet_transactions (
    wallet_id,
    user_id,
    type,
    amount,
    currency,
    description,
    description_ru,
    reference_type,
    reference_id,
    status
  ) VALUES (
    v_wallet_id,
    p_user_id,
    'payment',
    p_amount,
    v_currency,
    p_description,
    p_description_ru,
    p_reference_type,
    p_reference_id,
    'completed'
  )
  RETURNING id INTO v_transaction_id;

  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'new_balance', v_new_balance,
    'amount_paid', p_amount,
    'currency', v_currency
  );
END;
$function$;

-- Update handle_new_user_wallet to use THB consistently (Thailand market)
CREATE OR REPLACE FUNCTION public.handle_new_user_wallet()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Create wallet for new user with 0 balance - use THB for Thailand market
  INSERT INTO public.wallets (user_id, balance, currency)
  VALUES (NEW.id, 0, 'THB')
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$function$;

-- Update get_or_create_wallet to use THB as default
CREATE OR REPLACE FUNCTION public.get_or_create_wallet(p_user_id uuid)
RETURNS wallets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_wallet public.wallets;
BEGIN
  SELECT * INTO v_wallet FROM public.wallets WHERE user_id = p_user_id;
  
  IF v_wallet IS NULL THEN
    INSERT INTO public.wallets (user_id, balance, currency)
    VALUES (p_user_id, 0, 'THB')
    RETURNING * INTO v_wallet;
  END IF;
  
  RETURN v_wallet;
END;
$function$;

-- Add comment explaining the atomic payment function
COMMENT ON FUNCTION public.pay_from_wallet_atomic IS 'Atomic wallet payment with row-level locking to prevent race conditions';