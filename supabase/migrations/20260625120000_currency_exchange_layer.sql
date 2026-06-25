-- ============================================================================
-- Currency Exchange Layer
-- ----------------------------------------------------------------------------
-- Goal: a trustworthy, comparable list of Phuket currency exchangers + live
-- THB rates, monetised through verified/featured exchanger listings.
--
-- Adds:
--   1. public.exchangers           — verified money-changer listings
--   2. currency_rates              — extend coverage (GBP, CNY)
--   3. system_settings             — feature flag + affiliate config
--   4. seed exchangers             — migrate the 5 previously-hardcoded rows
--   5. pg_cron                     — daily refresh of currency_rates
--
-- Gated behind `feature_flag:currency_exchange` (rule §13.7). Apply via Lovable
-- Cloud (prod = kakkwibljrjsawxgnupk); regenerate types.ts afterwards.
-- ============================================================================

-- 1. Exchanger listings -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.exchangers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Optional link to a provider account (self-serve vendors). NULL = curated by myUNO.
  provider_id uuid REFERENCES public.providers(id) ON DELETE SET NULL,
  name text NOT NULL,
  name_ru text,
  name_th text,
  area text,
  area_ru text,
  address text,
  lat double precision,
  lng double precision,
  phone text,
  whatsapp text,
  website text,
  logo_url text,
  -- Per-weekday hours or a simple "09:00-18:00" string kept in `hours`.
  hours text,
  rating numeric(2,1) CHECK (rating >= 0 AND rating <= 5),
  -- Self-reported buy rates per currency, e.g. {"USD": 33.85, "EUR": 37.2}.
  -- "buy" = THB the customer receives per 1 unit of foreign currency.
  quoted_rates jsonb NOT NULL DEFAULT '{}'::jsonb,
  rates_updated_at timestamptz,
  rate_source text NOT NULL DEFAULT 'self_reported'
    CHECK (rate_source IN ('self_reported', 'admin', 'api')),
  -- Monetisation: free listing, paid verified badge, paid featured placement.
  subscription_tier text NOT NULL DEFAULT 'free'
    CHECK (subscription_tier IN ('free', 'verified', 'featured')),
  is_verified boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exchangers_active ON public.exchangers (is_active);
CREATE INDEX IF NOT EXISTS idx_exchangers_provider ON public.exchangers (provider_id);
CREATE INDEX IF NOT EXISTS idx_exchangers_featured ON public.exchangers (is_featured, is_verified);

ALTER TABLE public.exchangers ENABLE ROW LEVEL SECURITY;

-- Public can read active listings (the consumer comparison view).
CREATE POLICY "exchangers_public_read" ON public.exchangers
  FOR SELECT TO authenticated, anon
  USING (is_active = true);

-- A vendor manages the exchanger linked to a provider they own.
CREATE POLICY "exchangers_owner_rw" ON public.exchangers
  FOR ALL TO authenticated
  USING (
    provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid())
  )
  WITH CHECK (
    provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid())
  );

-- Admins / uno_team manage everything (verification, featuring, curated rows).
CREATE POLICY "exchangers_admin_write" ON public.exchangers
  FOR ALL TO authenticated
  USING (public.is_admin_or_uno_team())
  WITH CHECK (public.is_admin_or_uno_team());

CREATE TRIGGER set_exchangers_updated_at
  BEFORE UPDATE ON public.exchangers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. Extend reference currency coverage (UI shows USD/EUR/RUB/GBP/CNY) ---------
INSERT INTO public.currency_rates (base_currency, target_currency, rate, source) VALUES
  ('THB', 'GBP', 0.0232, 'manual'),
  ('THB', 'CNY', 0.2137, 'manual')
ON CONFLICT (base_currency, target_currency) DO NOTHING;

-- 3. Feature flag + affiliate config -----------------------------------------
INSERT INTO public.system_settings (key, value, description) VALUES
  ('feature_flag:currency_exchange',
   '{"enabled": false}'::jsonb,
   'Gates the currency exchange layer (verified exchangers + monetisation) until GA'),
  ('exchange_affiliate',
   '{"wise_url": "https://wise.com/invite", "crypto_onramp_url": ""}'::jsonb,
   'Affiliate links for digital remittance shown on the exchange page')
ON CONFLICT (key) DO NOTHING;

-- 4. Seed exchangers (previously hardcoded in ExchangeBotPage.tsx) -------------
-- Curated rows (provider_id NULL). Rates are indicative seeds; real values
-- come from vendor self-reporting or admin once the layer goes GA.
INSERT INTO public.exchangers
  (name, name_ru, area, area_ru, lat, lng, hours, rating, rate_source, is_verified, is_active)
VALUES
  ('SuperRich Phuket', 'SuperRich Пхукет', 'Phuket Town', 'Пхукет-Таун', 7.8804, 98.3923, '09:00-18:00', 4.8, 'admin', true, true),
  ('SiamExchange Patong', 'SiamExchange Патонг', 'Patong', 'Патонг', 7.8965, 98.2961, '10:00-22:00', 4.5, 'admin', false, true),
  ('Phuket Airport Exchange', 'Обменник в аэропорту', 'Airport', 'Аэропорт', 8.1082, 98.3169, '06:00-00:00', 3.9, 'admin', false, true),
  ('K79 Exchange Chalong', 'K79 Exchange Чалонг', 'Chalong', 'Чалонг', 7.8385, 98.3405, '09:30-17:30', 4.6, 'admin', true, true),
  ('TT Currency Kata', 'TT Currency Ката', 'Kata', 'Ката', 7.8206, 98.2989, '10:00-20:00', 4.4, 'admin', false, true)
ON CONFLICT DO NOTHING;

-- 5. Schedule the daily currency-rate refresh --------------------------------
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'update-currency-rates-daily') THEN
    PERFORM cron.unschedule('update-currency-rates-daily');
  END IF;
END $$;

-- 06:00 UTC daily. Anon JWT below is the public publishable key (browser-safe),
-- consistent with other scheduled functions in this repo.
SELECT cron.schedule(
  'update-currency-rates-daily',
  '0 6 * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://kakkwibljrjsawxgnupk.supabase.co/functions/v1/update-currency-rates',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtha2t3aWJsanJqc2F3eGdudXBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5MDM3MDAsImV4cCI6MjA4MzQ3OTcwMH0.0UOwpxLxDdxh_hpS_KXf_xnArkJjKCMmMXh_s5y5Cmk'
    ),
    body := jsonb_build_object('triggered_at', now())
  );
  $cron$
);
