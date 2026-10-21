ALTER TABLE public.bouquets ADD COLUMN IF NOT EXISTS i18n jsonb NOT NULL DEFAULT '{}'::jsonb;
CREATE INDEX IF NOT EXISTS bouquets_i18n_gin_idx ON public.bouquets USING gin (i18n jsonb_path_ops);