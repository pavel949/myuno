
-- Phase 1: Add new columns for exclusions
ALTER TABLE public.yachts ADD COLUMN IF NOT EXISTS exclusions_en text[];
ALTER TABLE public.yachts ADD COLUMN IF NOT EXISTS exclusions_ru text[];

-- Fix charter_options to reflect actual pricing availability
UPDATE public.yachts SET charter_options = ARRAY(
  SELECT unnest FROM unnest(ARRAY[
    CASE WHEN price_half_day IS NOT NULL AND price_half_day > 0 THEN 'half_day' END,
    CASE WHEN price_full_day IS NOT NULL AND price_full_day > 0 THEN 'full_day' END,
    CASE WHEN price_sunset IS NOT NULL AND price_sunset > 0 THEN 'sunset' END,
    CASE WHEN price_overnight IS NOT NULL AND price_overnight > 0 THEN 'overnight' END
  ]) WHERE unnest IS NOT NULL
);

-- Generate slugs for yachts missing them
UPDATE public.yachts 
SET slug = lower(regexp_replace(regexp_replace(name_en, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL OR slug = '';

-- Populate departure_times with sensible defaults (text[] format)
UPDATE public.yachts 
SET departure_times = ARRAY['09:00', '13:00', '16:30']
WHERE departure_times IS NULL OR array_length(departure_times, 1) IS NULL;
