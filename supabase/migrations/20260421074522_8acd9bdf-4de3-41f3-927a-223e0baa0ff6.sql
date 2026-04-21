-- =========================================================================
-- Phase A2 · Compliance Layer v0
-- Feature flag: compliance_layer_v0
-- =========================================================================

-- 1. compliance_obligation_types (catalog)
CREATE TABLE IF NOT EXISTS public.compliance_obligation_types (
  code text PRIMARY KEY,
  category text NOT NULL CHECK (category IN ('immigration','tax_th','tax_ru','property','corporate','other')),
  name_en text NOT NULL,
  name_ru text NOT NULL,
  description_en text,
  description_ru text,
  default_recurrence text NOT NULL DEFAULT 'annual' CHECK (default_recurrence IN ('one_time','monthly','quarterly','annual','per_event')),
  applies_to text NOT NULL DEFAULT 'individual' CHECK (applies_to IN ('individual','property_owner','company','vendor')),
  authority text,
  default_lead_days smallint NOT NULL DEFAULT 14,
  partner_managed boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order smallint DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.compliance_obligation_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read obligation catalog"
  ON public.compliance_obligation_types FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins manage catalog"
  ON public.compliance_obligation_types FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. compliance_filings
CREATE TABLE IF NOT EXISTS public.compliance_filings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  obligation_id uuid REFERENCES public.user_compliance_obligations(id) ON DELETE SET NULL,
  obligation_code text NOT NULL REFERENCES public.compliance_obligation_types(code),
  property_id uuid,
  period_start date,
  period_end date,
  due_date date,
  filed_at timestamptz,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','filed','accepted','rejected','cancelled')),
  amount numeric(14,2),
  currency text DEFAULT 'THB',
  receipt_number text,
  receipt_url text,
  filing_url text,
  filed_by_partner_id uuid,
  rejection_reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_compliance_filings_user ON public.compliance_filings(user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_filings_due ON public.compliance_filings(due_date) WHERE status IN ('pending','in_progress');
CREATE INDEX IF NOT EXISTS idx_compliance_filings_code ON public.compliance_filings(obligation_code);
CREATE INDEX IF NOT EXISTS idx_compliance_filings_partner ON public.compliance_filings(filed_by_partner_id) WHERE filed_by_partner_id IS NOT NULL;

ALTER TABLE public.compliance_filings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own filings"
  ON public.compliance_filings FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Partners see assigned filings"
  ON public.compliance_filings FOR SELECT TO authenticated
  USING (filed_by_partner_id = auth.uid());

CREATE POLICY "Partners update assigned filings"
  ON public.compliance_filings FOR UPDATE TO authenticated
  USING (filed_by_partner_id = auth.uid())
  WITH CHECK (filed_by_partner_id = auth.uid());

CREATE POLICY "Admins manage all filings"
  ON public.compliance_filings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. updated_at trigger
DO $$ BEGIN
  CREATE TRIGGER trg_compliance_filings_updated
    BEFORE UPDATE ON public.compliance_filings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. Seed catalog
INSERT INTO public.compliance_obligation_types
  (code, category, name_en, name_ru, description_en, description_ru, default_recurrence, applies_to, authority, default_lead_days, partner_managed, sort_order)
VALUES
  ('TM30','immigration','TM30 Address Notification','TM30 — уведомление об адресе',
   'Required when a foreigner stays at a residence; landlord/owner files within 24h.',
   'Подаётся владельцем/арендодателем в течение 24 часов после заселения иностранца.',
   'per_event','property_owner','Thai Immigration',1,true,10),
  ('TM47','immigration','TM47 90-day Report','TM47 — отчёт каждые 90 дней',
   'Foreigners on long-stay visas must report address every 90 days.',
   'Иностранцы с долгосрочной визой подают отчёт об адресе каждые 90 дней.',
   'quarterly','individual','Thai Immigration',7,false,20),
  ('VISA_RENEWAL','immigration','Visa Renewal','Продление визы',
   'Tracks visa expiry and renewal pipeline.',
   'Отслеживание срока визы и пайплайн продления.',
   'annual','individual','Thai Immigration',60,true,30),
  ('PND91','tax_th','PND.91 Personal Income Tax (TH)','PND.91 — личный подоходный налог Таиланда',
   'Annual personal income tax filing in Thailand.',
   'Ежегодная декларация по подоходному налогу физлица в Таиланде.',
   'annual','individual','Revenue Department TH',45,true,40),
  ('FET','tax_th','FET / FX Inflow Documentation','FET — документация о ввозе валюты',
   'Foreign Exchange Transaction form for property purchase from overseas funds.',
   'Документ о ввозе валюты для покупки недвижимости иностранцем.',
   'per_event','property_owner','Bank of Thailand',7,true,50),
  ('HOTEL_ACT','property','Hotel Act Track A/B/C','Hotel Act — треки A/B/C',
   'Short-term rental compliance under Thai Hotel Act.',
   'Соответствие требованиям Hotel Act для краткосрочной аренды.',
   'annual','property_owner','Provincial Office',30,true,60),
  ('CFC_RU','tax_ru','CFC Notification (RU)','Уведомление о КИК (РФ)',
   'Russian tax residents must report controlled foreign companies.',
   'Российские налоговые резиденты обязаны уведомлять о КИК.',
   'annual','individual','ФНС РФ',30,true,70),
  ('NDFL3_RU','tax_ru','3-NDFL Personal Tax Return (RU)','3-НДФЛ — декларация физлица (РФ)',
   'Russian personal income tax declaration for foreign income.',
   'Декларация 3-НДФЛ для дохода за рубежом.',
   'annual','individual','ФНС РФ',45,true,80)
ON CONFLICT (code) DO NOTHING;

-- 5. Feature flag
INSERT INTO public.system_settings (key, value)
VALUES ('feature_flag:compliance_layer_v0', '{"enabled": false, "rolloutPct": 0}'::jsonb)
ON CONFLICT (key) DO NOTHING;