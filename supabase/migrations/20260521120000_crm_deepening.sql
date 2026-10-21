-- ============================================================================
-- MC CRM Deepening — Boutique Real Estate Advisory Spec
-- ============================================================================
-- Adds:
--   1. crm_pipelines.side ('buy' | 'sell' | NULL)
--   2. crm_contacts.relationship_tier ('A' | 'B' | 'C' | NULL)
--   3. agent_deals commission splits (agent / firm / referral) + referral contact FK
--   4. agent_deals.deal_property_notes jsonb (deal-specific property notes)
--   5. Trigger: crm_activities INSERT → crm_contacts.last_activity_at = activity_date
--   6. Seed: 2 pipelines per management_company (Buy-Side, Sell-Side) with 7 stages each
--
-- Idempotent: every statement guarded with IF NOT EXISTS / WHERE NOT EXISTS.
-- Re-running this migration is safe.
-- ============================================================================

-- ─── 1. crm_pipelines.side ───────────────────────────────────────────────
ALTER TABLE public.crm_pipelines
  ADD COLUMN IF NOT EXISTS side TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'crm_pipelines_side_check'
  ) THEN
    ALTER TABLE public.crm_pipelines
      ADD CONSTRAINT crm_pipelines_side_check
      CHECK (side IS NULL OR side IN ('buy', 'sell'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_crm_pipelines_company_side
  ON public.crm_pipelines(company_id, side)
  WHERE side IS NOT NULL;

-- ─── 2. crm_contacts.relationship_tier ───────────────────────────────────
ALTER TABLE public.crm_contacts
  ADD COLUMN IF NOT EXISTS relationship_tier TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'crm_contacts_relationship_tier_check'
  ) THEN
    ALTER TABLE public.crm_contacts
      ADD CONSTRAINT crm_contacts_relationship_tier_check
      CHECK (relationship_tier IS NULL OR relationship_tier IN ('A', 'B', 'C'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_crm_contacts_company_tier
  ON public.crm_contacts(company_id, relationship_tier);

-- ─── 3. agent_deals commission splits + referral ─────────────────────────
ALTER TABLE public.agent_deals
  ADD COLUMN IF NOT EXISTS agent_split_percent NUMERIC(5, 2),
  ADD COLUMN IF NOT EXISTS firm_split_percent NUMERIC(5, 2),
  ADD COLUMN IF NOT EXISTS referral_fee_percent NUMERIC(5, 2),
  ADD COLUMN IF NOT EXISTS referral_contact_id UUID
    REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS deal_property_notes JSONB DEFAULT '{}'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'agent_deals_splits_total_check'
  ) THEN
    ALTER TABLE public.agent_deals
      ADD CONSTRAINT agent_deals_splits_total_check
      CHECK (
        COALESCE(agent_split_percent, 0)
        + COALESCE(firm_split_percent, 0)
        + COALESCE(referral_fee_percent, 0)
        <= 100
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_agent_deals_referral_contact
  ON public.agent_deals(referral_contact_id)
  WHERE referral_contact_id IS NOT NULL;

-- ─── 4. crm_activities → contact last_activity_at trigger ────────────────
-- Reuses existing crm_activities table (no new table). When an activity is
-- logged against a contact, bump crm_contacts.last_activity_at so the cold-
-- contacts widget reflects the latest engagement.
CREATE OR REPLACE FUNCTION public.crm_activities_set_last_activity_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.contact_id IS NOT NULL THEN
    UPDATE public.crm_contacts
      SET last_activity_at = COALESCE(NEW.activity_date, now())
      WHERE id = NEW.contact_id
        AND (last_activity_at IS NULL OR last_activity_at < COALESCE(NEW.activity_date, now()));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_crm_activities_set_last_activity_at ON public.crm_activities;
CREATE TRIGGER trg_crm_activities_set_last_activity_at
  AFTER INSERT ON public.crm_activities
  FOR EACH ROW
  EXECUTE FUNCTION public.crm_activities_set_last_activity_at();

-- ─── 5. Seed Buy-Side & Sell-Side pipelines per company ──────────────────
-- For every management_company, ensure exactly one (side='buy') pipeline and
-- one (side='sell') pipeline exist, each with 7 stages.
DO $$
DECLARE
  v_company RECORD;
  v_buy_pipeline_id UUID;
  v_sell_pipeline_id UUID;
  v_next_sort INT;
BEGIN
  FOR v_company IN
    SELECT id AS company_id FROM public.management_companies
  LOOP
    -- ── Buy-Side ──
    SELECT id INTO v_buy_pipeline_id
      FROM public.crm_pipelines
      WHERE company_id = v_company.company_id AND side = 'buy'
      LIMIT 1;

    IF v_buy_pipeline_id IS NULL THEN
      SELECT COALESCE(MAX(sort_order), -1) + 1
        INTO v_next_sort
        FROM public.crm_pipelines
        WHERE company_id = v_company.company_id;

      INSERT INTO public.crm_pipelines
        (company_id, name_en, name_ru, pipeline_type, side,
         is_default, sort_order, is_active)
      VALUES
        (v_company.company_id, 'Buy-Side', 'Покупка', 'sales', 'buy',
         false, v_next_sort, true)
      RETURNING id INTO v_buy_pipeline_id;

      INSERT INTO public.crm_pipeline_stages
        (pipeline_id, name_en, name_ru, probability, color, sort_order, is_won, is_lost)
      VALUES
        (v_buy_pipeline_id, 'Qualified',       'Квалифицирован',  10,  'info',        0, false, false),
        (v_buy_pipeline_id, 'Searching',       'Поиск',           25,  'info',        1, false, false),
        (v_buy_pipeline_id, 'Shortlisted',     'Шортлист',        45,  'warning',     2, false, false),
        (v_buy_pipeline_id, 'Offer',           'Оффер',           65,  'warning',     3, false, false),
        (v_buy_pipeline_id, 'Due Diligence',   'Due Diligence',   80,  'accent',      4, false, false),
        (v_buy_pipeline_id, 'Closed Won',      'Закрыта (успех)', 100, 'success',     5, true,  false),
        (v_buy_pipeline_id, 'Closed Lost',     'Закрыта (нет)',   0,   'destructive', 6, false, true);
    END IF;

    -- ── Sell-Side ──
    SELECT id INTO v_sell_pipeline_id
      FROM public.crm_pipelines
      WHERE company_id = v_company.company_id AND side = 'sell'
      LIMIT 1;

    IF v_sell_pipeline_id IS NULL THEN
      SELECT COALESCE(MAX(sort_order), -1) + 1
        INTO v_next_sort
        FROM public.crm_pipelines
        WHERE company_id = v_company.company_id;

      INSERT INTO public.crm_pipelines
        (company_id, name_en, name_ru, pipeline_type, side,
         is_default, sort_order, is_active)
      VALUES
        (v_company.company_id, 'Sell-Side', 'Продажа', 'sales', 'sell',
         false, v_next_sort, true)
      RETURNING id INTO v_sell_pipeline_id;

      INSERT INTO public.crm_pipeline_stages
        (pipeline_id, name_en, name_ru, probability, color, sort_order, is_won, is_lost)
      VALUES
        (v_sell_pipeline_id, 'Mandate Received', 'Мандат получен',  15,  'info',        0, false, false),
        (v_sell_pipeline_id, 'Priced & Listed',  'Оценён и в листинге', 30, 'info',     1, false, false),
        (v_sell_pipeline_id, 'Pitching',         'Питч',            50,  'warning',     2, false, false),
        (v_sell_pipeline_id, 'Offer Received',   'Оффер получен',   70,  'warning',     3, false, false),
        (v_sell_pipeline_id, 'Negotiation',      'Переговоры',      85,  'accent',      4, false, false),
        (v_sell_pipeline_id, 'Closed Won',       'Закрыта (успех)', 100, 'success',     5, true,  false),
        (v_sell_pipeline_id, 'Closed Lost',      'Закрыта (нет)',   0,   'destructive', 6, false, true);
    END IF;
  END LOOP;
END $$;

-- ─── 6. Reload PostgREST schema cache ────────────────────────────────────
NOTIFY pgrst, 'reload schema';
