
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS short_description text,
  ADD COLUMN IF NOT EXISTS long_description text,
  ADD COLUMN IF NOT EXISTS pickup_included boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS inclusions jsonb,
  ADD COLUMN IF NOT EXISTS exclusions jsonb,
  ADD COLUMN IF NOT EXISTS notes jsonb,
  ADD COLUMN IF NOT EXISTS source_page_url text,
  ADD COLUMN IF NOT EXISTS booking_url text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft';

CREATE UNIQUE INDEX IF NOT EXISTS idx_experiences_slug ON public.experiences(slug) WHERE slug IS NOT NULL;
