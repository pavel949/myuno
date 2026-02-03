-- ============================================
-- P2: Dynamic currency rates & platform settings
-- ============================================

-- 1. Create currency_rates table for dynamic exchange rates
CREATE TABLE IF NOT EXISTS public.currency_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency text NOT NULL DEFAULT 'THB',
  target_currency text NOT NULL,
  rate numeric(12, 6) NOT NULL,
  source text DEFAULT 'manual',  -- 'manual', 'api', 'admin'
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  UNIQUE(base_currency, target_currency)
);

-- Insert default rates (THB-based)
INSERT INTO public.currency_rates (base_currency, target_currency, rate, source) VALUES
  ('THB', 'THB', 1.0, 'system'),
  ('THB', 'USD', 0.029, 'manual'),
  ('THB', 'EUR', 0.027, 'manual'),
  ('THB', 'RUB', 2.7, 'manual')
ON CONFLICT (base_currency, target_currency) DO UPDATE SET
  rate = EXCLUDED.rate,
  updated_at = now();

-- Enable RLS
ALTER TABLE public.currency_rates ENABLE ROW LEVEL SECURITY;

-- Public read access for rates
CREATE POLICY "currency_rates_public_read" ON public.currency_rates
  FOR SELECT TO authenticated, anon
  USING (true);

-- Admin-only write access
CREATE POLICY "currency_rates_admin_write" ON public.currency_rates
  FOR ALL TO authenticated
  USING (public.is_admin_or_uno_team())
  WITH CHECK (public.is_admin_or_uno_team());

-- 2. Create system_settings table for platform configuration
CREATE TABLE IF NOT EXISTS public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Insert default platform settings
INSERT INTO public.system_settings (key, value, description) VALUES
  ('platform_fee_percent', '10'::jsonb, 'Platform fee percentage (0-100)'),
  ('default_deposit_percent', '10'::jsonb, 'Default deposit percentage for property bookings'),
  ('min_booking_hours', '24'::jsonb, 'Minimum hours before booking start time'),
  ('max_booking_days_ahead', '365'::jsonb, 'Maximum days ahead for bookings'),
  ('currency_update_interval_hours', '1'::jsonb, 'How often to update exchange rates')
ON CONFLICT (key) DO NOTHING;

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Public read for non-sensitive settings
CREATE POLICY "system_settings_public_read" ON public.system_settings
  FOR SELECT TO authenticated, anon
  USING (true);

-- Admin-only write
CREATE POLICY "system_settings_admin_write" ON public.system_settings
  FOR ALL TO authenticated
  USING (public.is_admin_or_uno_team())
  WITH CHECK (public.is_admin_or_uno_team());

-- 3. Function to get currency rate
CREATE OR REPLACE FUNCTION public.get_currency_rate(
  p_base text DEFAULT 'THB',
  p_target text DEFAULT 'USD'
)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_rate numeric;
BEGIN
  SELECT rate INTO v_rate
  FROM public.currency_rates
  WHERE base_currency = p_base AND target_currency = p_target;
  
  RETURN COALESCE(v_rate, 1.0);
END;
$$;

-- 4. Function to get system setting
CREATE OR REPLACE FUNCTION public.get_system_setting(p_key text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_value jsonb;
BEGIN
  SELECT value INTO v_value
  FROM public.system_settings
  WHERE key = p_key;
  
  RETURN v_value;
END;
$$;

-- 5. Function to get platform fee (replaces hardcoded 0.10)
CREATE OR REPLACE FUNCTION public.get_platform_fee_percent()
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE((public.get_system_setting('platform_fee_percent'))::numeric, 10) / 100.0;
$$;

-- 6. Function to get all currency rates as JSON (for frontend caching)
CREATE OR REPLACE FUNCTION public.get_all_currency_rates()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
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