
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS i18n jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS i18n jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.marketplace_products ADD COLUMN IF NOT EXISTS i18n jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS i18n jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.listings.i18n IS 'Multilingual content: { ru: {name,description,...}, en: {...}, th: {...}, _source_lang: "th", _auto_translated: ["ru","en"] }';
COMMENT ON COLUMN public.providers.i18n IS 'Multilingual content (see listings.i18n)';
COMMENT ON COLUMN public.marketplace_products.i18n IS 'Multilingual content (see listings.i18n)';
COMMENT ON COLUMN public.services.i18n IS 'Multilingual content (see listings.i18n)';

CREATE INDEX IF NOT EXISTS idx_listings_i18n ON public.listings USING gin (i18n);
CREATE INDEX IF NOT EXISTS idx_providers_i18n ON public.providers USING gin (i18n);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_i18n ON public.marketplace_products USING gin (i18n);
CREATE INDEX IF NOT EXISTS idx_services_i18n ON public.services USING gin (i18n);
