-- M9.6 Knowledge Hub seeding: pillar pages table

CREATE TABLE IF NOT EXISTS public.knowledge_pillars (
  slug TEXT PRIMARY KEY,
  cluster TEXT NOT NULL,
  h1_ru TEXT NOT NULL,
  h1_en TEXT NOT NULL,
  meta_title_ru TEXT NOT NULL,
  meta_title_en TEXT NOT NULL,
  meta_description_ru TEXT NOT NULL,
  meta_description_en TEXT NOT NULL,
  body_ru TEXT NOT NULL DEFAULT '',
  body_en TEXT NOT NULL DEFAULT '',
  hreflang JSONB NOT NULL DEFAULT '[]'::jsonb,
  related_slugs JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'placeholder' CHECK (status IN ('placeholder', 'live', 'archived')),
  word_count INTEGER NOT NULL DEFAULT 0,
  source_section TEXT,
  search_vector TSVECTOR,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Search vector trigger (RU + EN combined into 'simple' config so it works without russian dict)
CREATE OR REPLACE FUNCTION public.knowledge_pillars_refresh_search_vector()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', coalesce(NEW.h1_ru, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.h1_en, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.meta_title_ru, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.meta_title_en, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.meta_description_ru, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(NEW.meta_description_en, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(NEW.body_ru, '')), 'D') ||
    setweight(to_tsvector('simple', coalesce(NEW.body_en, '')), 'D');
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS knowledge_pillars_search_vector_trg ON public.knowledge_pillars;
CREATE TRIGGER knowledge_pillars_search_vector_trg
BEFORE INSERT OR UPDATE ON public.knowledge_pillars
FOR EACH ROW EXECUTE FUNCTION public.knowledge_pillars_refresh_search_vector();

CREATE INDEX IF NOT EXISTS idx_knowledge_pillars_search ON public.knowledge_pillars USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_knowledge_pillars_cluster ON public.knowledge_pillars(cluster);
CREATE INDEX IF NOT EXISTS idx_knowledge_pillars_status ON public.knowledge_pillars(status);

ALTER TABLE public.knowledge_pillars ENABLE ROW LEVEL SECURITY;

-- Public read: any visitor (including anon) can read live + placeholder pillars
DROP POLICY IF EXISTS "Anyone can read knowledge pillars" ON public.knowledge_pillars;
CREATE POLICY "Anyone can read knowledge pillars"
ON public.knowledge_pillars
FOR SELECT
USING (status IN ('live', 'placeholder'));

-- Only admins can modify (uses existing has_role function if present; otherwise restrict)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'has_role' AND pronamespace = 'public'::regnamespace) THEN
    EXECUTE 'CREATE POLICY "Admins manage knowledge pillars" ON public.knowledge_pillars FOR ALL TO authenticated USING (public.has_role(auth.uid(), ''admin''::app_role)) WITH CHECK (public.has_role(auth.uid(), ''admin''::app_role))';
  END IF;
END $$;