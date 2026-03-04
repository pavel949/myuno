-- Fix referral bonus processing: use THB currency and correct notification text
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
      VALUES (v_referral.referrer_id, 0, 'THB')
      RETURNING id INTO v_referrer_wallet_id;
    END IF;
    
    SELECT id INTO v_referred_wallet_id FROM public.wallets WHERE user_id = v_referral.referred_id;
    IF v_referred_wallet_id IS NULL THEN
      INSERT INTO public.wallets (user_id, balance, currency)
      VALUES (v_referral.referred_id, 0, 'THB')
      RETURNING id INTO v_referred_wallet_id;
    END IF;
    
    -- Credit referrer bonus
    UPDATE public.wallets SET balance = balance + v_referral.referrer_bonus, updated_at = now()
    WHERE id = v_referrer_wallet_id;
    
    INSERT INTO public.wallet_transactions (wallet_id, user_id, type, amount, currency, description, description_ru, reference_type, reference_id, status)
    VALUES (v_referrer_wallet_id, v_referral.referrer_id, 'referral_bonus', v_referral.referrer_bonus, 'THB', 
            'Referral bonus for inviting a friend', 'Бонус за приглашённого друга', 'referral', v_referral.id::text, 'completed');
    
    -- Credit referred user bonus
    UPDATE public.wallets SET balance = balance + v_referral.referred_bonus, updated_at = now()
    WHERE id = v_referred_wallet_id;
    
    INSERT INTO public.wallet_transactions (wallet_id, user_id, type, amount, currency, description, description_ru, reference_type, reference_id, status)
    VALUES (v_referred_wallet_id, v_referral.referred_id, 'referral_bonus', v_referral.referred_bonus, 'THB',
            'Welcome bonus for using referral code', 'Приветственный бонус по реферальному коду', 'referral', v_referral.id::text, 'completed');
    
    -- Update referral status
    UPDATE public.referrals SET status = 'completed', bonus_paid_at = now()
    WHERE id = v_referral.id;
    
    -- Notify referrer
    INSERT INTO public.notifications (user_id, title, body, type, data, is_read)
    VALUES (v_referral.referrer_id, '🎉 Реферальный бонус!', 
            'Ваш друг совершил первый заказ! Вам начислено ฿' || v_referral.referrer_bonus,
            'referral', jsonb_build_object('amount', v_referral.referrer_bonus, 'referral_id', v_referral.id), false);
    
    -- Notify referred user
    INSERT INTO public.notifications (user_id, title, body, type, data, is_read)
    VALUES (v_referral.referred_id, '🎁 Приветственный бонус!',
            'Вам начислено ฿' || v_referral.referred_bonus || ' за использование реферального кода!',
            'referral', jsonb_build_object('amount', v_referral.referred_bonus, 'referral_id', v_referral.id), false);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Also update apply_referral_code to use 50 as default
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
  VALUES (v_referrer_id, p_referred_id, COALESCE(v_settings.referrer_bonus, 50), COALESCE(v_settings.referred_bonus, 50), 'pending');
  
  RETURN TRUE;
END;
$$;