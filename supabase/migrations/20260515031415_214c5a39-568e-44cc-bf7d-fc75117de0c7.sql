
-- Magnet Landings: visual builder pages bound to lead magnets
CREATE TABLE IF NOT EXISTS public.magnet_landings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  magnet_slug TEXT REFERENCES public.lead_magnets(slug) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  -- Bilingual SEO + hero copy
  title_ru TEXT NOT NULL DEFAULT '',
  title_en TEXT NOT NULL DEFAULT '',
  subtitle_ru TEXT,
  subtitle_en TEXT,
  seo_title_ru TEXT,
  seo_title_en TEXT,
  seo_description_ru TEXT,
  seo_description_en TEXT,
  hero_image_url TEXT,
  pdf_url TEXT,
  -- Blocks: ordered array of { id, type, props_ru, props_en, ... }
  blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
  theme JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_magnet_landings_slug ON public.magnet_landings(slug);
CREATE INDEX IF NOT EXISTS idx_magnet_landings_status ON public.magnet_landings(status);
CREATE INDEX IF NOT EXISTS idx_magnet_landings_magnet_slug ON public.magnet_landings(magnet_slug);

ALTER TABLE public.magnet_landings ENABLE ROW LEVEL SECURITY;

-- Public read of published landings
CREATE POLICY "Public can view published magnet landings"
ON public.magnet_landings FOR SELECT
USING (status = 'published');

-- Admins full access
CREATE POLICY "Admins manage magnet landings"
ON public.magnet_landings FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- updated_at trigger
CREATE TRIGGER update_magnet_landings_updated_at
BEFORE UPDATE ON public.magnet_landings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for landing assets (pdf, hero images)
INSERT INTO storage.buckets (id, name, public)
VALUES ('magnet-landings', 'magnet-landings', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read magnet-landings"
ON storage.objects FOR SELECT
USING (bucket_id = 'magnet-landings');

CREATE POLICY "Admins write magnet-landings"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'magnet-landings' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update magnet-landings"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'magnet-landings' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete magnet-landings"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'magnet-landings' AND public.has_role(auth.uid(), 'admin'));
