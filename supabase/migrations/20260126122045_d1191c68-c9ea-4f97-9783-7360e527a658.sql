-- Create translations table for CMS
CREATE TABLE public.translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  category TEXT,
  value_ru TEXT NOT NULL,
  value_en TEXT NOT NULL,
  value_th TEXT,
  is_custom BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(key)
);

-- Create index for faster lookups
CREATE INDEX idx_translations_key ON public.translations(key);
CREATE INDEX idx_translations_category ON public.translations(category);

-- Enable RLS
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

-- Anyone can read translations (public)
CREATE POLICY "Anyone can read translations"
  ON public.translations
  FOR SELECT
  USING (true);

-- Only admins can insert translations
CREATE POLICY "Admins can insert translations"
  ON public.translations
  FOR INSERT
  WITH CHECK (public.is_admin_or_uno_team());

-- Only admins can update translations
CREATE POLICY "Admins can update translations"
  ON public.translations
  FOR UPDATE
  USING (public.is_admin_or_uno_team());

-- Only admins can delete translations
CREATE POLICY "Admins can delete translations"
  ON public.translations
  FOR DELETE
  USING (public.is_admin_or_uno_team());

-- Create trigger for updated_at
CREATE TRIGGER update_translations_updated_at
  BEFORE UPDATE ON public.translations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for translations
ALTER PUBLICATION supabase_realtime ADD TABLE public.translations;