
-- Add booking_model column to experiences
ALTER TABLE public.experiences ADD COLUMN IF NOT EXISTS booking_model text DEFAULT 'group';

-- Add new experience categories to lookup_values (correct column names)
INSERT INTO public.lookup_values (lookup_type, value_key, value_en, value_ru, icon, sort_order, is_active)
VALUES
  ('experience_category', 'shooting', 'Shooting Range', 'Тир', '🎯', 60, true),
  ('experience_category', 'escape-room', 'Escape Room', 'Квест-комната', '🔐', 61, true),
  ('experience_category', 'golf', 'Golf', 'Гольф', '⛳', 62, true),
  ('experience_category', 'extreme', 'Extreme', 'Экстрим', '🤸', 63, true),
  ('experience_category', 'wildlife', 'Wildlife', 'Животные', '🐘', 65, true),
  ('experience_category', 'food-tour', 'Food Tour', 'Гастротур', '🍜', 66, true),
  ('experience_category', 'city-tour', 'City Tour', 'Городской тур', '🏛️', 67, true),
  ('experience_category', 'paintball', 'Paintball', 'Пейнтбол', '🎨', 68, true)
ON CONFLICT DO NOTHING;

-- Add to experience_categories table
INSERT INTO public.experience_categories (slug, name_en, name_ru, icon, experience_type, sort_order, is_active)
VALUES
  ('shooting', 'Shooting Range', 'Тир', '🎯', 'activity', 20, true),
  ('escape-room', 'Escape Room', 'Квест-комната', '🔐', 'activity', 21, true),
  ('golf', 'Golf', 'Гольф', '⛳', 'activity', 22, true),
  ('extreme', 'Extreme', 'Экстрим', '🤸', 'activity', 23, true),
  ('wildlife', 'Wildlife', 'Животные', '🐘', 'activity', 24, true),
  ('food-tour', 'Food Tour', 'Гастротур', '🍜', 'tour', 25, true),
  ('city-tour', 'City Tour', 'Городской тур', '🏛️', 'tour', 26, true),
  ('paintball', 'Paintball', 'Пейнтбол', '🎨', 'activity', 27, true)
ON CONFLICT DO NOTHING;
