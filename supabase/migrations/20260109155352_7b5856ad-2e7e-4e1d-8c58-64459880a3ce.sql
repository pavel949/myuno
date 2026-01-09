-- Create referral_codes table
CREATE TABLE public.referral_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code VARCHAR(10) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create referrals table to track who invited whom
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referrer_bonus NUMERIC NOT NULL DEFAULT 100,
  referred_bonus NUMERIC NOT NULL DEFAULT 50,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  bonus_paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(referred_id)
);

-- Create referral_settings table
CREATE TABLE public.referral_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_bonus NUMERIC NOT NULL DEFAULT 100,
  referred_bonus NUMERIC NOT NULL DEFAULT 50,
  min_booking_amount NUMERIC DEFAULT 500,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for referral_codes
CREATE POLICY "Users can view their own referral codes"
  ON public.referral_codes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own referral codes"
  ON public.referral_codes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Anyone can look up a referral code (for applying during signup)
CREATE POLICY "Anyone can lookup referral codes"
  ON public.referral_codes FOR SELECT
  USING (is_active = true);

-- RLS policies for referrals
CREATE POLICY "Users can view referrals they made or received"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "System can insert referrals"
  ON public.referrals FOR INSERT
  WITH CHECK (auth.uid() = referred_id);

-- RLS policies for referral_settings
CREATE POLICY "Anyone can view active referral settings"
  ON public.referral_settings FOR SELECT
  USING (is_active = true);

-- Insert default referral settings
INSERT INTO public.referral_settings (referrer_bonus, referred_bonus, min_booking_amount)
VALUES (100, 50, 500);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  -- Check if user already has a code
  SELECT code INTO v_code FROM public.referral_codes WHERE user_id = p_user_id AND is_active = true LIMIT 1;
  
  IF v_code IS NOT NULL THEN
    RETURN v_code;
  END IF;
  
  -- Generate new unique code
  LOOP
    v_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 6));
    SELECT EXISTS(SELECT 1 FROM public.referral_codes WHERE code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  
  -- Insert new code
  INSERT INTO public.referral_codes (user_id, code) VALUES (p_user_id, v_code);
  
  RETURN v_code;
END;
$$;

-- Function to apply referral code during signup
CREATE OR REPLACE FUNCTION public.apply_referral_code(p_referred_id UUID, p_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id UUID;
  v_settings RECORD;
BEGIN
  -- Get referrer from code
  SELECT user_id INTO v_referrer_id
  FROM public.referral_codes
  WHERE code = UPPER(p_code) AND is_active = true;
  
  IF v_referrer_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Can't refer yourself
  IF v_referrer_id = p_referred_id THEN
    RETURN FALSE;
  END IF;
  
  -- Check if already referred
  IF EXISTS(SELECT 1 FROM public.referrals WHERE referred_id = p_referred_id) THEN
    RETURN FALSE;
  END IF;
  
  -- Get settings
  SELECT referrer_bonus, referred_bonus INTO v_settings
  FROM public.referral_settings WHERE is_active = true LIMIT 1;
  
  -- Create referral record
  INSERT INTO public.referrals (referrer_id, referred_id, referrer_bonus, referred_bonus, status)
  VALUES (v_referrer_id, p_referred_id, COALESCE(v_settings.referrer_bonus, 100), COALESCE(v_settings.referred_bonus, 50), 'pending');
  
  RETURN TRUE;
END;
$$;

-- Function to process referral bonus when referred user completes first booking
CREATE OR REPLACE FUNCTION public.process_referral_bonus()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referral RECORD;
  v_settings RECORD;
  v_referrer_wallet_id UUID;
  v_referred_wallet_id UUID;
BEGIN
  -- Only process on first completed booking
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    -- Check if this user has a pending referral
    SELECT * INTO v_referral
    FROM public.referrals
    WHERE referred_id = NEW.user_id AND status = 'pending'
    LIMIT 1;
    
    IF v_referral IS NULL THEN
      RETURN NEW;
    END IF;
    
    -- Get settings for minimum amount check
    SELECT min_booking_amount INTO v_settings
    FROM public.referral_settings WHERE is_active = true LIMIT 1;
    
    -- Check minimum booking amount
    IF NEW.total_amount < COALESCE(v_settings.min_booking_amount, 0) THEN
      RETURN NEW;
    END IF;
    
    -- Get or create wallets for both users
    SELECT id INTO v_referrer_wallet_id FROM public.wallets WHERE user_id = v_referral.referrer_id;
    IF v_referrer_wallet_id IS NULL THEN
      INSERT INTO public.wallets (user_id, balance, currency)
      VALUES (v_referral.referrer_id, 0, 'RUB')
      RETURNING id INTO v_referrer_wallet_id;
    END IF;
    
    SELECT id INTO v_referred_wallet_id FROM public.wallets WHERE user_id = v_referral.referred_id;
    IF v_referred_wallet_id IS NULL THEN
      INSERT INTO public.wallets (user_id, balance, currency)
      VALUES (v_referral.referred_id, 0, 'RUB')
      RETURNING id INTO v_referred_wallet_id;
    END IF;
    
    -- Credit referrer bonus
    UPDATE public.wallets SET balance = balance + v_referral.referrer_bonus, updated_at = now()
    WHERE id = v_referrer_wallet_id;
    
    INSERT INTO public.wallet_transactions (wallet_id, user_id, type, amount, currency, description, description_ru, reference_type, reference_id, status)
    VALUES (v_referrer_wallet_id, v_referral.referrer_id, 'referral_bonus', v_referral.referrer_bonus, 'RUB', 
            'Referral bonus for inviting a friend', 'Бонус за приглашённого друга', 'referral', v_referral.id::text, 'completed');
    
    -- Credit referred user bonus
    UPDATE public.wallets SET balance = balance + v_referral.referred_bonus, updated_at = now()
    WHERE id = v_referred_wallet_id;
    
    INSERT INTO public.wallet_transactions (wallet_id, user_id, type, amount, currency, description, description_ru, reference_type, reference_id, status)
    VALUES (v_referred_wallet_id, v_referral.referred_id, 'referral_bonus', v_referral.referred_bonus, 'RUB',
            'Welcome bonus for using referral code', 'Приветственный бонус по реферальному коду', 'referral', v_referral.id::text, 'completed');
    
    -- Update referral status
    UPDATE public.referrals SET status = 'completed', bonus_paid_at = now()
    WHERE id = v_referral.id;
    
    -- Notify referrer
    INSERT INTO public.notifications (user_id, title, body, type, data, is_read)
    VALUES (v_referral.referrer_id, '🎉 Реферальный бонус!', 
            'Ваш друг совершил первое бронирование! Вам начислено ' || v_referral.referrer_bonus || ' ₽',
            'referral', jsonb_build_object('amount', v_referral.referrer_bonus, 'referral_id', v_referral.id), false);
    
    -- Notify referred user
    INSERT INTO public.notifications (user_id, title, body, type, data, is_read)
    VALUES (v_referral.referred_id, '🎁 Приветственный бонус!',
            'Вам начислено ' || v_referral.referred_bonus || ' ₽ за использование реферального кода!',
            'referral', jsonb_build_object('amount', v_referral.referred_bonus, 'referral_id', v_referral.id), false);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for referral bonus processing
CREATE TRIGGER process_referral_on_booking_complete
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.process_referral_bonus();