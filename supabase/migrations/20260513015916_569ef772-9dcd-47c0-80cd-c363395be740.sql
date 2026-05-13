
CREATE TABLE IF NOT EXISTS public.relocation_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  title_en TEXT NOT NULL,
  title_ru TEXT NOT NULL,
  summary_en TEXT,
  summary_ru TEXT,
  content_en TEXT,
  content_ru TEXT,
  related_route TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_relocation_articles_category ON public.relocation_articles(category);
CREATE INDEX IF NOT EXISTS idx_relocation_articles_published ON public.relocation_articles(is_published) WHERE is_published = true;

ALTER TABLE public.relocation_articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read published relocation articles" ON public.relocation_articles;
CREATE POLICY "Anyone can read published relocation articles"
  ON public.relocation_articles FOR SELECT
  USING (is_published = true);

DROP POLICY IF EXISTS "Admins manage relocation articles" ON public.relocation_articles;
CREATE POLICY "Admins manage relocation articles"
  ON public.relocation_articles FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role::text IN ('admin','uno_team','staff')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role::text IN ('admin','uno_team','staff')));

DROP TRIGGER IF EXISTS update_relocation_articles_updated_at ON public.relocation_articles;
CREATE TRIGGER update_relocation_articles_updated_at
  BEFORE UPDATE ON public.relocation_articles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.relocation_articles IS 'Bilingual relocation guides for Phuket; frontend falls back to bundled seeds if empty.';

CREATE TABLE IF NOT EXISTS public.relocation_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT relocation_plans_user_unique UNIQUE (user_id)
);
CREATE INDEX IF NOT EXISTS idx_relocation_plans_user ON public.relocation_plans(user_id);

ALTER TABLE public.relocation_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own relocation plan" ON public.relocation_plans;
CREATE POLICY "Users read own relocation plan" ON public.relocation_plans
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own relocation plan" ON public.relocation_plans;
CREATE POLICY "Users insert own relocation plan" ON public.relocation_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own relocation plan" ON public.relocation_plans;
CREATE POLICY "Users update own relocation plan" ON public.relocation_plans
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own relocation plan" ON public.relocation_plans;
CREATE POLICY "Users delete own relocation plan" ON public.relocation_plans
  FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_relocation_plans_updated_at ON public.relocation_plans;
CREATE TRIGGER update_relocation_plans_updated_at
  BEFORE UPDATE ON public.relocation_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.relocation_plans IS 'Personalized relocation checklist; optional localStorage mirror when logged out.';
