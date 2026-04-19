-- Extend property_budgets for multi-scenario / multi-year planning
ALTER TABLE public.property_budgets
  ADD COLUMN IF NOT EXISTS scenario text NOT NULL DEFAULT 'base',
  ADD COLUMN IF NOT EXISTS year int;

-- Backfill year from budget_month for existing rows
UPDATE public.property_budgets
SET year = EXTRACT(YEAR FROM budget_month)::int
WHERE year IS NULL;

-- Financial models table (drivers + capex + loans + assumptions)
CREATE TABLE IF NOT EXISTS public.property_financial_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NULL,
  company_id uuid NULL,
  owner_id uuid NOT NULL,
  model_year int NOT NULL,
  scenario text NOT NULL DEFAULT 'base',
  drivers jsonb NOT NULL DEFAULT '{}'::jsonb,
  capex jsonb NOT NULL DEFAULT '[]'::jsonb,
  loans jsonb NOT NULL DEFAULT '[]'::jsonb,
  assumptions jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (property_id, model_year, scenario)
);

CREATE INDEX IF NOT EXISTS idx_pfm_owner ON public.property_financial_models(owner_id);
CREATE INDEX IF NOT EXISTS idx_pfm_company ON public.property_financial_models(company_id);
CREATE INDEX IF NOT EXISTS idx_pfm_property ON public.property_financial_models(property_id);

ALTER TABLE public.property_financial_models ENABLE ROW LEVEL SECURITY;

-- Owners manage their own models
CREATE POLICY "Owners view their financial models"
  ON public.property_financial_models FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners insert their financial models"
  ON public.property_financial_models FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners update their financial models"
  ON public.property_financial_models FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners delete their financial models"
  ON public.property_financial_models FOR DELETE
  USING (auth.uid() = owner_id);

-- Company members can view/update via has_company_membership if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'has_company_membership'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "Company members view financial models"
        ON public.property_financial_models FOR SELECT
        USING (company_id IS NOT NULL AND public.has_company_membership(company_id))
    $p$;
    EXECUTE $p$
      CREATE POLICY "Company members modify financial models"
        ON public.property_financial_models FOR UPDATE
        USING (company_id IS NOT NULL AND public.has_company_membership(company_id))
    $p$;
    EXECUTE $p$
      CREATE POLICY "Company members insert financial models"
        ON public.property_financial_models FOR INSERT
        WITH CHECK (company_id IS NOT NULL AND public.has_company_membership(company_id))
    $p$;
  END IF;
END $$;

-- Update timestamp trigger
DROP TRIGGER IF EXISTS trg_pfm_updated_at ON public.property_financial_models;
CREATE TRIGGER trg_pfm_updated_at
  BEFORE UPDATE ON public.property_financial_models
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();