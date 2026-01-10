-- Create category_groups table for logical grouping
CREATE TABLE public.category_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.category_groups ENABLE ROW LEVEL SECURITY;

-- Public read access for category_groups (public catalog data)
CREATE POLICY "Category groups are publicly readable" 
ON public.category_groups 
FOR SELECT 
USING (true);

-- Add group_id to categories table to link to groups
ALTER TABLE public.categories 
ADD COLUMN group_id UUID REFERENCES public.category_groups(id);

-- Add color column for gradient styling
ALTER TABLE public.categories 
ADD COLUMN color TEXT;

-- Add is_new and is_hot flags for badges
ALTER TABLE public.categories 
ADD COLUMN is_new BOOLEAN DEFAULT false;

ALTER TABLE public.categories 
ADD COLUMN is_hot BOOLEAN DEFAULT false;

-- Insert category groups
INSERT INTO public.category_groups (slug, name_en, name_ru, sort_order) VALUES
('lifestyle', 'Lifestyle & Leisure', 'Стиль жизни', 1),
('travel', 'Travel & Transport', 'Путешествия и транспорт', 2),
('water', 'Water Activities', 'На воде', 3),
('health', 'Health & Care', 'Здоровье', 4),
('home', 'Home & Services', 'Дом и услуги', 5),
('professional', 'Professional', 'Профессиональные', 6);

-- Update existing categories with group assignments and styling
-- First get group IDs and update categories

-- Lifestyle group
UPDATE public.categories SET 
  group_id = (SELECT id FROM public.category_groups WHERE slug = 'lifestyle'),
  color = 'from-orange-500 to-red-500',
  is_hot = true
WHERE slug = 'restaurants';

UPDATE public.categories SET 
  group_id = (SELECT id FROM public.category_groups WHERE slug = 'lifestyle'),
  color = 'from-pink-500 to-purple-500'
WHERE slug = 'beauty-spa';

UPDATE public.categories SET 
  group_id = (SELECT id FROM public.category_groups WHERE slug = 'lifestyle'),
  color = 'from-blue-500 to-cyan-500'
WHERE slug = 'fitness';

UPDATE public.categories SET 
  group_id = (SELECT id FROM public.category_groups WHERE slug = 'lifestyle'),
  color = 'from-purple-500 to-pink-500'
WHERE slug = 'events';

-- Travel group
UPDATE public.categories SET 
  group_id = (SELECT id FROM public.category_groups WHERE slug = 'travel'),
  color = 'from-indigo-500 to-blue-500'
WHERE slug = 'transport';

-- Water group (create if not exists and update)
UPDATE public.categories SET 
  group_id = (SELECT id FROM public.category_groups WHERE slug = 'water'),
  color = 'from-cyan-500 to-blue-500'
WHERE slug IN ('diving', 'snorkeling', 'kayaking', 'jet-ski', 'parasailing', 'fishing');

-- Health group
UPDATE public.categories SET 
  group_id = (SELECT id FROM public.category_groups WHERE slug = 'health'),
  color = 'from-emerald-500 to-green-500'
WHERE slug = 'medical';

-- Home & Services group
UPDATE public.categories SET 
  group_id = (SELECT id FROM public.category_groups WHERE slug = 'home'),
  color = 'from-teal-500 to-emerald-500'
WHERE slug = 'real-estate';

UPDATE public.categories SET 
  group_id = (SELECT id FROM public.category_groups WHERE slug = 'home'),
  color = 'from-slate-500 to-zinc-600'
WHERE slug = 'services';

UPDATE public.categories SET 
  group_id = (SELECT id FROM public.category_groups WHERE slug = 'home'),
  color = 'from-cyan-500 to-blue-500'
WHERE slug = 'cleaning';

UPDATE public.categories SET 
  group_id = (SELECT id FROM public.category_groups WHERE slug = 'home'),
  color = 'from-emerald-500 to-teal-500'
WHERE slug = 'laundry';

-- Services subcategories
UPDATE public.categories SET 
  group_id = (SELECT id FROM public.category_groups WHERE slug = 'home'),
  color = 'from-blue-500 to-indigo-500'
WHERE slug IN ('plumbing', 'electrical', 'ac-repair', 'gardening', 'pest-control', 'handyman', 'locksmith', 'road-assistance');

-- Professional group
UPDATE public.categories SET 
  group_id = (SELECT id FROM public.category_groups WHERE slug = 'professional'),
  color = 'from-yellow-500 to-orange-500'
WHERE slug = 'kids-education';

-- Shopping
UPDATE public.categories SET 
  group_id = (SELECT id FROM public.category_groups WHERE slug = 'lifestyle'),
  color = 'from-emerald-500 to-teal-500'
WHERE slug = 'shopping';

-- Insert missing categories that are in UI but not in DB
INSERT INTO public.category_groups (slug, name_en, name_ru, sort_order) VALUES
('other', 'Other', 'Другое', 7)
ON CONFLICT (slug) DO NOTHING;

-- Insert tours category if missing
INSERT INTO public.categories (slug, name_en, name_ru, icon, mini_app_type, group_id, color, is_hot, sort_order)
SELECT 'tours', 'Tours', 'Экскурсии', 'Compass', 'tours', 
  (SELECT id FROM public.category_groups WHERE slug = 'travel'),
  'from-amber-500 to-orange-500', true, 30
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'tours');

-- Insert yachts category if missing
INSERT INTO public.categories (slug, name_en, name_ru, icon, mini_app_type, group_id, color, is_new, sort_order)
SELECT 'yachts', 'Yachts & Boats', 'Яхты и лодки', 'Anchor', 'yachts', 
  (SELECT id FROM public.category_groups WHERE slug = 'water'),
  'from-sky-500 to-blue-500', true, 31
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'yachts');

-- Insert water category if missing
INSERT INTO public.categories (slug, name_en, name_ru, icon, mini_app_type, group_id, color, sort_order)
SELECT 'water', 'Water Activities', 'Водные активности', 'Waves', 'water', 
  (SELECT id FROM public.category_groups WHERE slug = 'water'),
  'from-cyan-500 to-blue-500', 32
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'water');

-- Insert flowers category if missing
INSERT INTO public.categories (slug, name_en, name_ru, icon, mini_app_type, group_id, color, sort_order)
SELECT 'flowers', 'Flowers', 'Цветы', 'Flower2', 'flowers', 
  (SELECT id FROM public.category_groups WHERE slug = 'other'),
  'from-rose-500 to-pink-500', 40
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'flowers');

-- Insert pets category if missing
INSERT INTO public.categories (slug, name_en, name_ru, icon, mini_app_type, group_id, color, is_new, sort_order)
SELECT 'pets', 'Pet Care', 'Питомцы', 'PawPrint', 'pets', 
  (SELECT id FROM public.category_groups WHERE slug = 'health'),
  'from-amber-500 to-orange-500', true, 41
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'pets');

-- Insert pharmacy category if missing  
INSERT INTO public.categories (slug, name_en, name_ru, icon, mini_app_type, group_id, color, sort_order)
SELECT 'pharmacy', 'Pharmacy', 'Аптека', 'Pill', 'pharmacy', 
  (SELECT id FROM public.category_groups WHERE slug = 'health'),
  'from-green-500 to-emerald-500', 42
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'pharmacy');

-- Insert babysitter category if missing
INSERT INTO public.categories (slug, name_en, name_ru, icon, mini_app_type, group_id, color, is_new, sort_order)
SELECT 'babysitter', 'Babysitting', 'Няни', 'Baby', 'babysitter', 
  (SELECT id FROM public.category_groups WHERE slug = 'home'),
  'from-pink-500 to-rose-500', true, 43
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'babysitter');

-- Insert delivery category if missing
INSERT INTO public.categories (slug, name_en, name_ru, icon, mini_app_type, group_id, color, sort_order)
SELECT 'delivery', 'Delivery', 'Доставка', 'Package', 'delivery', 
  (SELECT id FROM public.category_groups WHERE slug = 'home'),
  'from-orange-500 to-amber-500', 44
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'delivery');

-- Insert market category if missing
INSERT INTO public.categories (slug, name_en, name_ru, icon, mini_app_type, group_id, color, is_new, sort_order)
SELECT 'market', 'Market', 'Магазин', 'ShoppingBag', 'market', 
  (SELECT id FROM public.category_groups WHERE slug = 'home'),
  'from-emerald-500 to-teal-500', true, 45
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'market');

-- Insert legal category if missing
INSERT INTO public.categories (slug, name_en, name_ru, icon, mini_app_type, group_id, color, sort_order)
SELECT 'legal', 'Legal', 'Юридические', 'Scale', 'legal', 
  (SELECT id FROM public.category_groups WHERE slug = 'professional'),
  'from-indigo-500 to-blue-600', 50
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'legal');

-- Insert education category if missing
INSERT INTO public.categories (slug, name_en, name_ru, icon, mini_app_type, group_id, color, sort_order)
SELECT 'education', 'Education', 'Образование', 'GraduationCap', 'education', 
  (SELECT id FROM public.category_groups WHERE slug = 'professional'),
  'from-yellow-500 to-orange-500', 51
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'education');

-- Create index for faster lookups
CREATE INDEX idx_categories_group_id ON public.categories(group_id);
CREATE INDEX idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX idx_category_groups_slug ON public.category_groups(slug);