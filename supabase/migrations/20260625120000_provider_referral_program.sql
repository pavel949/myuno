-- Provider-to-Provider Referral Program (B2B growth track)
--
-- Goal: a verified provider who recommends the platform to another provider earns
-- a commission discount once the referred provider gets verified/activated.
--
-- Reuses the existing consumer referral attribution: the `referrals` row is created
-- at signup via `apply_referral_code` (?ref= link). This migration adds the B2B
-- conversion event (provider verification) + reward ledger + a surgical discount
-- inside the central commission calc. Discount auto-expires via the helper's
-- `expires_at > now()` filter, so no cron dependency is required.

-- ============================================================================
-- 1. Settings (singleton) — admin-tunable economics, separate from consumer 100/50
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.provider_referral_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_discount_percent numeric(5,2) NOT NULL DEFAULT 2,   -- percentage points off commission_rate
  discount_months integer NOT NULL DEFAULT 3,                  -- duration of each earned discount
  max_total_discount_percent numeric(5,2) NOT NULL DEFAULT 6,  -- cap across stacked referrals
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.provider_referral_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view active provider referral settings"
  ON public.provider_referral_settings FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins manage provider referral settings"
  ON public.provider_referral_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'uno_team'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'uno_team'));

INSERT INTO public.provider_referral_settings (referrer_discount_percent, discount_months, max_total_discount_percent)
SELECT 2, 3, 6
WHERE NOT EXISTS (SELECT 1 FROM public.provider_referral_settings);

-- ============================================================================
-- 2. Reward ledger — one row per referred provider that activated
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.provider_referral_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_provider_id uuid REFERENCES public.providers(id) ON DELETE SET NULL,
  referral_id uuid,
  discount_percent numeric(5,2) NOT NULL,
  status text NOT NULL DEFAULT 'active',  -- active | expired
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (referred_user_id)
);

CREATE INDEX IF NOT EXISTS idx_provider_referral_rewards_referrer
  ON public.provider_referral_rewards(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_provider_referral_rewards_active
  ON public.provider_referral_rewards(referrer_user_id, status, expires_at);

ALTER TABLE public.provider_referral_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Referrer can view own provider referral rewards"
  ON public.provider_referral_rewards FOR SELECT TO authenticated
  USING (referrer_user_id = auth.uid());

CREATE POLICY "Admins view all provider referral rewards"
  ON public.provider_referral_rewards FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'uno_team'));

CREATE POLICY "Service role manages provider referral rewards"
  ON public.provider_referral_rewards FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================================
-- 3. Helper — active commission discount (percentage points) for a provider
--    Auto-filters expired rewards, capped by settings.max_total_discount_percent.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.provider_active_referral_discount(p_provider_id uuid)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_sum numeric(5,2);
  v_cap numeric(5,2);
BEGIN
  IF p_provider_id IS NULL THEN
    RETURN 0;
  END IF;

  SELECT user_id INTO v_user_id FROM public.providers WHERE id = p_provider_id;
  IF v_user_id IS NULL THEN
    RETURN 0;
  END IF;

  SELECT COALESCE(SUM(discount_percent), 0) INTO v_sum
  FROM public.provider_referral_rewards
  WHERE referrer_user_id = v_user_id
    AND status = 'active'
    AND expires_at > now();

  SELECT max_total_discount_percent INTO v_cap
  FROM public.provider_referral_settings WHERE is_active = true LIMIT 1;

  RETURN LEAST(v_sum, COALESCE(v_cap, v_sum));
END;
$$;

-- ============================================================================
-- 4. Reward trigger — grant discount when a referred provider gets verified
-- ============================================================================
CREATE OR REPLACE FUNCTION public.process_provider_referral_reward()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referral RECORD;
  v_settings RECORD;
  v_referrer_provider_id uuid;
  v_referrer_name text;
BEGIN
  -- Activation event: provider becomes verified (false/null -> true)
  IF NEW.is_verified = true AND COALESCE(OLD.is_verified, false) = false THEN

    -- Must have an active program
    SELECT referrer_discount_percent, discount_months INTO v_settings
    FROM public.provider_referral_settings WHERE is_active = true LIMIT 1;
    IF v_settings IS NULL THEN
      RETURN NEW;
    END IF;

    -- This provider must have been referred by someone (pending referral row)
    SELECT * INTO v_referral
    FROM public.referrals
    WHERE referred_id = NEW.user_id AND status = 'pending'
    LIMIT 1;
    IF v_referral IS NULL THEN
      RETURN NEW;
    END IF;

    -- The referrer must themselves be a provider (this is a B2B reward)
    SELECT id INTO v_referrer_provider_id
    FROM public.providers WHERE user_id = v_referral.referrer_id LIMIT 1;
    IF v_referrer_provider_id IS NULL THEN
      RETURN NEW;  -- consumer referrer: leave for the consumer booking trigger
    END IF;

    -- Record the reward (idempotent on referred_user_id)
    INSERT INTO public.provider_referral_rewards (
      referrer_user_id, referred_user_id, referred_provider_id, referral_id,
      discount_percent, status, starts_at, expires_at
    )
    VALUES (
      v_referral.referrer_id, NEW.user_id, NEW.id, v_referral.id,
      v_settings.referrer_discount_percent, 'active', now(),
      now() + (v_settings.discount_months || ' months')::interval
    )
    ON CONFLICT (referred_user_id) DO NOTHING;

    -- Close the referral so the consumer booking trigger won't double-reward
    UPDATE public.referrals SET status = 'completed', bonus_paid_at = now()
    WHERE id = v_referral.id;

    SELECT name INTO v_referrer_name FROM public.providers WHERE id = NEW.id;

    -- Notify the referrer (RU + EN + TH — providers on Phuket are Thai-speaking)
    INSERT INTO public.notifications (user_id, title, body, type, data, is_read)
    VALUES (
      v_referral.referrer_id,
      '🎉 Referral reward · Скидка на комиссию',
      'Приглашённый вами поставщик прошёл верификацию. Ваша комиссия снижена на '
        || v_settings.referrer_discount_percent || '% на ' || v_settings.discount_months || ' мес. · '
        || 'A provider you referred is now verified — your commission is reduced by '
        || v_settings.referrer_discount_percent || '% for ' || v_settings.discount_months || ' months. · '
        || 'ผู้ให้บริการที่คุณแนะนำได้รับการยืนยันแล้ว ค่าคอมมิชชันของคุณลดลง '
        || v_settings.referrer_discount_percent || '% เป็นเวลา ' || v_settings.discount_months || ' เดือน',
      'provider_referral',
      jsonb_build_object('discount_percent', v_settings.referrer_discount_percent,
                         'months', v_settings.discount_months,
                         'referred_provider_id', NEW.id),
      false
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS process_provider_referral_on_verify ON public.providers;
CREATE TRIGGER process_provider_referral_on_verify
  AFTER UPDATE OF is_verified ON public.providers
  FOR EACH ROW
  EXECUTE FUNCTION public.process_provider_referral_reward();

-- ============================================================================
-- 5. Optional cosmetic expiry (discount already stops via helper filter)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.expire_provider_referral_rewards()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.provider_referral_rewards
  SET status = 'expired'
  WHERE status = 'active' AND expires_at <= now();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ============================================================================
-- 6. Provider-facing overview RPC (one call for the dashboard card)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_my_provider_referral_overview()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_provider_id uuid;
  v_code text;
  v_active_discount numeric(5,2);
  v_settings RECORD;
  v_referred jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('error', 'unauthenticated');
  END IF;

  SELECT id INTO v_provider_id FROM public.providers WHERE user_id = v_uid LIMIT 1;

  -- Reuse the existing per-user referral code generator
  v_code := public.generate_referral_code(v_uid);

  v_active_discount := public.provider_active_referral_discount(v_provider_id);

  SELECT referrer_discount_percent, discount_months, max_total_discount_percent
  INTO v_settings
  FROM public.provider_referral_settings WHERE is_active = true LIMIT 1;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
            'provider_name', p.name,
            'discount_percent', r.discount_percent,
            'status', r.status,
            'starts_at', r.starts_at,
            'expires_at', r.expires_at
          ) ORDER BY r.created_at DESC), '[]'::jsonb)
  INTO v_referred
  FROM public.provider_referral_rewards r
  LEFT JOIN public.providers p ON p.id = r.referred_provider_id
  WHERE r.referrer_user_id = v_uid;

  RETURN jsonb_build_object(
    'code', v_code,
    'is_provider', v_provider_id IS NOT NULL,
    'active_discount_percent', COALESCE(v_active_discount, 0),
    'per_referral_discount_percent', COALESCE(v_settings.referrer_discount_percent, 0),
    'discount_months', COALESCE(v_settings.discount_months, 0),
    'max_total_discount_percent', COALESCE(v_settings.max_total_discount_percent, 0),
    'referred', v_referred
  );
END;
$$;

-- ============================================================================
-- 7. Surgical integration into the central commission calc.
--    Reproduces calculate_order_commission() verbatim (migration
--    20260121030419) and subtracts the order provider's active referral
--    discount before computing amounts.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.calculate_order_commission()
RETURNS TRIGGER AS $$
DECLARE
  v_commission_rate NUMERIC(5,2);
  v_provider_rate NUMERIC(5,2);
  v_vertical_rate NUMERIC(5,2);
  v_tiered_rates JSONB;
  v_provider_gmv NUMERIC;
  v_tier RECORD;
  v_referral_discount NUMERIC(5,2);
BEGIN
  -- Priority 1: Provider's individual rate
  SELECT commission_rate INTO v_provider_rate
  FROM providers
  WHERE id = NEW.provider_org_id;

  IF v_provider_rate IS NOT NULL AND v_provider_rate > 0 THEN
    v_commission_rate := v_provider_rate;
  ELSE
    -- Priority 2: Vertical rate with tiers
    SELECT base_commission, tiered_rates INTO v_vertical_rate, v_tiered_rates
    FROM vertical_commission_rules
    WHERE vertical = COALESCE(NEW.vertical, NEW.order_type)
    AND is_active = true;

    IF v_vertical_rate IS NOT NULL THEN
      -- Check if tiered rates apply
      IF v_tiered_rates IS NOT NULL AND jsonb_array_length(v_tiered_rates->'tiers') > 0 THEN
        -- Get provider's total GMV
        SELECT COALESCE(SUM(total_amount), 0) INTO v_provider_gmv
        FROM orders
        WHERE provider_org_id = NEW.provider_org_id
        AND status = 'completed';

        -- Find applicable tier
        FOR v_tier IN
          SELECT * FROM jsonb_to_recordset(v_tiered_rates->'tiers')
          AS x(min_gmv numeric, max_gmv numeric, rate numeric)
          ORDER BY min_gmv DESC
        LOOP
          IF v_provider_gmv >= v_tier.min_gmv AND (v_tier.max_gmv IS NULL OR v_provider_gmv < v_tier.max_gmv) THEN
            v_commission_rate := v_tier.rate;
            EXIT;
          END IF;
        END LOOP;

        IF v_commission_rate IS NULL THEN
          v_commission_rate := v_vertical_rate;
        END IF;
      ELSE
        v_commission_rate := v_vertical_rate;
      END IF;
    ELSE
      -- Priority 3: Default rate
      v_commission_rate := 10;
    END IF;
  END IF;

  -- Provider-to-provider referral reward: subtract any active commission discount
  -- earned by this order's provider (auto-expires via helper). Floor at 0.
  IF NEW.provider_org_id IS NOT NULL THEN
    v_referral_discount := public.provider_active_referral_discount(NEW.provider_org_id);
    IF v_referral_discount IS NOT NULL AND v_referral_discount > 0 THEN
      v_commission_rate := GREATEST(0, v_commission_rate - v_referral_discount);
    END IF;
  END IF;

  -- Calculate amounts
  NEW.commission_rate_applied := v_commission_rate;
  NEW.platform_fee_amount := ROUND((NEW.total_amount * v_commission_rate / 100), 2);
  NEW.vendor_payout_amount := NEW.total_amount - NEW.platform_fee_amount;

  -- Set vertical if not set
  IF NEW.vertical IS NULL THEN
    NEW.vertical := NEW.order_type;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
