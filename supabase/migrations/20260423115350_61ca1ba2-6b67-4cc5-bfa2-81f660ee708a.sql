
-- ════════════════════════════════════════════════════════════════════
-- M11.1 · Canonical profile columns (closes SEG-1)
-- ════════════════════════════════════════════════════════════════════

DO $$ BEGIN
  CREATE TYPE public.canonical_role AS ENUM (
    'tourist', 'resident', 'owner', 'investor',
    'developer', 'vendor', 'staff', 'admin'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS roles_stack JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS primary_role public.canonical_role;

COMMENT ON COLUMN public.profiles.roles_stack IS
  'Canonical multi-role stack per canon 01 §12. Array of {role, weight, source}. Weighted: primary*3 + secondary*2 + tertiary*1.';
COMMENT ON COLUMN public.profiles.primary_role IS
  'Canonical primary role per canon 01. Drives default surface routing.';

CREATE INDEX IF NOT EXISTS idx_profiles_primary_role ON public.profiles(primary_role) WHERE primary_role IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_roles_stack_gin ON public.profiles USING GIN(roles_stack);

-- ════════════════════════════════════════════════════════════════════
-- M11.7 · ClearView schema (closes CV-1)
-- ════════════════════════════════════════════════════════════════════

DO $$ BEGIN
  CREATE TYPE public.clearview_grade AS ENUM ('AAA', 'AA', 'A', 'BBB', 'BB');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.clearview_recommendation AS ENUM ('BUY', 'WATCH', 'AVOID');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.clearview_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  weight NUMERIC(4,2) NOT NULL CHECK (weight > 0 AND weight <= 1),
  display_order SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.clearview_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  developer_id UUID,
  location TEXT,
  total_score NUMERIC(5,2),
  grade public.clearview_grade,
  recommendation public.clearview_recommendation,
  maturity_step SMALLINT CHECK (maturity_step BETWEEN 1 AND 5),
  is_published BOOLEAN NOT NULL DEFAULT false,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.clearview_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.clearview_projects(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.clearview_categories(id) ON DELETE RESTRICT,
  score NUMERIC(4,2) NOT NULL CHECK (score >= 0 AND score <= 10),
  evidence TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_clearview_projects_published ON public.clearview_projects(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_clearview_scores_project ON public.clearview_scores(project_id);

INSERT INTO public.clearview_categories (code, name_en, name_ru, weight, display_order, description_en, description_ru) VALUES
  ('developer_credibility', 'Developer Credibility', 'Репутация застройщика', 0.20, 1, 'Track record, completed projects, financial stability.', 'Опыт, сданные проекты, финансовая устойчивость.'),
  ('legal_compliance',      'Legal Compliance',      'Юридическая чистота',  0.18, 2, 'Land title (Chanote), permits, escrow availability.', 'Право собственности (Chanote), разрешения, escrow.'),
  ('financial_health',      'Financial Health',      'Финансовое здоровье',  0.15, 3, 'Funding source, presales velocity, debt ratio.', 'Источник финансирования, темп продаж, долговая нагрузка.'),
  ('location_quality',      'Location Quality',      'Качество локации',     0.13, 4, 'Beach proximity, infrastructure, growth corridor.', 'Близость к морю, инфраструктура, коридор роста.'),
  ('product_quality',       'Product Quality',       'Качество продукта',    0.12, 5, 'Architecture, materials, amenities, layout.', 'Архитектура, материалы, удобства, планировки.'),
  ('rental_potential',      'Rental Potential',      'Арендный потенциал',   0.10, 6, 'Occupancy forecast, ADR, management options.', 'Прогноз заполняемости, средняя ставка, управление.'),
  ('exit_liquidity',        'Exit Liquidity',        'Выход / ликвидность',  0.07, 7, 'Resale market depth, assignment rules, foreign quota.', 'Глубина вторички, правила переуступки, квота иностранцев.'),
  ('construction_progress', 'Construction Progress', 'Ход строительства',    0.05, 8, 'Verified milestones, on-site progress vs schedule.', 'Подтверждённые этапы, прогресс vs график.')
ON CONFLICT (code) DO UPDATE SET
  weight = EXCLUDED.weight,
  display_order = EXCLUDED.display_order,
  name_en = EXCLUDED.name_en,
  name_ru = EXCLUDED.name_ru;

DROP TRIGGER IF EXISTS clearview_categories_updated_at ON public.clearview_categories;
CREATE TRIGGER clearview_categories_updated_at
  BEFORE UPDATE ON public.clearview_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS clearview_projects_updated_at ON public.clearview_projects;
CREATE TRIGGER clearview_projects_updated_at
  BEFORE UPDATE ON public.clearview_projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS clearview_scores_updated_at ON public.clearview_scores;
CREATE TRIGGER clearview_scores_updated_at
  BEFORE UPDATE ON public.clearview_scores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.clearview_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clearview_projects   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clearview_scores     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clearview_categories public read"
  ON public.clearview_categories FOR SELECT USING (true);
CREATE POLICY "clearview_categories admin write"
  ON public.clearview_categories FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "clearview_projects published read"
  ON public.clearview_projects FOR SELECT
  USING (is_published = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "clearview_projects admin write"
  ON public.clearview_projects FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "clearview_scores follow project"
  ON public.clearview_scores FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.clearview_projects p
    WHERE p.id = clearview_scores.project_id
      AND (p.is_published = true OR public.has_role(auth.uid(), 'admin'))
  ));
CREATE POLICY "clearview_scores admin write"
  ON public.clearview_scores FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ════════════════════════════════════════════════════════════════════
-- M11.11 · system_settings RLS scope
-- ════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS system_settings_public_read ON public.system_settings;

CREATE POLICY system_settings_authenticated_read
  ON public.system_settings FOR SELECT
  TO authenticated
  USING (true);

-- ════════════════════════════════════════════════════════════════════
-- Security · developers.stripe_connect_id exposure
-- ════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW public.developers_public AS
SELECT
  id, slug,
  COALESCE(display_name, name_en) AS name,
  name_en, name_ru,
  description_en, description_ru,
  logo_url, cover_image, website, phone, email, address, country,
  founded_year, projects_completed, projects_ongoing,
  total_units_sold, total_units_delivered, average_rating,
  is_verified, is_featured, is_active,
  muuno_score, devmod_status,
  created_at, updated_at
FROM public.developers
WHERE is_active = true;

GRANT SELECT ON public.developers_public TO anon, authenticated;

DROP POLICY IF EXISTS "Developers are viewable by everyone" ON public.developers;

CREATE POLICY "Developers viewable by authenticated"
  ON public.developers FOR SELECT
  TO authenticated
  USING (is_active = true);
