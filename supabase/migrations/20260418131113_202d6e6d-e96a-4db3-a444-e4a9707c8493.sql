-- ============================================
-- ClearView Due Diligence Reports
-- ============================================
CREATE TABLE IF NOT EXISTS public.due_diligence_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.property_projects(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,

  -- ClearView scoring
  total_score NUMERIC(5,2),                        -- 0-100
  grade TEXT CHECK (grade IN ('AAA','AA','A','BBB','BB')),
  risk_level TEXT CHECK (risk_level IN ('minimal','very_low','low','moderate','high')),

  -- 8 criteria scores (0-10 each, weighted in total_score)
  score_legal NUMERIC(4,2),                         -- 20%
  score_developer NUMERIC(4,2),                     -- 20%
  score_construction NUMERIC(4,2),                  -- 15%
  score_location NUMERIC(4,2),                      -- 15%
  score_financial NUMERIC(4,2),                     -- 10%
  score_returns NUMERIC(4,2),                       -- 10%
  score_marketing NUMERIC(4,2),                     -- 5%
  score_liquidity NUMERIC(4,2),                     -- 5%

  -- Modifiers applied
  modifiers JSONB DEFAULT '[]'::jsonb,              -- [{type:'bank_guarantee', delta:+2}, ...]

  -- Full structured analysis from AI
  analysis JSONB NOT NULL DEFAULT '{}'::jsonb,      -- {legal:{maturity_level, findings, evidence}, ...}
  red_flags TEXT[] DEFAULT ARRAY[]::TEXT[],
  green_flags TEXT[] DEFAULT ARRAY[]::TEXT[],
  recommendations TEXT[] DEFAULT ARRAY[]::TEXT[],
  executive_summary TEXT,

  -- Disclosure & meta
  is_brokered_project BOOLEAN DEFAULT false,        -- if true, must show conflict-of-interest banner
  is_published BOOLEAN DEFAULT false,
  paid_tier TEXT DEFAULT 'preview' CHECK (paid_tier IN ('preview','full')),

  -- AI generation metadata
  generated_by_ai BOOLEAN DEFAULT true,
  ai_model TEXT,
  ai_correlation_id TEXT,
  generated_at TIMESTAMPTZ DEFAULT now(),
  generated_by UUID REFERENCES auth.users(id),

  -- Review
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dd_reports_project ON public.due_diligence_reports(project_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_dd_reports_published ON public.due_diligence_reports(is_published, generated_at DESC) WHERE is_published = true;

ALTER TABLE public.due_diligence_reports ENABLE ROW LEVEL SECURITY;

-- Public can read published reports for active projects
CREATE POLICY "Public reads published DD reports"
ON public.due_diligence_reports FOR SELECT
USING (
  is_published = true
  AND project_id IN (SELECT id FROM public.property_projects WHERE is_active = true)
);

-- Admins full access
CREATE POLICY "Admins manage DD reports"
ON public.due_diligence_reports FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Developers can read DD for their own projects (even drafts)
CREATE POLICY "Developers read own DD reports"
ON public.due_diligence_reports FOR SELECT
TO authenticated
USING (
  project_id IN (
    SELECT pp.id FROM public.property_projects pp
    JOIN public.developers d ON d.id = pp.developer_id
    WHERE d.user_id = auth.uid()
  )
);

-- ============================================
-- Market Comparables
-- ============================================
CREATE TABLE IF NOT EXISTS public.market_comparables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  area_name TEXT NOT NULL,                          -- e.g., 'Bang Tao', 'Layan', 'Kamala'
  area_slug TEXT,
  unit_type TEXT NOT NULL,                          -- 'studio','1br','2br','3br','villa'
  bedrooms INTEGER,

  -- Price benchmarks (THB)
  avg_price_sqm_thb NUMERIC,
  min_price_sqm_thb NUMERIC,
  max_price_sqm_thb NUMERIC,
  median_price_sqm_thb NUMERIC,

  -- Yield benchmarks
  avg_gross_yield_pct NUMERIC,                      -- e.g., 7.5
  avg_net_yield_pct NUMERIC,
  avg_occupancy_pct NUMERIC,                        -- e.g., 75
  avg_appreciation_pct_yr NUMERIC,                  -- annual capital appreciation

  -- Market dynamics
  absorption_rate_pct NUMERIC,                      -- % units sold per quarter
  avg_time_to_sell_months NUMERIC,
  sample_size INTEGER,                              -- # of projects in dataset

  -- Source
  data_date DATE NOT NULL DEFAULT CURRENT_DATE,
  source TEXT,                                      -- 'internal', 'pantip_scrape', 'developer_report', etc.
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mkt_comp_area_type ON public.market_comparables(area_slug, unit_type, data_date DESC);

ALTER TABLE public.market_comparables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads market comparables"
ON public.market_comparables FOR SELECT
USING (true);

CREATE POLICY "Admins manage market comparables"
ON public.market_comparables FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- ============================================
-- Triggers for updated_at
-- ============================================
CREATE TRIGGER set_dd_reports_updated_at
BEFORE UPDATE ON public.due_diligence_reports
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_mkt_comparables_updated_at
BEFORE UPDATE ON public.market_comparables
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();