
-- Create experience_pricing table
CREATE TABLE IF NOT EXISTS public.experience_pricing (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  experience_id uuid NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
  price_name text NOT NULL,
  price_type text NOT NULL DEFAULT 'per_person',
  min_pax int,
  max_pax int,
  price_thb numeric NOT NULL,
  price_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT experience_pricing_type_check CHECK (price_type IN ('per_person','per_child','per_group','per_day','addon'))
);

CREATE INDEX IF NOT EXISTS idx_experience_pricing_experience ON public.experience_pricing(experience_id);
ALTER TABLE public.experience_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read experience pricing"
  ON public.experience_pricing FOR SELECT USING (true);

CREATE POLICY "Admins can manage experience pricing"
  ON public.experience_pricing FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type IN ('admin','uno_team')));

-- Create experience_media table
CREATE TABLE IF NOT EXISTS public.experience_media (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  experience_id uuid NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
  media_type text NOT NULL DEFAULT 'image',
  source_image_url text,
  stored_path text,
  alt_text text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_experience_media_experience ON public.experience_media(experience_id);
ALTER TABLE public.experience_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read experience media"
  ON public.experience_media FOR SELECT USING (true);

CREATE POLICY "Admins can manage experience media"
  ON public.experience_media FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type IN ('admin','uno_team')));

-- Storage bucket for tour media
INSERT INTO storage.buckets (id, name, public)
VALUES ('tour-media', 'tour-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Tour media publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'tour-media');

CREATE POLICY "Admins can upload tour media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'tour-media'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type IN ('admin','uno_team'))
  );
