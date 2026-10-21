
CREATE TABLE IF NOT EXISTS public.official_news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  source_label text NOT NULL,
  url text NOT NULL UNIQUE,
  title text NOT NULL,
  summary text,
  image_url text,
  lang text NOT NULL DEFAULT 'en',
  published_at timestamptz,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS official_news_published_at_idx ON public.official_news (published_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS official_news_source_idx ON public.official_news (source);

GRANT SELECT ON public.official_news TO anon, authenticated;
GRANT ALL ON public.official_news TO service_role;

ALTER TABLE public.official_news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read official news"
  ON public.official_news FOR SELECT
  USING (true);

CREATE POLICY "Service role manages official news"
  ON public.official_news FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
