-- 1. Auto-create profiles on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- Create profiles for existing users without one
INSERT INTO public.profiles (id, email)
SELECT id, email FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- 2. Add 'tour' to booking_type enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'tour' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'booking_type')
  ) THEN
    ALTER TYPE public.booking_type ADD VALUE 'tour';
  END IF;
END $$;

-- 3. Atomic wallet payment function
CREATE OR REPLACE FUNCTION public.create_booking_with_wallet_payment(
  p_user_id UUID,
  p_booking_type TEXT,
  p_scheduled_at TIMESTAMPTZ,
  p_total_amount NUMERIC,
  p_currency TEXT,
  p_provider_id UUID DEFAULT NULL,
  p_service_id UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_wallet_id UUID;
  v_balance NUMERIC;
  v_booking_id UUID;
BEGIN
  -- Get wallet and lock row
  SELECT id, balance INTO v_wallet_id, v_balance
  FROM wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_wallet_id IS NULL THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;

  IF v_balance < p_total_amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- Create booking first
  INSERT INTO bookings (
    user_id, booking_type, status, scheduled_at, 
    total_amount, currency, provider_id, service_id, notes
  ) VALUES (
    p_user_id, p_booking_type::booking_type, 'confirmed', p_scheduled_at,
    p_total_amount, p_currency, p_provider_id, p_service_id, p_notes
  )
  RETURNING id INTO v_booking_id;

  -- Deduct from wallet
  UPDATE wallets 
  SET balance = balance - p_total_amount, updated_at = now()
  WHERE id = v_wallet_id;

  -- Record transaction
  INSERT INTO wallet_transactions (wallet_id, user_id, amount, type, description, status, reference_id)
  VALUES (v_wallet_id, p_user_id, -p_total_amount, 'payment', 'Booking payment', 'completed', v_booking_id);

  -- Record payment
  INSERT INTO booking_payments (booking_id, amount, payment_method, status, paid_at, currency)
  VALUES (v_booking_id, p_total_amount, 'wallet', 'completed', now(), p_currency);

  RETURN v_booking_id;
END;
$$;

-- 4. Refund function for cancelled bookings
CREATE OR REPLACE FUNCTION public.refund_wallet_booking(
  p_booking_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_payment RECORD;
  v_wallet_id UUID;
BEGIN
  -- Get payment details (only wallet payments that were completed)
  SELECT bp.* INTO v_payment
  FROM booking_payments bp
  JOIN bookings b ON b.id = bp.booking_id
  WHERE bp.booking_id = p_booking_id 
    AND b.user_id = p_user_id
    AND bp.payment_method = 'wallet'
    AND bp.status = 'completed';

  IF v_payment IS NULL THEN
    RETURN FALSE; -- No wallet payment to refund
  END IF;

  -- Get wallet
  SELECT id INTO v_wallet_id FROM wallets WHERE user_id = p_user_id;
  
  IF v_wallet_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Refund to wallet
  UPDATE wallets 
  SET balance = balance + v_payment.amount, updated_at = now()
  WHERE id = v_wallet_id;

  -- Record refund transaction
  INSERT INTO wallet_transactions (wallet_id, user_id, amount, type, description, status, reference_id)
  VALUES (v_wallet_id, p_user_id, v_payment.amount, 'refund', 'Booking cancellation refund', 'completed', p_booking_id);

  -- Update payment status
  UPDATE booking_payments SET status = 'refunded' WHERE id = v_payment.id;

  RETURN TRUE;
END;
$$;