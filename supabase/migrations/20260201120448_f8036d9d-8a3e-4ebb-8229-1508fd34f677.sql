-- Create experience_categories table for admin-managed categories
CREATE TABLE public.experience_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  icon TEXT DEFAULT '🎯',
  experience_type TEXT DEFAULT 'all' CHECK (experience_type IN ('tour', 'activity', 'all')),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add index for faster sorting/filtering
CREATE INDEX idx_experience_categories_active ON public.experience_categories(is_active, sort_order);

-- Enable RLS
ALTER TABLE public.experience_categories ENABLE ROW LEVEL SECURITY;

-- Public read access (categories are public data)
CREATE POLICY "Anyone can view active categories"
ON public.experience_categories
FOR SELECT
USING (is_active = true);

-- Admin-only write access
CREATE POLICY "Admins can manage categories"
ON public.experience_categories
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed with existing categories
INSERT INTO public.experience_categories (slug, name_en, name_ru, icon, experience_type, sort_order) VALUES
  ('islands', 'Islands', 'Острова', '🏝️', 'tour', 1),
  ('culture', 'Culture', 'Культура', '🛕', 'tour', 2),
  ('nature', 'Nature', 'Природа', '🌿', 'tour', 3),
  ('adventure', 'Adventure', 'Приключения', '🧗', 'tour', 4),
  ('water-sports', 'Water Sports', 'Водный спорт', '🏄', 'tour', 5),
  ('diving', 'Diving', 'Дайвинг', '🤿', 'activity', 10),
  ('snorkeling', 'Snorkeling', 'Снорклинг', '🥽', 'activity', 11),
  ('fishing', 'Fishing', 'Рыбалка', '🎣', 'activity', 12),
  ('kayaking', 'Kayaking', 'Каякинг', '🛶', 'activity', 13),
  ('parasailing', 'Parasailing', 'Парасейлинг', '🪂', 'activity', 14),
  ('jet-ski', 'Jet Ski', 'Гидроцикл', '🚤', 'activity', 15),
  ('yacht', 'Yacht', 'Яхта', '⛵', 'activity', 16),
  ('surfing', 'Surfing', 'Серфинг', '🏄‍♂️', 'activity', 17),
  ('wakeboarding', 'Wakeboarding', 'Вейкбординг', '🏂', 'activity', 18);

-- Update trigger for updated_at
CREATE TRIGGER update_experience_categories_updated_at
BEFORE UPDATE ON public.experience_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();