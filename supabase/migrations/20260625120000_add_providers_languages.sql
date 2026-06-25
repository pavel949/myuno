-- Add a spoken-languages array to providers so the master/provider language filter works.
-- Smoke-test finding P0.3: providers had no `languages` field, so filtering masters by the
-- language they speak was a no-op (contentAdapters returned []).
--
-- Stores ISO 639-1 codes (e.g. {'en','ru','th'}). Nullable + default empty so existing rows
-- and inserts are unaffected.

ALTER TABLE public.providers
  ADD COLUMN IF NOT EXISTS languages text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.providers.languages IS
  'Spoken languages as ISO 639-1 codes (e.g. {en,ru,th}); powers the provider/master language filter.';

-- GIN index so `languages && ARRAY[...]` overlap filters stay fast as the catalogue grows.
CREATE INDEX IF NOT EXISTS idx_providers_languages
  ON public.providers USING gin (languages);
