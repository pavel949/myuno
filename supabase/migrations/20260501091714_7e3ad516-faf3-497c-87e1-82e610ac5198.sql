-- Restore 5 RPC functions that are actively called from frontend code via supabase.rpc()
-- Static cross-reference (rpc-deep-audit-2026-04-29.csv) missed these because it scanned
-- pg_proc.prosrc only, not src/**/*.ts string literals.

CREATE OR REPLACE FUNCTION public.get_all_currency_rates()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT jsonb_object_agg(target_currency, jsonb_build_object(
      'rate', rate,
      'updated_at', updated_at
    ))
    FROM public.currency_rates
    WHERE base_currency = 'THB'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_subscription_revenue(p_days INT DEFAULT 30)
RETURNS TABLE(
  total_revenue NUMERIC,
  active_count INT,
  monthly_count INT,
  yearly_count INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(
      CASE 
        WHEN vs.billing_cycle = 'yearly' THEN COALESCE(sp.price_yearly, 0) / 12
        ELSE COALESCE(sp.price_monthly, 0)
      END
    ), 0::NUMERIC) AS total_revenue,
    COUNT(*)::INT AS active_count,
    COUNT(*) FILTER (WHERE vs.billing_cycle = 'monthly')::INT AS monthly_count,
    COUNT(*) FILTER (WHERE vs.billing_cycle = 'yearly')::INT AS yearly_count
  FROM vendor_subscriptions vs
  LEFT JOIN subscription_plans sp ON vs.plan_id = sp.id
  WHERE vs.status = 'active';
END;
$$;

CREATE OR REPLACE FUNCTION public.detect_booking_conflicts(p_property_id uuid)
RETURNS TABLE (
  booking_id_1 uuid,
  booking_id_2 uuid,
  guest_name_1 text,
  guest_name_2 text,
  source_1 text,
  source_2 text,
  check_in_1 date,
  check_out_1 date,
  check_in_2 date,
  check_out_2 date,
  overlap_days integer
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b1.id as booking_id_1,
    b2.id as booking_id_2,
    b1.guest_name as guest_name_1,
    b2.guest_name as guest_name_2,
    b1.source as source_1,
    b2.source as source_2,
    b1.check_in as check_in_1,
    b1.check_out as check_out_1,
    b2.check_in as check_in_2,
    b2.check_out as check_out_2,
    (LEAST(b1.check_out, b2.check_out) - GREATEST(b1.check_in, b2.check_in))::integer as overlap_days
  FROM property_bookings b1
  JOIN property_bookings b2 ON b1.property_id = b2.property_id
    AND b1.id < b2.id
    AND b1.check_in < b2.check_out 
    AND b2.check_in < b1.check_out
    AND b1.status != 'cancelled'
    AND b2.status != 'cancelled'
  WHERE b1.property_id = p_property_id;
END;
$$;

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
  SELECT user_id INTO v_referrer_id
  FROM public.referral_codes
  WHERE code = UPPER(p_code) AND is_active = true;
  
  IF v_referrer_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  IF v_referrer_id = p_referred_id THEN
    RETURN FALSE;
  END IF;
  
  IF EXISTS(SELECT 1 FROM public.referrals WHERE referred_id = p_referred_id) THEN
    RETURN FALSE;
  END IF;
  
  SELECT referrer_bonus, referred_bonus INTO v_settings
  FROM public.referral_settings WHERE is_active = true LIMIT 1;
  
  INSERT INTO public.referrals (referrer_id, referred_id, referrer_bonus, referred_bonus, status)
  VALUES (v_referrer_id, p_referred_id, COALESCE(v_settings.referrer_bonus, 100), COALESCE(v_settings.referred_bonus, 50), 'pending');
  
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.add_team_points(
  p_user_id UUID,
  p_action_type TEXT,
  p_points INTEGER,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS INTEGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  v_new_total INTEGER;
  v_new_level INTEGER;
  v_current_level INTEGER;
BEGIN
  INSERT INTO public.team_activity_log (user_id, action_type, entity_type, entity_id, points_earned, metadata)
  VALUES (p_user_id, p_action_type, p_entity_type, p_entity_id, p_points, p_metadata);

  INSERT INTO public.team_gamification (user_id, total_points, weekly_points, monthly_points, last_activity_date)
  VALUES (p_user_id, p_points, p_points, p_points, CURRENT_DATE)
  ON CONFLICT (user_id) DO UPDATE SET
    total_points = team_gamification.total_points + p_points,
    weekly_points = team_gamification.weekly_points + p_points,
    monthly_points = team_gamification.monthly_points + p_points,
    last_activity_date = CURRENT_DATE,
    streak_days = CASE 
      WHEN team_gamification.last_activity_date = CURRENT_DATE - 1 THEN team_gamification.streak_days + 1
      WHEN team_gamification.last_activity_date = CURRENT_DATE THEN team_gamification.streak_days
      ELSE 1
    END
  RETURNING total_points, level INTO v_new_total, v_current_level;

  v_new_level := CASE
    WHEN v_new_total >= 10000 THEN 5
    WHEN v_new_total >= 5000 THEN 4
    WHEN v_new_total >= 2000 THEN 3
    WHEN v_new_total >= 500 THEN 2
    ELSE 1
  END;

  IF v_new_level > v_current_level THEN
    UPDATE public.team_gamification 
    SET level = v_new_level 
    WHERE user_id = p_user_id;
  END IF;

  RETURN v_new_total;
END;
$$;