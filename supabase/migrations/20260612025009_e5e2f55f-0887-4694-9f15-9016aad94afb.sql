
ALTER TABLE public.official_news
  ADD COLUMN IF NOT EXISTS title_ru text,
  ADD COLUMN IF NOT EXISTS summary_ru text,
  ADD COLUMN IF NOT EXISTS translated_at timestamptz;
