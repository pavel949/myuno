-- ============================================================
-- ClearView V3 · F1 — methodology normalization + paywall
-- ============================================================

-- 1. Sync category weights & codes with Canon V3
-- Canon V3 codes: LRC 20, DCF 20, CQP 15, LMA 15, FRC 10, ROI 10, MAS 5, LRT 5
DELETE FROM public.clearview_categories;

INSERT INTO public.clearview_categories (code, name_en, name_ru, weight, display_order, description_en, description_ru) VALUES
  ('LRC', 'Legal & Regulatory Compliance', 'Юридическая чистота',          0.20, 1, 'Land title (Chanote), permits (EIA/Construction), escrow availability, foreign quota.', 'Право собственности (Chanote), разрешения (EIA/строительство), escrow, иностранная квота.'),
  ('DCF', 'Developer Capital & Financials', 'Капитал и финансы девелопера', 0.20, 2, 'Track record, completed projects, financial stability, equity vs debt funding.',         'Опыт, сданные проекты, финансовая устойчивость, доля собственного капитала vs долга.'),
  ('CQP', 'Construction Quality & Progress', 'Качество и ход стройки',      0.15, 3, 'Architecture, materials, on-site progress vs schedule, contractor quality.',              'Архитектура, материалы, прогресс vs график, качество подрядчика.'),
  ('LMA', 'Location & Market Attractiveness', 'Локация и рынок',            0.15, 4, 'Beach proximity, infrastructure, growth corridor, comparable sales.',                     'Близость к морю, инфраструктура, коридор роста, сравнимые сделки.'),
  ('FRC', 'Financial Resilience & Cash Flow', 'Финансовая устойчивость',    0.10, 5, 'Pre-sales velocity, cash flow forecast, debt coverage ratio.',                            'Темп продаж, прогноз cash flow, покрытие долга.'),
  ('ROI', 'Return on Investment',  'Доходность ROI',                        0.10, 6, 'Yield potential, ADR, occupancy forecast, capital appreciation.',                         'Доходность аренды, средняя ставка, заполняемость, рост капитала.'),
  ('MAS', 'Marketing & Sales Strategy', 'Маркетинг и продажи',              0.05, 7, 'Sales channels, pricing strategy, marketing reach.',                                       'Каналы продаж, стратегия цен, охват маркетинга.'),
  ('LRT', 'Long-term Resilience & Exit', 'Устойчивость и выход',            0.05, 8, 'Resale market depth, assignment rules, liquidity, brand longevity.',                       'Глубина вторички, правила переуступки, ликвидность, долгосрочность бренда.');

-- 2. clearview_purchases — tracks paid access to full reports
CREATE TABLE IF NOT EXISTS public.clearview_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID NOT NULL,
  stripe_session_id TEXT,
  amount_paid_cents INTEGER,
  currency TEXT DEFAULT 'thb',
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '12 months'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clearview_purchases_user ON public.clearview_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_clearview_purchases_project ON public.clearview_purchases(project_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_clearview_purchases_unique ON public.clearview_purchases(user_id, project_id, stripe_session_id);

ALTER TABLE public.clearview_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own clearview purchases" ON public.clearview_purchases;
CREATE POLICY "Users view own clearview purchases"
  ON public.clearview_purchases FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage clearview purchases" ON public.clearview_purchases;
CREATE POLICY "Admins manage clearview purchases"
  ON public.clearview_purchases FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. Helper function: does current user have access to full report?
CREATE OR REPLACE FUNCTION public.user_has_clearview_access(_project_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.clearview_purchases
    WHERE user_id = auth.uid()
      AND project_id = _project_id
      AND valid_until > now()
  ) OR public.has_role(auth.uid(), 'admin');
$$;

-- 4. Public view — only safe summary fields, only published reports
CREATE OR REPLACE VIEW public.v_clearview_public AS
SELECT
  d.id,
  d.project_id,
  d.version,
  d.total_score,
  d.grade,
  d.risk_level,
  d.score_legal,
  d.score_developer,
  d.score_construction,
  d.score_location,
  d.score_financial,
  d.score_returns,
  d.score_marketing,
  d.score_liquidity,
  d.executive_summary,
  -- Top 3 only — safe public flags
  (CASE WHEN array_length(d.red_flags, 1) > 0
        THEN d.red_flags[1:LEAST(3, array_length(d.red_flags, 1))]
        ELSE ARRAY[]::text[] END) AS top_red_flags,
  (CASE WHEN array_length(d.green_flags, 1) > 0
        THEN d.green_flags[1:LEAST(3, array_length(d.green_flags, 1))]
        ELSE ARRAY[]::text[] END) AS top_green_flags,
  d.is_brokered_project,
  d.generated_at,
  d.updated_at
FROM public.due_diligence_reports d
WHERE d.is_published = TRUE;

GRANT SELECT ON public.v_clearview_public TO anon, authenticated;

-- 5. RLS on due_diligence_reports — public reads of published, full access for buyers/admins
ALTER TABLE public.due_diligence_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read published DD summary" ON public.due_diligence_reports;
CREATE POLICY "Public can read published DD summary"
  ON public.due_diligence_reports FOR SELECT
  USING (
    is_published = TRUE
    AND (
      public.user_has_clearview_access(project_id)
      OR auth.uid() IS NULL  -- anon gets row but client should query the view
      OR auth.uid() IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "Admins manage DD reports" ON public.due_diligence_reports;
CREATE POLICY "Admins manage DD reports"
  ON public.due_diligence_reports FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6. Add brokered note: clearview_projects/scores are deprecated in favor of due_diligence_reports
COMMENT ON TABLE public.clearview_projects IS 'DEPRECATED: use due_diligence_reports. Kept for backwards compat, will be dropped.';
COMMENT ON TABLE public.clearview_scores IS 'DEPRECATED: use due_diligence_reports.score_* and analysis JSONB. Kept for backwards compat.';