-- Guest Loyalty Tiers configuration
CREATE TABLE public.guest_loyalty_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tier_name TEXT NOT NULL UNIQUE,
  tier_order INTEGER NOT NULL,
  min_gmv_thb NUMERIC NOT NULL DEFAULT 0,
  cashback_percent NUMERIC NOT NULL DEFAULT 5,
  benefits JSONB DEFAULT '[]'::jsonb,
  icon TEXT,
  color TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default tiers
INSERT INTO public.guest_loyalty_tiers (tier_name, tier_order, min_gmv_thb, cashback_percent, benefits, icon, color) VALUES
  ('Explorer', 1, 0, 5, '["Базовый кэшбек", "Доступ к акциям"]', 'compass', 'gray'),
  ('Adventurer', 2, 50000, 7, '["Ранний заезд при наличии", "Приоритетная поддержка"]', 'map', 'blue'),
  ('Globetrotter', 3, 150000, 10, '["Поздний выезд", "Эксклюзивные предложения", "Персональный менеджер"]', 'globe', 'purple'),
  ('Elite', 4, 500000, 15, '["Бесплатный апгрейд", "VIP-линия 24/7", "Трансфер в подарок"]', 'crown', 'amber');

-- User loyalty status tracking
CREATE TABLE public.user_loyalty_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  current_tier_id UUID REFERENCES public.guest_loyalty_tiers(id),
  total_gmv_thb NUMERIC DEFAULT 0,
  gmv_this_year NUMERIC DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  bookings_this_year INTEGER DEFAULT 0,
  tier_updated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User achievements
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_code TEXT NOT NULL,
  achieved_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  bonus_awarded NUMERIC DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(user_id, achievement_code)
);

-- Achievement definitions
CREATE TABLE public.achievement_definitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  icon TEXT,
  bonus_amount NUMERIC DEFAULT 0,
  category TEXT DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default achievements
INSERT INTO public.achievement_definitions (code, name_en, name_ru, description_en, description_ru, icon, bonus_amount, category, sort_order) VALUES
  ('first_booking', 'First Booking', 'Первое бронирование', 'Complete your first booking', 'Завершите первое бронирование', 'rocket', 50, 'bookings', 1),
  ('five_bookings', '5 Bookings', '5 бронирований', 'Complete 5 bookings', 'Завершите 5 бронирований', 'star', 200, 'bookings', 2),
  ('ten_bookings', '10 Bookings', '10 бронирований', 'Complete 10 bookings', 'Завершите 10 бронирований', 'trophy', 500, 'bookings', 3),
  ('first_review', 'First Review', 'Первый отзыв', 'Leave your first review', 'Оставьте первый отзыв', 'message-circle', 30, 'reviews', 4),
  ('photo_review', 'Photo Reviewer', 'Фото-обозреватель', 'Leave a review with photos', 'Оставьте отзыв с фото', 'camera', 50, 'reviews', 5),
  ('referral_hero', 'Referral Hero', 'Герой рекомендаций', 'Invite 3 friends', 'Пригласите 3 друзей', 'users', 500, 'social', 6),
  ('loyal_guest', 'Loyal Guest', 'Постоянный гость', 'Book 3 times with same owner', 'Забронируйте 3 раза у одного собственника', 'heart', 300, 'loyalty', 7),
  ('early_bird', 'Early Bird', 'Ранняя пташка', 'Book 30+ days in advance', 'Забронируйте за 30+ дней', 'sunrise', 100, 'bookings', 8);

-- Owner performance metrics for Superhost
CREATE TABLE public.owner_performance_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL UNIQUE,
  avg_rating NUMERIC DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  completed_bookings INTEGER DEFAULT 0,
  cancellation_rate NUMERIC DEFAULT 0,
  avg_response_time_minutes INTEGER,
  response_rate NUMERIC DEFAULT 0,
  review_reply_rate NUMERIC DEFAULT 0,
  is_superhost BOOLEAN DEFAULT false,
  superhost_since TIMESTAMP WITH TIME ZONE,
  last_evaluated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Owner commission tiers
CREATE TABLE public.owner_commission_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tier_name TEXT NOT NULL UNIQUE,
  tier_order INTEGER NOT NULL,
  min_gmv_thb NUMERIC NOT NULL DEFAULT 0,
  commission_percent NUMERIC NOT NULL DEFAULT 15,
  benefits JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default owner commission tiers
INSERT INTO public.owner_commission_tiers (tier_name, tier_order, min_gmv_thb, commission_percent, benefits) VALUES
  ('Starter', 1, 0, 15, '["Базовая поддержка"]'),
  ('Partner', 2, 500000, 13, '["Персональный менеджер", "Приоритетная модерация"]'),
  ('Pro', 3, 1500000, 11, '["Маркетинговая поддержка", "Аналитика"]'),
  ('Elite', 4, 5000000, 9, '["Кастомные условия", "VIP-поддержка"]');

-- Returning guests tracking
CREATE TABLE public.returning_guests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guest_id UUID NOT NULL,
  owner_id UUID NOT NULL,
  booking_count INTEGER DEFAULT 1,
  total_spent NUMERIC DEFAULT 0,
  first_booking_at TIMESTAMP WITH TIME ZONE,
  last_booking_at TIMESTAMP WITH TIME ZONE,
  personal_discount_percent NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(guest_id, owner_id)
);

-- Enable RLS
ALTER TABLE public.guest_loyalty_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_loyalty_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievement_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_commission_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.returning_guests ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Tiers are readable by everyone
CREATE POLICY "Guest tiers are viewable by everyone" ON public.guest_loyalty_tiers FOR SELECT USING (true);
CREATE POLICY "Owner commission tiers are viewable by everyone" ON public.owner_commission_tiers FOR SELECT USING (true);
CREATE POLICY "Achievement definitions are viewable by everyone" ON public.achievement_definitions FOR SELECT USING (true);

-- Users can view their own loyalty status
CREATE POLICY "Users can view own loyalty status" ON public.user_loyalty_status FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);

-- Owners can view their own metrics
CREATE POLICY "Owners can view own performance metrics" ON public.owner_performance_metrics FOR SELECT USING (auth.uid() = owner_id);

-- Owners can view their returning guests
CREATE POLICY "Owners can view their returning guests" ON public.returning_guests FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Owners can update their returning guests" ON public.returning_guests FOR UPDATE USING (auth.uid() = owner_id);

-- Function to get or create user loyalty status
CREATE OR REPLACE FUNCTION public.get_or_create_loyalty_status(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status user_loyalty_status%ROWTYPE;
  v_tier guest_loyalty_tiers%ROWTYPE;
  v_next_tier guest_loyalty_tiers%ROWTYPE;
BEGIN
  -- Try to get existing status
  SELECT * INTO v_status FROM user_loyalty_status WHERE user_id = p_user_id;
  
  -- Create if not exists
  IF NOT FOUND THEN
    -- Get the first tier (Explorer)
    SELECT * INTO v_tier FROM guest_loyalty_tiers WHERE tier_order = 1 LIMIT 1;
    
    INSERT INTO user_loyalty_status (user_id, current_tier_id, total_gmv_thb, gmv_this_year)
    VALUES (p_user_id, v_tier.id, 0, 0)
    RETURNING * INTO v_status;
  ELSE
    SELECT * INTO v_tier FROM guest_loyalty_tiers WHERE id = v_status.current_tier_id;
  END IF;
  
  -- Get next tier
  SELECT * INTO v_next_tier FROM guest_loyalty_tiers 
  WHERE tier_order = v_tier.tier_order + 1 AND is_active = true
  LIMIT 1;
  
  RETURN jsonb_build_object(
    'status', row_to_json(v_status),
    'current_tier', row_to_json(v_tier),
    'next_tier', CASE WHEN v_next_tier.id IS NOT NULL THEN row_to_json(v_next_tier) ELSE NULL END
  );
END;
$$;

-- Function to recalculate user tier
CREATE OR REPLACE FUNCTION public.recalculate_user_tier(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status user_loyalty_status%ROWTYPE;
  v_new_tier guest_loyalty_tiers%ROWTYPE;
  v_old_tier_id UUID;
BEGIN
  SELECT * INTO v_status FROM user_loyalty_status WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN get_or_create_loyalty_status(p_user_id);
  END IF;
  
  v_old_tier_id := v_status.current_tier_id;
  
  -- Find the highest tier the user qualifies for
  SELECT * INTO v_new_tier FROM guest_loyalty_tiers 
  WHERE min_gmv_thb <= v_status.gmv_this_year AND is_active = true
  ORDER BY tier_order DESC
  LIMIT 1;
  
  -- Update if tier changed
  IF v_new_tier.id != v_old_tier_id THEN
    UPDATE user_loyalty_status 
    SET current_tier_id = v_new_tier.id, tier_updated_at = now(), updated_at = now()
    WHERE user_id = p_user_id;
  END IF;
  
  RETURN get_or_create_loyalty_status(p_user_id);
END;
$$;

-- Function to award achievement
CREATE OR REPLACE FUNCTION public.award_achievement(p_user_id UUID, p_achievement_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_achievement achievement_definitions%ROWTYPE;
  v_existing user_achievements%ROWTYPE;
  v_new_achievement user_achievements%ROWTYPE;
BEGIN
  -- Check if achievement exists
  SELECT * INTO v_achievement FROM achievement_definitions WHERE code = p_achievement_code AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Achievement not found');
  END IF;
  
  -- Check if already achieved
  SELECT * INTO v_existing FROM user_achievements WHERE user_id = p_user_id AND achievement_code = p_achievement_code;
  
  IF FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already achieved', 'achievement', row_to_json(v_existing));
  END IF;
  
  -- Award achievement
  INSERT INTO user_achievements (user_id, achievement_code, bonus_awarded)
  VALUES (p_user_id, p_achievement_code, v_achievement.bonus_amount)
  RETURNING * INTO v_new_achievement;
  
  -- Add bonus to wallet if any
  IF v_achievement.bonus_amount > 0 THEN
    UPDATE wallets 
    SET balance = balance + v_achievement.bonus_amount, updated_at = now()
    WHERE user_id = p_user_id;
    
    -- Record transaction
    INSERT INTO wallet_transactions (wallet_id, type, amount, description, description_ru, reference_type, reference_id)
    SELECT w.id, 'credit', v_achievement.bonus_amount, 
           'Achievement bonus: ' || v_achievement.name_en,
           'Бонус за достижение: ' || v_achievement.name_ru,
           'achievement', v_new_achievement.id::text
    FROM wallets w WHERE w.user_id = p_user_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true, 
    'achievement', row_to_json(v_new_achievement),
    'definition', row_to_json(v_achievement),
    'bonus_awarded', v_achievement.bonus_amount
  );
END;
$$;

-- Trigger to update timestamps
CREATE TRIGGER update_user_loyalty_status_updated_at
  BEFORE UPDATE ON public.user_loyalty_status
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_owner_performance_metrics_updated_at
  BEFORE UPDATE ON public.owner_performance_metrics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_returning_guests_updated_at
  BEFORE UPDATE ON public.returning_guests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();